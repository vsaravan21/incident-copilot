import { getIncidentById, type Incident } from "@/lib/search";

export type InvestigationStatus = "match" | "insufficient" | "unstructured";

export type AssessmentType =
  | "grounded"
  | "analogous"
  | "ungrounded"
  | "insufficient_context";

export type HistoricalEvidenceStatus = "strong" | "analogous" | "none";

export type WebRetrievalStatus = "retrieved" | "unavailable" | "empty" | "skipped";

export type ExternalSource = {
  title: string;
  url: string;
  domain: string;
  snippet: string;
  relevance: string;
};

export type PlanStep = {
  verb: string;
  action: string;
};

export type Investigation = {
  status: InvestigationStatus;
  assessmentType: AssessmentType;
  historicalEvidenceStatus: HistoricalEvidenceStatus;
  assessment: string;
  historicalAssessment: string;
  generalTechnicalAssessment: string;
  historicalEvidenceSummary: string;
  nextSteps: string[];
  evidence: Incident[];
  followUpQuestions: string[];
  relevanceById: Record<string, string>;
  externalSources: ExternalSource[];
  webRetrievalStatus: WebRetrievalStatus;
  webRetrievalNote: string;
  revised: boolean;
  revisionNote?: string;
};

const ASSESSMENT_TYPES = new Set<AssessmentType>([
  "grounded",
  "analogous",
  "ungrounded",
  "insufficient_context",
]);

const HISTORICAL_STATUSES = new Set<HistoricalEvidenceStatus>([
  "strong",
  "analogous",
  "none",
]);

const WEB_STATUSES = new Set<WebRetrievalStatus>([
  "retrieved",
  "unavailable",
  "empty",
  "skipped",
]);

export const PLAN_VERBS = [
  "COMPARE",
  "ISOLATE",
  "VERIFY",
  "CHECK",
  "ASK",
  "REVIEW",
  "MEASURE",
  "CAPTURE",
  "CONFIRM",
] as const;

export const FALLBACK_QUESTIONS = [
  "ASK which Fireworks product, model, and region the customer is using.",
  "ASK for the exact error, metric, or symptom, and when it started.",
  "ASK what changed immediately before the issue (prompt, traffic, client, or config).",
  "ASK whether they can share request IDs, traces, or dashboards from the window.",
];

export function formatIncidentDate(isoDate: string) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function extractIncidentIds(text: string) {
  return [...new Set(text.match(/INC-\d{3}/g) ?? [])];
}

export function assessmentTypeOf(investigation: {
  assessmentType?: AssessmentType;
  status?: InvestigationStatus;
  evidence?: Incident[];
}): AssessmentType {
  if (
    investigation.assessmentType &&
    ASSESSMENT_TYPES.has(investigation.assessmentType)
  ) {
    return investigation.assessmentType;
  }
  if (
    investigation.status === "match" &&
    (investigation.evidence?.length ?? 0) > 0
  ) {
    return "grounded";
  }
  return "ungrounded";
}

export function historicalEvidenceStatusOf(investigation: {
  historicalEvidenceStatus?: HistoricalEvidenceStatus;
  assessmentType?: AssessmentType;
  status?: InvestigationStatus;
  evidence?: Incident[];
}): HistoricalEvidenceStatus {
  if (
    investigation.historicalEvidenceStatus &&
    HISTORICAL_STATUSES.has(investigation.historicalEvidenceStatus)
  ) {
    return investigation.historicalEvidenceStatus;
  }
  const type = assessmentTypeOf(investigation);
  if (type === "grounded") return "strong";
  if (type === "analogous") return "analogous";
  return "none";
}

export function assessmentTypeFromHistorical(
  status: HistoricalEvidenceStatus,
  insufficientContext = false
): AssessmentType {
  if (insufficientContext) return "insufficient_context";
  if (status === "strong") return "grounded";
  if (status === "analogous") return "analogous";
  return "ungrounded";
}

export function historicalStatusLabel(status: HistoricalEvidenceStatus) {
  if (status === "strong") return "Strong historical support";
  if (status === "analogous") return "Relevant historical analog";
  return "No historical match";
}

