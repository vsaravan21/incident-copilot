import { normalizeInvestigation } from "@/lib/investigation";
import {
  createEmptySession,
  isEmptySession,
  type InvestigationSession,
} from "@/lib/session";

const STORAGE_KEY = "incident-copilot.sessions.v1";

type SessionStore = {
  version: 1;
  activeId: string;
  sessions: InvestigationSession[];
};

function emptyStore(): SessionStore {
  const session = createEmptySession();
  return { version: 1, activeId: session.id, sessions: [session] };
}

function readRaw(): SessionStore | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SessionStore>;
    if (
      parsed.version !== 1 ||
      typeof parsed.activeId !== "string" ||
      !Array.isArray(parsed.sessions)
    ) {
      return null;
    }
    return {
      version: 1,
      activeId: parsed.activeId,
      sessions: parsed.sessions.filter(isSession).map(hydrateSession),
    };
  } catch {
    return null;
  }
}

function writeRaw(store: SessionStore) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Quota or private-mode failures should not break the workspace.
  }
}

export function loadSessionStore(): SessionStore {
  const stored = readRaw();
  if (!stored || stored.sessions.length === 0) {
    const fresh = emptyStore();
    writeRaw(fresh);
    return fresh;
  }
  const active =
    stored.sessions.find((session) => session.id === stored.activeId) ??
    stored.sessions[0];
  return {
    version: 1,
    activeId: active.id,
    sessions: stored.sessions,
  };
}

export function persistSessionStore(store: SessionStore) {
  writeRaw(store);
}

export function upsertSession(
  sessions: InvestigationSession[],
  next: InvestigationSession
) {
  const index = sessions.findIndex((session) => session.id === next.id);
  if (index === -1) return [next, ...sessions];
  const copy = [...sessions];
  copy[index] = next;
  return copy;
}

export function startNewSession(sessions: InvestigationSession[]) {
  const existingEmpty = sessions.find(isEmptySession);
  if (existingEmpty) return { sessions, active: existingEmpty };
  const created = createEmptySession();
  return { sessions: [created, ...sessions], active: created };
}

function hydrateSession(session: InvestigationSession): InvestigationSession {
  return {
    ...session,
    messages: session.messages.map((message) => {
      if (message.role !== "assistant") return message;
      return {
        ...message,
        investigation: normalizeInvestigation(message.investigation),
      };
    }),
  };
}

function isSession(value: unknown): value is InvestigationSession {
  if (!value || typeof value !== "object") return false;
  const session = value as InvestigationSession;
  return (
    typeof session.id === "string" &&
    typeof session.title === "string" &&
    typeof session.createdAt === "string" &&
    typeof session.updatedAt === "string" &&
    Array.isArray(session.messages)
  );
}
