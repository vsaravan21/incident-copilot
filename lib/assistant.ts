import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { getIncidentById, searchIncidents, type Incident } from "@/lib/search";
import {
  FALLBACK_QUESTIONS,
  assessmentTypeFromHistorical,
  type AssessmentType,
  type ExternalSource,
  type HistoricalEvidenceStatus,
  type Investigation,
  type WebRetrievalStatus,
} from "@/lib/investigation";
import type { ConversationTurn } from "@/lib/session";
import { searchWeb, type WebSearchHit, type WebSearchResponse } from "@/lib/web-search";

const MAX_TOOL_ROUNDS = 6;

const TOOLS: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "search_incidents",
      description:
        "Search the internal Fireworks historical incident corpus by symptoms, product area, or keywords. Use this before making any historical claim. Returns a small ranked set.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "Search terms describing the customer issue, such as TTFT, streaming stall, or agent loop.",
          },
          limit: {
            type: "integer",
            description: "Maximum incidents to return. Default 4, max 6.",
          },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_incident",
      description:
        "Load the full record for one incident ID returned by search_incidents, including symptoms, root cause, resolution, and support notes.",
      parameters: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Incident ID such as INC-102.",
          },
        },
        required: ["id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_web",
      description:
        "Search public technical sources. Returns real titles, URLs, and snippets, or an unavailable/empty status. Prefer Fireworks docs, official vendor/project docs, primary research, and reputable engineering sources. Never invent URLs. Web evidence is secondary to internal incidents and must not be presented as Fireworks history.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "A focused technical query, for example 'Fireworks AI TTFT prefill prompt length' or 'GPU thermal throttling H100'.",
          },
          limit: {
            type: "integer",
            description: "Maximum sources to return. Default 5, max 5.",
          },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
];

const SYSTEM_PROMPT = `You are Incident Copilot, an internal tool for Fireworks support engineers.

Optimize for maximum useful technical guidance while maintaining truthful provenance. The historical incident corpus is an important evidence source, not the only source of diagnosis.

Every user message starts a fresh investigation cycle. Prior assistant messages are hypotheses, not facts. Re-evaluate prior hypotheses, historical evidence, how directly previously retrieved incidents apply, and what else to ask. New context can strengthen, weaken, or overturn a conclusion. Do not discard a historical mechanism only because the environment differs. Distinguish "this evidence is less directly applicable" from "this mechanism is contradicted." If the conclusion changed, set revised=true and explain why in revisionNote.

Three evidence kinds — never collapse them:
1. HISTORICAL INCIDENT EVIDENCE — claims explicitly supported by incident records retrieved this turn. Cite only those IDs. Never fabricate IDs. Never imply Fireworks previously observed something unless a retrieved incident supports it. An analog is not a confirmed match.
2. GENERAL TECHNICAL MODEL KNOWLEDGE — hypotheses from general inference-system behavior. Use language such as "A plausible technical explanation is...", "One mechanism worth testing is...", "Based on general inference-system behavior...". Never present this as retrieved evidence or Fireworks history.
3. EXTERNAL WEB EVIDENCE — only titles/URLs returned by search_web this turn. Never invent URLs, titles, publishers, or citations. Never present web pages as internal Fireworks history. If search_web is unavailable, errors, or empty, say so and continue with internal evidence plus labeled general reasoning.

historicalEvidenceStatus:
- "strong": retrieved incidents closely match symptoms and likely mechanism. Lead with historicalAssessment. Do NOT label the overall diagnosis as not historically grounded. generalTechnicalAssessment only if it adds extra hypotheses or debugging steps.
- "analogous": useful mechanism, material differences. Name the limitation. Example: "INC-102 provides a relevant historical analog. It shows that larger prompts can increase prefill work and TTFT, but it does not establish that this is the cause in this customer's on-prem H100 deployment." Then generalTechnicalAssessment explores the current environment.
- "none": no meaningful incident. historicalAssessment must state that the internal corpus does not contain a prior case that directly supports this diagnosis. Then provide generalTechnicalAssessment as the primary guidance, labeled as not grounded in internal incident history. Do not stop at "no match."

- insufficientContext: true only when the customer description is too thin for even a useful hypothesis (for example "it's broken" with no symptom). Ask 2–4 questions. Do not invent a diagnosis. Do not use this merely because the corpus has no match. A concrete symptom such as GPU overheating, TTFT increase, or a streaming stall is enough context for a hypothesis.

Rules:
- On every user turn, call search_incidents before any historical claim. Do not reuse prior evidenceIds unless this turn's tools retrieve them.
- Call get_incident for incidents you may cite this turn.
- Call search_web at least once unless insufficientContext is true. Prefer Fireworks docs, official vendor/project docs, primary research, and reputable engineering writeups. Use 2–5 sources when they are actually returned.
- Do not discard an incident only because one dimension differs; prefer analogous over none when a mechanism still transfers.
- Similar symptoms can have different causes. Do not collapse incidents just because they share a keyword such as latency.
- investigationSteps / nextSteps: 3–5 compact operational checks that would confirm or reject the hypotheses. Prefix each with COMPARE, ISOLATE, VERIFY, CHECK, ASK, REVIEW, MEASURE, CAPTURE, or CONFIRM.
- For analogous citations, evidenceNotes must state the shared pattern AND the limitation.
- externalSources: only URLs returned by search_web this turn, each with a short relevance note. If search_web was unavailable or empty, leave the array empty and set webRetrievalNote to that fact.
- Return JSON only after tools have run.

Return a single JSON object:
{
  "historicalEvidenceStatus": "strong" | "analogous" | "none",
  "insufficientContext": boolean,
  "historicalAssessment": string,
  "generalTechnicalAssessment": string,
  "investigationSteps": string[],
  "evidenceIds": string[],
  "followUpQuestions": string[],
  "evidenceNotes": { "INC-102": "string" },
  "externalSources": [{ "url": "https://...", "relevance": "string" }],
  "webRetrievalNote": string,
  "revised": boolean,
  "revisionNote": string
}`;

