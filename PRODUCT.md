# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user: a Fireworks support engineer investigating a customer-reported inference or agent issue. They are in an active case, not browsing a knowledge base for its own sake. Their job is to decide whether the issue resembles something Fireworks has seen before, what the evidence suggests, and what to check next.

## Product Purpose

Incident Copilot is an internal investigation tool. It takes a natural-language description of what the customer is seeing and returns a grounded investigation path: a likely explanation, concrete next checks, and inspectable historical incidents.

Success is speed to a useful next action without presenting weakly supported guesses as fact.

## Positioning

The product is decision support, not search and not a chatbot. Historical claims must map to retrieved incidents with visible IDs. The corpus is an important evidence source, not the only path to a diagnosis. Copilot keeps three kinds of evidence separate: internal historical incidents, labeled general technical hypotheses, and public web sources that were actually retrieved. When historical evidence is strong it leads. Analogous incidents stay in view with their limitations named. When there is no historical match, Copilot still offers a general technical hypothesis, labeled as not grounded in internal incident history. Web retrieval is secondary and never presented as Fireworks history. The distinguishing mechanism is an Investigation Plan: 3–5 actionable checks that would confirm or reject the working hypotheses.

A generic RAG chatbot that answers from stuffed context, or a search UI that only lists similar tickets, could not truthfully claim this.

## Operating Context

This is a 2-hour Fireworks APM-style mock take-home. The incident corpus is fictional and exists solely for interview practice. Inference uses the Fireworks API (`FIREWORKS_API_KEY`, `FIREWORKS_MODEL`). The engineer works at a desktop, describes symptoms in plain language, and must be able to inspect source incidents without leaving the investigation.

Test questions include TTFT after prompt changes, streaming stalls, agent loops, comparing latency incidents, retrieval making agents worse, an on-prem H100 analog of a serverless TTFT incident, and an out-of-corpus GPU-overheating case that must still produce a labeled general technical assessment rather than “cannot diagnose.”

## Capabilities and Constraints

Confirmed:

- Natural-language issue input; no requirement that the engineer know keywords such as TTFT, prefill, or backpressure
- Retrieval from `data/incidents.json` via the supplied lightweight search helpers, exposed as a tool so the model decides when it needs evidence
- Real web retrieval via a server-side `search_web` tool (Tavily when `TAVILY_API_KEY` is set, otherwise DuckDuckGo HTML when `WEB_SEARCH_API_KEY` is set). Only retrieved titles/URLs may be cited. Missing or invalid credentials produce an honest unavailable state, not fabricated sources.
- Factual historical claims cite incident IDs retrieved this turn; model knowledge is labeled separately and never presented as Fireworks history; web pages are never presented as internal incidents
- Supporting incidents are inspectable (symptoms, root cause, resolution, support notes)
- Historical evidence states: strong (direct historical support), analogous (relevant pattern with named limitations), none (general technical hypothesis, no historical match). Insufficient information is reserved for customer context that is too thin for a hypothesis
- Multiple plausible causes stay distinct; similar symptoms are not collapsed because they share keywords
- Small tool-call limit to avoid runaway loops, latency, and cost
- Multi-turn investigation in a single case file: follow-up customer context is added to the same session, Fireworks re-searches, and a later turn may overturn a prior hypothesis
- Session history in the browser (`localStorage` only): restore a case after leaving the app

Out of scope unless later decided: authentication, a database, a vector database, incident creation/editing, analytics, model-selection UI, production deployment, and elaborate visual design.

Undecided: production-scale retrieval (metadata filtering → hybrid search → reranking) is a later evolution, not this prototype.

## Brand Commitments

Name: Incident Copilot.

Voice: technical, precise, calm. This is an internal engineering console, not a consumer AI assistant.

Binding visual constraint volunteered by the user (not expanded here): one restrained Fireworks-inspired violet accent; no chatbot, marketing-landing, or generic AI-SaaS treatment.

No logo, legal, or brand-asset files are in the repository.

## Evidence on Hand

- Fictional historical incidents: `data/incidents.json` (INC-101 through INC-112)
- Local retrieval helpers: `lib/search.ts` (`searchIncidents`, `getIncidentById`)
- Public web retrieval: `lib/web-search.ts` (`searchWeb`)
- Candidate brief: `CANDIDATE_PROMPT.md`

Do not fabricate customers, testimonials, benchmarks, additional incidents, or real Fireworks production data.

## Product Principles

1. Evidence before confidence: historical claims require retrieved IDs. General technical hypotheses are allowed only when labeled as model-generated. Web citations require URLs actually returned by search_web.
2. Optimize for a useful next action, not essay-like answer quality.
3. Retrieve a small relevant set; never stuff the whole corpus into every prompt.
4. Make sources inspectable in place so the engineer can verify the model.
5. Keep historical, general, and web evidence separate. Ask follow-ups when customer context is too thin for even a hypothesis.

## Accessibility & Inclusion

Keyboard and screen-reader usable. No formal WCAG standard was required.
