import { normalizeInvestigation, type Investigation } from "@/lib/investigation";

export type InvestigationRole = "user" | "assistant";

export type UserInvestigationMessage = {
  id: string;
  role: "user";
  content: string;
  createdAt: string;
};

export type AssistantInvestigationMessage = {
  id: string;
  role: "assistant";
  content: string;
  createdAt: string;
  investigation: Investigation;
};

export type InvestigationMessage =
  | UserInvestigationMessage
  | AssistantInvestigationMessage;

export type InvestigationSession = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: InvestigationMessage[];
};

export type ConversationTurn = {
  role: InvestigationRole;
  content: string;
};

const TITLE_STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "of",
  "to",
  "in",
  "on",
  "for",
  "from",
  "with",
  "at",
  "by",
  "as",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "this",
  "that",
  "these",
  "those",
  "it",
  "its",
  "we",
  "our",
  "they",
  "them",
  "their",
  "i",
  "you",
  "your",
  "customer",
  "says",
  "said",
  "seeing",
  "see",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "what",
  "when",
  "where",
  "which",
  "who",
  "how",
  "should",
  "would",
  "could",
  "can",
  "will",
  "last",
  "time",
  "first",
  "about",
  "into",
  "using",
  "use",
  "used",
  "please",
  "help",
  "issue",
  "problem",
]);

export function createSessionId() {
  return crypto.randomUUID();
}

export function createEmptySession(): InvestigationSession {
  const now = new Date().toISOString();
  return {
    id: createSessionId(),
    title: "New investigation",
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

export function deriveSessionTitle(text: string) {
  const words = text
    .replace(/['’]/g, "")
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !TITLE_STOPWORDS.has(word.toLowerCase()) && word.length > 1)
    .slice(0, 6);

  if (words.length === 0) {
    const fallback = text.trim().slice(0, 40);
    return fallback || "New investigation";
  }

  const title = words.join(" ");
  return title.length > 42 ? `${title.slice(0, 40).trimEnd()}…` : title;
}

export function serializeAssistantHypothesis(investigation: Investigation) {
  const normalized = normalizeInvestigation(investigation);
  const ids = normalized.evidence.map((incident) => incident.id);
  return [
    "Previous investigation hypothesis — not ground truth. Re-search before citing any incident.",
    "New customer information should update both the general technical hypothesis and how directly historical incidents apply.",
    "Do not drop a prior mechanism only because a new dimension is missing from the corpus. Ask whether the new information contradicts the mechanism itself, or only reduces how directly the historical evidence applies.",
    `historicalEvidenceStatus: ${normalized.historicalEvidenceStatus}`,
    `assessmentType: ${normalized.assessmentType}`,
    `historicalAssessment: ${normalized.historicalAssessment}`,
    `assessment: ${normalized.assessment}`,
    normalized.generalTechnicalAssessment
      ? `generalTechnicalAssessment: ${normalized.generalTechnicalAssessment}`
      : "",
    `historicalEvidenceSummary: ${normalized.historicalEvidenceSummary}`,
    `evidenceIds retrieved that turn: ${ids.join(", ") || "none"}`,
    normalized.externalSources.length > 0
      ? `externalSources retrieved that turn: ${normalized.externalSources.map((source) => source.url).join(" | ")}`
      : `webRetrieval: ${normalized.webRetrievalStatus}${normalized.webRetrievalNote ? ` — ${normalized.webRetrievalNote}` : ""}`,
    normalized.nextSteps.length > 0
      ? `nextSteps: ${normalized.nextSteps.join(" | ")}`
      : "",
    normalized.followUpQuestions.length > 0
      ? `followUpQuestions: ${normalized.followUpQuestions.join(" | ")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function toConversationTurns(
  messages: InvestigationMessage[]
): ConversationTurn[] {
  return messages.map((message) => {
    if (message.role === "user") {
      return { role: "user", content: message.content };
    }
    return {
      role: "assistant",
      content: serializeAssistantHypothesis(message.investigation),
    };
  });
}

export function userContextText(messages: InvestigationMessage[]) {
  return messages
    .filter((message): message is UserInvestigationMessage => message.role === "user")
    .map((message) => message.content)
    .join("\n");
}

export function isEmptySession(session: InvestigationSession) {
  return session.messages.length === 0;
}

export type SessionGroup = {
  label: "Today" | "Yesterday" | "Older";
  sessions: InvestigationSession[];
};

export function groupSessions(
  sessions: InvestigationSession[]
): SessionGroup[] {
  const sorted = [...sessions].sort(
    (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)
  );

  const today: InvestigationSession[] = [];
  const yesterday: InvestigationSession[] = [];
  const older: InvestigationSession[] = [];

  for (const session of sorted) {
    const bucket = dayBucket(session.updatedAt);
    if (bucket === "Today") today.push(session);
    else if (bucket === "Yesterday") yesterday.push(session);
    else older.push(session);
  }

  return [
    { label: "Today" as const, sessions: today },
    { label: "Yesterday" as const, sessions: yesterday },
    { label: "Older" as const, sessions: older },
  ].filter((group) => group.sessions.length > 0);
}

function dayBucket(iso: string): SessionGroup["label"] {
  const date = new Date(iso);
  const startOfLocalDay = (value: Date) =>
    new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const day = startOfLocalDay(date);
  const today = startOfLocalDay(new Date());
  const yesterday = today - 86_400_000;
  if (day === today) return "Today";
  if (day === yesterday) return "Yesterday";
  return "Older";
}