type ModelInvestigation = {
  historicalEvidenceStatus: HistoricalEvidenceStatus;
  insufficientContext: boolean;
  historicalAssessment: string;
  generalTechnicalAssessment: string;
  nextSteps: string[];
  evidenceIds: string[];
  followUpQuestions: string[];
  evidenceNotes: Record<string, string>;
  externalSources: Array<{ url: string; relevance: string }>;
  webRetrievalNote: string;
  revised: boolean;
  revisionNote?: string;
};

const FOLLOW_UP_REMINDER = `

Reconsider the previous hypothesis — it is not ground truth. Search incidents again. Call search_web again. Cite only IDs and URLs retrieved this turn. Update both the general technical hypothesis and how directly historical incidents apply. Do not drop a prior mechanism only because a new dimension (hardware, region, product) is missing from the corpus; say whether the new information contradicts the mechanism or only weakens the analog. Set revised=true if the conclusion changed.`;

const NO_CORPUS_MATCH =
  "The internal incident corpus does not contain a prior case that directly supports this diagnosis.";

function messageText(message: OpenAI.Chat.ChatCompletionMessage | undefined) {
  if (!message) return "";
  if (message.content) return message.content;
  const extra = message as OpenAI.Chat.ChatCompletionMessage & {
    reasoning_content?: unknown;
  };
  return typeof extra.reasoning_content === "string"
    ? extra.reasoning_content
    : "";
}

function sanitizeToolCalls(
  toolCalls: NonNullable<OpenAI.Chat.ChatCompletionMessage["tool_calls"]>
) {
  return toolCalls.flatMap((call) => {
    if (call.type !== "function") return [];
    return [
      {
        id: call.id,
        type: "function" as const,
        function: {
          name: call.function.name,
          arguments: call.function.arguments,
        },
      },
    ];
  });
}

function compactIncident(incident: Incident) {
  return {
    id: incident.id,
    title: incident.title,
    date: incident.date,
    product: incident.product,
    summary: incident.summary,
    tags: incident.tags,
  };
}

