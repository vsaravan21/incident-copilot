export type WebSearchHit = {
  title: string;
  url: string;
  domain: string;
  snippet: string;
};

export type WebSearchResponse = {
  status: "ok" | "unavailable" | "empty" | "error";
  provider: "tavily" | "duckduckgo" | "none";
  message: string;
  results: WebSearchHit[];
};

const PREFERRED_HOSTS = [
  "docs.fireworks.ai",
  "fireworks.ai",
  "docs.nvidia.com",
  "nvidia.com",
  "docs.vllm.ai",
  "vllm.ai",
  "pytorch.org",
  "huggingface.co",
  "arxiv.org",
  "github.com",
];

const BLOCKED_HOSTS = new Set([
  "duckduckgo.com",
  "youtube.com",
  "youtu.be",
  "facebook.com",
  "instagram.com",
  "tiktok.com",
]);

export function webSearchCredentialPresent() {
  return Boolean(tavilyApiKey() || process.env.WEB_SEARCH_API_KEY?.trim());
}

export async function searchWeb(
  query: string,
  limit = 5
): Promise<WebSearchResponse> {
  const trimmed = query.trim();
  const max = Math.min(Math.max(limit, 2), 5);

  if (!trimmed) {
    return {
      status: "empty",
      provider: "none",
      message: "Web retrieval was skipped because the search query was empty.",
      results: [],
    };
  }

  const tavily = tavilyApiKey();
  const enabled = Boolean(process.env.WEB_SEARCH_API_KEY?.trim() || tavily);

  if (!enabled) {
    return {
      status: "unavailable",
      provider: "none",
      message:
        "Web retrieval is not configured. Set TAVILY_API_KEY or WEB_SEARCH_API_KEY.",
      results: [],
    };
  }

  try {
    const raw = tavily
      ? await searchTavily(trimmed, max, tavily)
      : await searchDuckDuckGo(trimmed, max);
    const ranked = rankHits(raw).slice(0, max);

    if (ranked.length === 0) {
      return {
        status: "empty",
        provider: tavily ? "tavily" : "duckduckgo",
        message: "Web retrieval returned no useful sources for this query.",
        results: [],
      };
    }

    return {
      status: "ok",
      provider: tavily ? "tavily" : "duckduckgo",
      message: `Retrieved ${ranked.length} public source${ranked.length === 1 ? "" : "s"}.`,
      results: ranked,
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    const unauthorized = /invalid(?:\s+\w+)*\s+api key|unauthorized|401|403/i.test(detail);
    return {
      status: unauthorized ? "unavailable" : "error",
      provider: tavily ? "tavily" : "duckduckgo",
      message: unauthorized
        ? "Web retrieval is misconfigured. Check TAVILY_API_KEY."
        : `Web retrieval failed: ${detail}`,
      results: [],
    };
  }
}

function tavilyApiKey() {
  const dedicated = process.env.TAVILY_API_KEY?.trim();
  if (dedicated) return dedicated;
  const shared = process.env.WEB_SEARCH_API_KEY?.trim();
  if (shared?.startsWith("tvly-")) return shared;
  return "";
}

async function searchTavily(
  query: string,
  limit: number,
  apiKey: string
): Promise<WebSearchHit[]> {
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query,
      max_results: limit,
      search_depth: "basic",
      include_answer: false,
    }),
    signal: AbortSignal.timeout(12_000),
  });

  if (response.status === 401 || response.status === 403) {
    throw new Error("missing or invalid Tavily API key.");
  }
  if (!response.ok) {
    throw new Error(`Tavily HTTP ${response.status}`);
  }

  const payload = (await response.json()) as {
    results?: Array<{ title?: unknown; url?: unknown; content?: unknown }>;
  };
  return (payload.results ?? [])
    .map((result) =>
      toHit(
        typeof result.title === "string" ? result.title : "",
        typeof result.url === "string" ? result.url : "",
        typeof result.content === "string" ? result.content : ""
      )
    )
    .filter((hit): hit is WebSearchHit => Boolean(hit));
}

async function searchDuckDuckGo(query: string, limit: number): Promise<WebSearchHit[]> {
  const body = new URLSearchParams({ q: query, kl: "us-en" });
  const response = await fetch("https://html.duckduckgo.com/html/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "IncidentCopilot/0.1 (internal support investigation tool)",
    },
    body,
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) {
    throw new Error(`DuckDuckGo HTTP ${response.status}`);
  }

  const html = await response.text();
  return parseDuckDuckGoHtml(html).slice(0, limit + 4);
}

export function parseDuckDuckGoHtml(html: string): WebSearchHit[] {
  const blocks = html.split(/class="result__a"/).slice(1);
  const hits: WebSearchHit[] = [];

  for (const block of blocks) {
    if (/result--ad|badge--ad/.test(block)) continue;
    const href = decodeDuckDuckGoHref(
      firstMatch(block, /href="([^"]+)"/) ?? ""
    );
    const title = decodeHtml(firstMatch(block, />([\s\S]*?)<\/a>/) ?? "");
    const snippet = decodeHtml(
      firstMatch(block, /class="result__snippet"[^>]*>([\s\S]*?)<\/(?:a|td|div)/) ??
        ""
    );
    const hit = toHit(title, href, snippet);
    if (hit) hits.push(hit);
  }

  return dedupeHits(hits);
}

function toHit(title: string, url: string, snippet: string): WebSearchHit | null {
  const parsed = safeUrl(url);
  if (!parsed) return null;
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  const domain = parsed.hostname.replace(/^www\./, "");
  if (BLOCKED_HOSTS.has(domain)) return null;
  const cleanTitle = title.replace(/\s+/g, " ").trim();
  if (!cleanTitle) return null;
  return {
    title: cleanTitle,
    url: parsed.toString(),
    domain,
    snippet: snippet.replace(/\s+/g, " ").trim().slice(0, 280),
  };
}

function rankHits(hits: WebSearchHit[]) {
  return [...hits].sort((a, b) => preferredRank(a.domain) - preferredRank(b.domain));
}

function preferredRank(domain: string) {
  const index = PREFERRED_HOSTS.findIndex(
    (host) => domain === host || domain.endsWith(`.${host}`)
  );
  return index === -1 ? PREFERRED_HOSTS.length + 1 : index;
}

function dedupeHits(hits: WebSearchHit[]) {
  const seen = new Set<string>();
  return hits.filter((hit) => {
    const key = hit.url.replace(/\/$/, "");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function decodeDuckDuckGoHref(href: string) {
  const absolute = href.startsWith("//") ? `https:${href}` : href;
  try {
    const parsed = new URL(absolute);
    const uddg = parsed.searchParams.get("uddg");
    return uddg ? decodeURIComponent(uddg) : parsed.toString();
  } catch {
    return href;
  }
}

function safeUrl(value: string) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function firstMatch(text: string, pattern: RegExp) {
  return text.match(pattern)?.[1];
}

function decodeHtml(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}
