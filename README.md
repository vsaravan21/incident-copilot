# Incident Copilot

Internal investigation console for Fireworks support engineers. Describe a customer symptom in plain language; Copilot returns a structured case file: a technical assessment, concrete next checks, inspectable historical incidents, and (when configured) public technical sources.

The historical corpus is an evidence source, not the only path to a diagnosis. Model knowledge and web retrieval stay labeled separately from Fireworks incident history.

## Run locally

Requires Node.js 20.9 or newer.

```bash
npm install
cp .env.example .env.local
```

Set at least:

```bash
FIREWORKS_API_KEY=fw_...
FIREWORKS_MODEL=accounts/fireworks/models/deepseek-v4-pro-0813
WEB_SEARCH_API_KEY=enabled
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Variable | Required | Purpose |
| --- | --- | --- |
| `FIREWORKS_API_KEY` | Yes | Server-side inference. Never exposed to the browser. |
| `FIREWORKS_MODEL` | Yes | Fireworks serverless model id. |
| `WEB_SEARCH_API_KEY` | No | Enables public web retrieval. Any non-empty value uses DuckDuckGo HTML search. A `tvly-...` value, or `TAVILY_API_KEY`, uses Tavily. |
| `TAVILY_API_KEY` | No | Preferred web search provider when set. |

If web credentials are missing or invalid, Copilot continues with internal incidents plus labeled general reasoning and states that web retrieval is unavailable. It does not invent URLs.

Production-style local run:

```bash
npm run build
npm start
```

## Deploy on Vercel Hobby

The `/api/assistant` route is a Node.js function with `maxDuration` 300s (the Hobby Fluid Compute maximum). Investigations often take 20–90s because they run several Fireworks tool rounds plus optional web search.

1. Push this repo to GitHub, or run `npx vercel` from the project root.
2. Import the project in the [Vercel dashboard](https://vercel.com/new). Framework preset: **Next.js**. Root directory: repository root.
3. Add environment variables for **Production**, **Preview**, and **Development**:

   - `FIREWORKS_API_KEY`
   - `FIREWORKS_MODEL`
   - `WEB_SEARCH_API_KEY` (recommended: `enabled`)
   - `TAVILY_API_KEY` (optional)

4. Deploy. Hobby does not require a paid plan for this app: no database, no cron, no Edge Config.
5. Confirm `GET /api/health` returns `{ "ok": true }`.

Do not put secrets in the repo. `.env.local` is gitignored.

## Product / technical approach

- **Investigation, not chat.** The UI is a case file: customer context, assessment, plan, and sources. Follow-ups update the same session.
- **Tool-calling retrieval.** Fireworks decides when to call `search_incidents`, `get_incident`, and `search_web`. The full corpus is never stuffed into the prompt. Cited incident IDs and web URLs are filtered to records actually retrieved that turn.
- **Evidence hierarchy.** Strong historical matches lead. Analogous incidents stay visible with named limits. No historical match still produces a general technical assessment, labeled as not grounded in internal history.
- **Investigation Plan.** 3–5 operational checks (COMPARE / ISOLATE / VERIFY / …) so the engineer leaves with a next action.
- **Sessions.** Browser `localStorage` only — no auth, no database, fits Hobby.

## Tradeoffs

- Keyword search over 12 fictional incidents instead of embeddings. Fine for this corpus; would not scale to production tickets.
- Web search defaults to DuckDuckGo HTML so Hobby deploys work without a second paid API. Tavily is better when a key is available.
- Multi-round tool calling is slower than single-shot RAG and can approach the 300s Hobby cap on heavy follow-ups.
- No authentication. Treat a public Hobby URL as a demo, not an internal production console.

## Known limitations

- Incident IDs INC-101–INC-112 are fictional interview data.
- Similar symptoms are not the same cause; the model can still over-weight a shared keyword.
- DuckDuckGo may rate-limit or change markup; retrieval then fails closed (unavailable / empty), not with fabricated sources.
- Vercel Hobby: 300s function cap, shared CPU, cold starts. A timeout surfaces in the UI rather than hanging.
- Prior assessments are hypotheses. New customer information can strengthen, weaken, or overturn them.

## If I had another 2 hours

- Stream tool-round status instead of a static skeleton.
- Metadata filters (product, date) before keyword search.
- Persist sessions server-side behind auth.
- Eval set: grounded TTFT, analog on-prem H100, ungrounded GPU overheating, thin one-liners.

## Test prompts

- TTFT jumped after a substantially larger prompt template.
- Streaming responses appear to stall.
- An agent keeps repeating the same tool call.
- Compare the February and May latency incidents.
- Adding more retrieved context made the agent worse.
- A customer says their GPU is overheating. *(out of corpus — should still diagnose, labeled as no historical match)*
