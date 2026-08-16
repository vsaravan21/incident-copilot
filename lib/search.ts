import incidents from "@/data/incidents.json";

export type Incident = (typeof incidents)[number];

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * A deliberately simple local retrieval helper supplied by the interviewer.
 * You may use it as-is, modify it, replace it, or wrap it as an LLM tool.
 */
export function searchIncidents(query: string, limit = 4): Incident[] {
  const terms = new Set(tokenize(query));

  return incidents
    .map((incident) => {
      const haystack = tokenize(JSON.stringify(incident));
      const score = haystack.reduce(
        (sum, token) => sum + (terms.has(token) ? 1 : 0),
        0
      );
      return { incident, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ incident }) => incident);
}

export function getIncidentById(id: string): Incident | undefined {
  return incidents.find((incident) => incident.id === id);
}