async function runTool(
  name: string,
  rawArgs: string
): Promise<{ payload: string; ids: string[]; hits: WebSearchHit[]; web?: WebSearchResponse }> {
  let args: Record<string, unknown> = {};
  try {
    args = JSON.parse(rawArgs || "{}") as Record<string, unknown>;
  } catch {
    return {
      payload: JSON.stringify({ error: "Invalid tool arguments." }),
      ids: [],
      hits: [],
    };
  }

  if (name === "search_incidents") {
    const query = typeof args.query === "string" ? args.query : "";
    const limit = Math.min(typeof args.limit === "number" ? args.limit : 4, 6);
    const results = searchIncidents(query, limit);
    return {
      payload: JSON.stringify({ results: results.map(compactIncident) }),
      ids: results.map((incident) => incident.id),
      hits: [],
    };
  }

  if (name === "get_incident") {
    const id = typeof args.id === "string" ? args.id : "";
    const incident = getIncidentById(id);
    if (!incident) {
      return {
        payload: JSON.stringify({ error: `No incident ${id}.` }),
        ids: [],
        hits: [],
      };
    }
    return { payload: JSON.stringify({ incident }), ids: [incident.id], hits: [] };
  }

  if (name === "search_web") {
    const query = typeof args.query === "string" ? args.query : "";
    const limit = typeof args.limit === "number" ? args.limit : 5;
    const web = await searchWeb(query, limit);
    return {
      payload: JSON.stringify(web),
      ids: [],
      hits: web.results,
      web,
    };
  }

  return {
    payload: JSON.stringify({ error: `Unknown tool ${name}.` }),
    ids: [],
    hits: [],
  };
}

function parseEvidenceNotes(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const notes: Record<string, string> = {};
  for (const [id, note] of Object.entries(value as Record<string, unknown>)) {
    if (typeof note === "string" && note.trim()) {
      notes[id] = note.trim();
    }
  }
  return notes;
}

function fillFollowUps(questions: string[]) {
  const cleaned = questions
    .map((question) => question.trim())
    .filter(Boolean)
    .slice(0, 4);
  if (cleaned.length >= 2) return cleaned;
  return FALLBACK_QUESTIONS.slice(0, 4);
}

function parseStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function parseIdList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item === "string") return [item];
    if (item && typeof item === "object" && "id" in item && typeof item.id === "string") {
      return [item.id];
    }
    return [];
  });
}

function parseHistoricalStatus(
  rawStatus: unknown,
  rawType: unknown,
  evidenceCount: number
): HistoricalEvidenceStatus {
  if (rawStatus === "strong" || rawStatus === "analogous" || rawStatus === "none") {
    return rawStatus;
  }
  if (rawType === "grounded" || rawType === "strong") return "strong";
  if (rawType === "analogous") return "analogous";
  if (rawType === "ungrounded" || rawType === "none") return "none";
  if (/analog/i.test(String(rawStatus ?? rawType ?? ""))) return "analogous";
  if (/strong|grounded|match/i.test(String(rawStatus ?? rawType ?? "")) && evidenceCount > 0) {
    return "strong";
  }
  return evidenceCount > 0 ? "analogous" : "none";
}

function parseExternalSourceRefs(value: unknown): Array<{ url: string; relevance: string }> {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item === "string") return [{ url: item, relevance: "" }];
    if (!item || typeof item !== "object") return [];
    const source = item as Record<string, unknown>;
    const url = typeof source.url === "string" ? source.url.trim() : "";
    if (!url) return [];
    return [
      {
        url,
        relevance: typeof source.relevance === "string" ? source.relevance.trim() : "",
      },
    ];
  });
}