export function assessmentTypeLabel(type: AssessmentType) {
  if (type === "grounded") return "Strong historical support";
  if (type === "analogous") return "Relevant historical analog";
  if (type === "ungrounded") return "No historical match";
  return "Insufficient information";
}

export function supportingIncidentLabel(count: number) {
  return `${count} supporting incident${count === 1 ? "" : "s"}`;
}

export function parsePlanStep(step: string): PlanStep {
  const trimmed = step.trim();
  const prefixed = trimmed.match(
    /^(COMPARE|ISOLATE|VERIFY|CHECK|ASK|REVIEW|MEASURE|CAPTURE|CONFIRM)\b[:.\s-]*(.*)$/i
  );
  if (prefixed?.[2]?.trim()) {
    return {
      verb: prefixed[1].toUpperCase(),
      action: prefixed[2].trim(),
    };
  }

  const first = trimmed.split(/\s+/)[0] ?? "";
  const known = PLAN_VERBS.find(
    (verb) => verb.toLowerCase() === first.toLowerCase()
  );
  if (known) {
    return {
      verb: known,
      action: trimmed.slice(first.length).trim().replace(/^[:.\s-]+/, ""),
    };
  }

  return { verb: inferVerb(trimmed), action: trimmed };
}

export function parsePlanSteps(steps: string[]): PlanStep[] {
  return steps.map(parsePlanStep);
}

export function formatPlanCopy(steps: string[], heading = "Investigation plan") {
  const lines = parsePlanSteps(steps).map(
    (step, index) =>
      `${String(index + 1).padStart(2, "0")} ${step.verb}  ${step.action}`
  );
  return [heading, ...lines].join("\n");
}

export function relevanceForIncident(
  incident: Incident,
  query: string,
  modelNote?: string
) {
  const note = modelNote?.trim();
  if (note) return note;

  const queryTerms = new Set(tokenize(query));
  const overlappingTags = incident.tags.filter((tag) => {
    const tagTerms = tokenize(tag);
    return (
      queryTerms.has(tag.toLowerCase()) ||
      tagTerms.some((term) => queryTerms.has(term))
    );
  });

  const grounded = firstSentence(incident.support_notes) || incident.summary;
  if (overlappingTags.length > 0) {
    return `Cited for ${overlappingTags.slice(0, 3).join(", ")}. ${grounded}`;
  }
  return grounded;
}

export function toInvestigation(message: string): Investigation {
  const evidence = extractIncidentIds(message)
    .map((id) => getIncidentById(id))
    .filter((incident): incident is Incident => Boolean(incident));
  const historicalEvidenceStatus: HistoricalEvidenceStatus =
    evidence.length > 0 ? "strong" : "none";

  return {
    status: evidence.length > 0 ? "match" : "unstructured",
    assessmentType: evidence.length > 0 ? "grounded" : "ungrounded",
    historicalEvidenceStatus,
    assessment: message,
    historicalAssessment:
      evidence.length > 0
        ? message
        : "The internal incident corpus does not contain a prior case that directly supports this diagnosis.",
    generalTechnicalAssessment: evidence.length > 0 ? "" : message,
    historicalEvidenceSummary:
      evidence.length > 0
        ? `Cited ${evidence.map((incident) => incident.id).join(", ")}.`
        : "The internal incident corpus does not contain a prior case that directly supports this diagnosis.",
    nextSteps: [],
    evidence,
    followUpQuestions: [],
    relevanceById: {},
    externalSources: [],
    webRetrievalStatus: "skipped",
    webRetrievalNote: "",
    revised: false,
  };
}

function parseExternalSources(value: unknown): ExternalSource[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const source = item as Record<string, unknown>;
    if (typeof source.url !== "string" || !source.url.trim()) return [];
    try {
      const parsed = new URL(source.url);
      const domain =
        typeof source.domain === "string" && source.domain.trim()
          ? source.domain.replace(/^www\./, "")
          : parsed.hostname.replace(/^www\./, "");
      return [
        {
          title:
            typeof source.title === "string" && source.title.trim()
              ? source.title.trim()
              : parsed.hostname,
          url: parsed.toString(),
          domain,
          snippet: typeof source.snippet === "string" ? source.snippet : "",
          relevance:
            typeof source.relevance === "string" ? source.relevance.trim() : "",
        },
      ];
    } catch {
      return [];
    }
  });
}

