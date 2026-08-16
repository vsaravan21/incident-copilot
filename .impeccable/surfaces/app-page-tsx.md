---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: []
---

# Surface: Incident Copilot investigation

- Mode: Operate
- Audience: Fireworks support engineer on an active customer case
- Job: go from a natural-language symptom to a grounded next action
- Task: describe the issue, run Investigate, read likely cause and ordered checks, inspect cited incidents in a sheet
- Proof: fictional historical incidents in data/incidents.json, retrieved as tools, cited by ID
- Constraints: keyboard and screen-reader usable; one Fireworks-inspired violet accent; no chatbot or AI-SaaS chrome; do not invent incidents
- Direction: case file, not chat. Composer is the primary action. Two-column report: likely cause + plan | supporting incidents. Signature interaction: inspect incident in a right sheet without leaving the case.
- Memorable moment: cited incident rows that open the source record in place
- Unresolved: production-scale retrieval; persistent history