function parseInvestigation(content: string): ModelInvestigation | null {
  const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced?.[1] ?? content;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;

  try {
    const parsed = JSON.parse(raw.slice(start, end + 1)) as {
      status?: string;
      assessmentType?: unknown;
      historicalEvidenceStatus?: unknown;
      insufficientContext?: unknown;
      assessment?: string;
      historicalAssessment?: unknown;
      generalTechnicalAssessment?: unknown;
      historicalEvidenceSummary?: unknown;
      nextSteps?: unknown;
      investigationSteps?: unknown;
      evidenceIds?: unknown;
      supportingIncidents?: unknown;
      followUpQuestions?: unknown;
      evidenceNotes?: unknown;
      externalSources?: unknown;
      webRetrievalNote?: unknown;
      revised?: unknown;
      revisionNote?: unknown;
    };
    const evidenceIds = parseIdList(parsed.evidenceIds).length
      ? parseIdList(parsed.evidenceIds)
      : parseIdList(parsed.supportingIncidents);
    const nextSteps = parseStringList(parsed.investigationSteps).length
      ? parseStringList(parsed.investigationSteps)
      : parseStringList(parsed.nextSteps);
    const insufficientContext =
      parsed.insufficientContext === true ||
      parsed.assessmentType === "insufficient_context" ||
      parsed.assessmentType === "insufficient-context";
    const historicalEvidenceStatus = parseHistoricalStatus(
      parsed.historicalEvidenceStatus,
      parsed.assessmentType,
      evidenceIds.length
    );
    const historicalAssessment =
      typeof parsed.historicalAssessment === "string"
        ? parsed.historicalAssessment
        : typeof parsed.historicalEvidenceSummary === "string"
          ? parsed.historicalEvidenceSummary
          : typeof parsed.assessment === "string" && historicalEvidenceStatus !== "none"
            ? parsed.assessment
            : "";
    const generalTechnicalAssessment =
      typeof parsed.generalTechnicalAssessment === "string"
        ? parsed.generalTechnicalAssessment
        : historicalEvidenceStatus === "none" && typeof parsed.assessment === "string"
          ? parsed.assessment
          : "";

    return {
      historicalEvidenceStatus,
      insufficientContext,
      historicalAssessment,
      generalTechnicalAssessment,
      nextSteps,
      evidenceIds,
      followUpQuestions: parseStringList(parsed.followUpQuestions),
      evidenceNotes: parseEvidenceNotes(parsed.evidenceNotes),
      externalSources: parseExternalSourceRefs(parsed.externalSources),
      webRetrievalNote:
        typeof parsed.webRetrievalNote === "string" ? parsed.webRetrievalNote.trim() : "",
      revised: parsed.revised === true,
      revisionNote:
        typeof parsed.revisionNote === "string" ? parsed.revisionNote.trim() : undefined,
    };
  } catch {
    return null;
  }
}

function hydrateExternalSources(
  requested: Array<{ url: string; relevance: string }>,
  hits: WebSearchHit[]
): ExternalSource[] {
  const byUrl = new Map(hits.map((hit) => [normalizeUrl(hit.url), hit]));
  const selected: ExternalSource[] = [];
  const seen = new Set<string>();

  for (const item of requested) {
    const hit = byUrl.get(normalizeUrl(item.url));
    if (!hit || seen.has(hit.url)) continue;
    seen.add(hit.url);
    selected.push({
      title: hit.title,
      url: hit.url,
      domain: hit.domain,
      snippet: hit.snippet,
      relevance: item.relevance || hit.snippet,
    });
    if (selected.length >= 5) return selected;
  }

  if (selected.length === 0) {
    for (const hit of hits.slice(0, 5)) {
      selected.push({
        title: hit.title,
        url: hit.url,
        domain: hit.domain,
        snippet: hit.snippet,
        relevance: hit.snippet,
      });
    }
  }

  return selected;
}

function normalizeUrl(url: string) {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    const path = parsed.pathname.replace(/\/$/, "");
    return `${parsed.protocol}//${parsed.hostname}${path}${parsed.search}`;
  } catch {
    return url.trim();
  }
}

function webStatusFromResponses(
  responses: WebSearchResponse[],
  sourceCount: number
): { status: WebRetrievalStatus; note: string } {
  if (responses.length === 0) {
    return {
      status: "skipped",
      note: "Web retrieval was not used for this turn.",
    };
  }
  if (responses.some((item) => item.status === "unavailable")) {
    const message =
      responses.find((item) => item.status === "unavailable")?.message ??
      "Web retrieval is unavailable.";
    return { status: "unavailable", note: message };
  }
  if (responses.some((item) => item.status === "error") && sourceCount === 0) {
    const message =
      responses.find((item) => item.status === "error")?.message ??
      "Web retrieval failed.";
    return { status: "unavailable", note: message };
  }
  if (sourceCount === 0) {
    return {
      status: "empty",
      note:
        responses.find((item) => item.status === "empty")?.message ??
        "Web retrieval returned no useful sources.",
    };
  }
  return {
    status: "retrieved",
    note: `Retrieved ${sourceCount} public source${sourceCount === 1 ? "" : "s"}.`,
  };
}