export function normalizeInvestigation(
  payload: Partial<Investigation> | null | undefined
): Investigation {
  const evidence = Array.isArray(payload?.evidence) ? payload.evidence : [];
  const assessment =
    typeof payload?.assessment === "string" ? payload.assessment : "";
  const assessmentType = assessmentTypeOf({
    assessmentType: payload?.assessmentType,
    status: payload?.status,
    evidence,
  });
  const historicalEvidenceStatus = historicalEvidenceStatusOf({
    historicalEvidenceStatus: payload?.historicalEvidenceStatus,
    assessmentType,
    status: payload?.status,
    evidence,
  });
  const historicalAssessment =
    typeof payload?.historicalAssessment === "string"
      ? payload.historicalAssessment
      : typeof payload?.historicalEvidenceSummary === "string"
        ? payload.historicalEvidenceSummary
        : evidence.length > 0
          ? assessment
          : "The internal incident corpus does not contain a prior case that directly supports this diagnosis.";
  const generalTechnicalAssessment =
    typeof payload?.generalTechnicalAssessment === "string"
      ? payload.generalTechnicalAssessment
      : assessmentType === "grounded"
        ? ""
        : assessment;
  const webRetrievalStatus =
    payload?.webRetrievalStatus && WEB_STATUSES.has(payload.webRetrievalStatus)
      ? payload.webRetrievalStatus
      : "skipped";

  return {
    status:
      assessmentType === "grounded" || assessmentType === "analogous"
        ? "match"
        : payload?.status === "unstructured"
          ? "unstructured"
          : payload?.status === "insufficient"
            ? "insufficient"
            : evidence.length > 0
              ? "match"
              : "insufficient",
    assessmentType,
    historicalEvidenceStatus,
    assessment,
    historicalAssessment,
    generalTechnicalAssessment,
    historicalEvidenceSummary:
      typeof payload?.historicalEvidenceSummary === "string"
        ? payload.historicalEvidenceSummary
        : historicalAssessment,
    nextSteps: Array.isArray(payload?.nextSteps) ? payload.nextSteps : [],
    evidence,
    followUpQuestions: Array.isArray(payload?.followUpQuestions)
      ? payload.followUpQuestions
      : [],
    relevanceById:
      payload?.relevanceById && typeof payload.relevanceById === "object"
        ? payload.relevanceById
        : {},
    externalSources: parseExternalSources(payload?.externalSources),
    webRetrievalStatus,
    webRetrievalNote:
      typeof payload?.webRetrievalNote === "string"
        ? payload.webRetrievalNote
        : "",
    revised: payload?.revised === true,
    revisionNote:
      typeof payload?.revisionNote === "string"
        ? payload.revisionNote
        : undefined,
  };
}

export function fromAssistantPayload(data: {
  message?: string;
  investigation?: Partial<Investigation> | null;
}): Investigation {
  const payload = data.investigation;
  if (
    payload &&
    typeof payload.assessment === "string" &&
    (payload.status === "match" ||
      payload.status === "insufficient" ||
      payload.status === "unstructured" ||
      payload.assessmentType)
  ) {
    return normalizeInvestigation(payload);
  }

  return toInvestigation(data.message ?? "");
}

function inferVerb(text: string) {
  const t = text.toLowerCase();
  if (/\bcompar/.test(t)) return "COMPARE";
  if (/\bisolat|\bseparat|\bdistinguish/.test(t)) return "ISOLATE";
  if (/\bverif|\bconfirm/.test(t)) return "VERIFY";
  if (/\bmeasur/.test(t)) return "MEASURE";
  if (/\bask\b|\bquestion/.test(t)) return "ASK";
  if (/\breview|\binspect/.test(t)) return "REVIEW";
  if (/\bcapture|\bcollect|\brequest id/.test(t)) return "CAPTURE";
  return "CHECK";
}

function tokenize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function firstSentence(text: string) {
  const match = text.trim().match(/^[^.]+(?:\.|$)/);
  return match?.[0]?.trim() ?? text.trim();
}
