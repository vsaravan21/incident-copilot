# Fireworks AI APM Mock Take-Home

## Time limit

You have **2 hours** from the moment you begin.

Assume AI coding tools are allowed. You may use documentation and the internet.

## Context

Fireworks support engineers frequently receive questions that require connecting symptoms reported by a customer with patterns seen in prior incidents.

You have been given a small, fictional set of historical incident reports in `data/incidents.json` and two local retrieval helpers in `lib/search.ts`.

## Your task

Build **Incident Copilot**, an AI-powered internal tool that helps a support engineer investigate a customer issue using the historical incident corpus.

### Core requirements

1. **Use the Fireworks AI API for model inference.**
2. A support engineer should be able to enter a natural-language question or problem description.
3. The assistant should retrieve relevant information from the provided incident corpus rather than stuffing the entire corpus into every prompt.
4. The assistant should be able to decide when/how to use retrieval during the workflow. You may implement this with Fireworks tool/function calling or another clearly agentic approach.
5. Factual claims about historical incidents must cite the incident IDs that support them.
6. The UI must make the supporting sources easy to inspect.
7. If the corpus does not contain enough evidence, the assistant should say so rather than inventing an answer.
8. Make **one additional product decision** that you believe materially improves the workflow for a support engineer. Be prepared to defend it.

### Scope

You **do not** need:
- authentication
- a database
- production deployment
- perfect visual design
- a sophisticated vector database

You may modify any starter code.

### Deliverables

Submit the repository containing:

- a working application
- a short `README.md` that includes:
  - how to run it
  - your product/technical approach
  - key tradeoffs you made
  - what you would build with another 2 hours
  - any known limitations

### Environment

Put credentials in `.env.local`.

Expected variables:

```bash
FIREWORKS_API_KEY=...
FIREWORKS_MODEL=...
```

Use any Fireworks serverless text model available to your account.

## Test scenarios

Your application should handle questions similar to these:

- “A customer says TTFT jumped after they changed their prompt. What should I investigate first?”
- “We’re seeing a streaming response stall. What evidence would distinguish a model-side issue from a client-side issue?”
- “Have we seen agent loops before? What caused them?”
- “Compare the February and May latency incidents. Were they caused by the same thing?”
- “What incidents suggest that adding more retrieved context can actually make an agent worse?”
- “A customer says their GPU is overheating. What did we do last time?”

The final question is intentionally outside the supplied evidence.

## Submission

Stop at exactly 2 hours. Do not keep polishing after the deadline.

Your implementation does not need to be complete to be discussable. We care about how you scoped the problem and the decisions you made.