export function hydrateInvestigation(
  parsed: ModelInvestigation,
  retrievedIds: Set<string>,
  webHits: WebSearchHit[],
  webResponses: WebSearchResponse[],
  isFollowUp = false
): Investigation {
  const allowedIds = parsed.evidenceIds.filter((id) => retrievedIds.has(id));
  const cited = allowedIds
    .map((id) => getIncidentById(id))
    .filter((incident): incident is Incident => Boolean(incident));

  let historicalEvidenceStatus = parsed.historicalEvidenceStatus;
  let insufficientContext = parsed.insufficientContext;
  const hasUsefulHypothesis =
    parsed.generalTechnicalAssessment.trim().length > 60 ||
    parsed.historicalAssessment.trim().length > 60 ||
    parsed.nextSteps.length > 0;
  if (insufficientContext && (cited.length > 0 || hasUsefulHypothesis)) {
    insufficientContext = false;
  }
  if (
    (historicalEvidenceStatus === "strong" || historicalEvidenceStatus === "analogous") &&
    cited.length === 0
  ) {
    historicalEvidenceStatus = "none";
  }

  const assessmentType: AssessmentType = assessmentTypeFromHistorical(
    historicalEvidenceStatus,
    insufficientContext
  );
  const evidence =
    historicalEvidenceStatus === "strong" || historicalEvidenceStatus === "analogous"
      ? cited
      : [];

  const relevanceById: Record<string, string> = {};
  for (const [id, note] of Object.entries(parsed.evidenceNotes)) {
    if (evidence.some((incident) => incident.id === id) && note.trim()) {
      relevanceById[id] = note.trim();
    }
  }

  const historicalAssessment =
    historicalEvidenceStatus === "none"
      ? parsed.historicalAssessment.trim() || NO_CORPUS_MATCH
      : parsed.historicalAssessment.trim() || parsed.generalTechnicalAssessment.trim();

  const generalTechnicalAssessment =
    historicalEvidenceStatus === "strong"
      ? parsed.generalTechnicalAssessment.trim()
      : parsed.generalTechnicalAssessment.trim() ||
        (historicalEvidenceStatus === "none" ? parsed.historicalAssessment.trim() : "");

  const web = webStatusFromResponses(webResponses, webHits.length);
  const externalSources =
    web.status === "retrieved" ? hydrateExternalSources(parsed.externalSources, webHits) : [];

  const followUpQuestions = insufficientContext
    ? fillFollowUps(parsed.followUpQuestions)
    : parsed.followUpQuestions.slice(0, 4);

  const nextSteps = insufficientContext ? [] : parsed.nextSteps.slice(0, 5);

  const assessment =
    historicalEvidenceStatus === "strong"
      ? historicalAssessment
      : generalTechnicalAssessment || historicalAssessment;

  return {
    status:
      historicalEvidenceStatus === "strong" || historicalEvidenceStatus === "analogous"
        ? "match"
        : "insufficient",
    assessmentType,
    historicalEvidenceStatus,
    assessment,
    historicalAssessment,
    generalTechnicalAssessment,
    historicalEvidenceSummary: historicalAssessment,
    nextSteps,
    evidence,
    followUpQuestions,
    relevanceById,
    externalSources,
    webRetrievalStatus: web.status,
    webRetrievalNote: parsed.webRetrievalNote || web.note,
    revised: isFollowUp && parsed.revised,
    revisionNote:
      isFollowUp && parsed.revised
        ? parsed.revisionNote ||
          "Assessment updated based on new customer context."
        : undefined,
  };
}

