# Interviewer Notes — Open only AFTER the 2-hour mock

## What this mock is testing

This is not a LeetCode exercise. The strongest signal is whether the candidate turns an ambiguous AI workflow into a useful, grounded product quickly.

Suggested rubric:

- Product judgment & scoping — 25
- Working Fireworks integration — 20
- Retrieval / agent design — 20
- Grounding, citations & failure behavior — 15
- UX / support-engineer workflow — 10
- Code clarity & explanation — 10

## Strong implementation signals

- Retrieves a small relevant set rather than injecting every document
- Uses tool calling or a clear iterative retrieval policy
- Can search again/refine when evidence is weak
- Keeps tool payloads compact
- Connects claims to source IDs
- Has a deliberate insufficient-evidence behavior
- Makes the source documents inspectable
- Prioritizes one coherent happy path over many half-built features

## Product-feature examples that would be defensible

These are examples, not required:
- investigation checklist
- suggested follow-up questions
- confidence/evidence indicator
- "why these sources" explanation
- incident comparison mode
- one-click copyable support response
- explicit symptom/root-cause/resolution separation

## Discussion questions

1. Walk me through the user and the job you optimized for.
2. Why did you scope the MVP this way?
3. What did you deliberately not build?
4. How does retrieval work?
5. Why did you choose tool calling / your orchestration approach?
6. How do you keep the model from hallucinating incident history?
7. Show me what happens when the corpus has no answer.
8. Why should I trust the citations?
9. What are the biggest failure modes of your current implementation?
10. Why did you choose this model?
11. Where would latency come from in this system?
12. How would this change with 1 million incident documents?
13. What would you measure after launch?
14. What would you build with another two hours?
15. What did Cursor generate that you had to correct or override?
16. If support engineers complain the tool is too slow, what would you investigate first?
17. If retrieval returns irrelevant incidents, where would you debug?
18. Would you use embeddings, reranking, keyword search, or a hybrid system in production? Why?
19. How would you evaluate answer quality before shipping?
20. What customer data/privacy concerns would matter in a real support environment?

## Ground-truth notes for test questions

- TTFT after prompt change: INC-102, potentially INC-108 for prefix reuse.
- Streaming stall: INC-103.
- Agent looping: INC-106.
- February vs May latency: INC-102 vs INC-107, different root causes.
- Too much retrieved/tool context: INC-110 and INC-112.
- GPU overheating: no supporting incident; assistant should abstain.

## Red flags

- Entire corpus sent on every request
- No source IDs or invented citations
- Hard-coded answers to the sample questions
- Polished UI but broken AI path
- Agent loop with no step cap
- Cannot explain generated code
- Uses another model provider for the core inference requirement