function emptyInvestigation(content: string): Investigation {
  return {
    status: "unstructured",
    assessmentType: "ungrounded",
    historicalEvidenceStatus: "none",
    assessment: content,
    historicalAssessment: NO_CORPUS_MATCH,
    generalTechnicalAssessment: content,
    historicalEvidenceSummary: NO_CORPUS_MATCH,
    nextSteps: [],
    evidence: [],
    followUpQuestions: [],
    relevanceById: {},
    externalSources: [],
    webRetrievalStatus: "skipped",
    webRetrievalNote: "",
    revised: false,
  };
}

export async function runInvestigation(
  conversation: ConversationTurn[]
): Promise<{
  message: string;
  investigation: Investigation;
}> {
  const client = new OpenAI({
    apiKey: process.env.FIREWORKS_API_KEY,
    baseURL: "https://api.fireworks.ai/inference/v1",
    timeout: 55_000,
    maxRetries: 1,
  });
  const model = process.env.FIREWORKS_MODEL!;
  const retrievedIds = new Set<string>();
  const webHits: WebSearchHit[] = [];
  const webResponses: WebSearchResponse[] = [];
  const seenUrls = new Set<string>();
  const priorTurns = conversation.slice(0, -1);
  const latest = conversation[conversation.length - 1];
  if (!latest || latest.role !== "user") {
    throw new Error("Expected a conversation ending with a user message.");
  }
  const isFollowUp = priorTurns.some((turn) => turn.role === "assistant");

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...priorTurns.map((turn) => ({
      role: turn.role,
      content: turn.content,
    })),
    {
      role: "user",
      content: `${latest.content}${isFollowUp ? FOLLOW_UP_REMINDER : ""}`,
    },
  ];

  let content = "";

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const completion = await client.chat.completions.create({
      model,
      messages,
      tools: TOOLS,
      tool_choice: round === MAX_TOOL_ROUNDS - 1 ? "none" : "auto",
    });

    const choice = completion.choices[0];
    const assistantMessage = choice?.message;
    if (!assistantMessage) break;

    const toolCalls = sanitizeToolCalls(assistantMessage.tool_calls ?? []);
    if (toolCalls.length > 0 && round < MAX_TOOL_ROUNDS - 1) {
      messages.push({
        role: "assistant",
        content: assistantMessage.content || "",
        tool_calls: toolCalls,
      });

      for (const call of toolCalls) {
        const result = await runTool(call.function.name, call.function.arguments);
        result.ids.forEach((id) => retrievedIds.add(id));
        if (result.web) webResponses.push(result.web);
        for (const hit of result.hits) {
          if (seenUrls.has(hit.url)) continue;
          seenUrls.add(hit.url);
          webHits.push(hit);
        }
        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: result.payload,
        });
      }
      continue;
    }

    content = messageText(assistantMessage);
    break;
  }

  if (!parseInvestigation(content)) {
    messages.push({
      role: "user",
      content:
        'Return only the JSON object with keys historicalEvidenceStatus, insufficientContext, historicalAssessment, generalTechnicalAssessment, investigationSteps, evidenceIds, followUpQuestions, evidenceNotes, externalSources, webRetrievalNote, revised, and revisionNote. historicalEvidenceStatus must be strong, analogous, or none.',
    });
    const closing = await client.chat.completions.create({
      model,
      messages,
      tools: TOOLS,
      tool_choice: "none",
    });
    content = messageText(closing.choices[0]?.message) || content;
  }

  const parsed = parseInvestigation(content);
  if (parsed) {
    const investigation = hydrateInvestigation(
      parsed,
      retrievedIds,
      webHits,
      webResponses,
      isFollowUp
    );
    return {
      message: investigation.assessment || content,
      investigation,
    };
  }

  const fallback = emptyInvestigation(content);
  const web = webStatusFromResponses(webResponses, webHits.length);
  fallback.externalSources =
    web.status === "retrieved" ? hydrateExternalSources([], webHits) : [];
  fallback.webRetrievalStatus = web.status;
  fallback.webRetrievalNote = web.note;

  return {
    message: fallback.assessment || content,
    investigation: fallback,
  };
}
