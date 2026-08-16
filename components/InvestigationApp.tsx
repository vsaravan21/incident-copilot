"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import incidents from "@/data/incidents.json";
import { fromAssistantPayload, relevanceForIncident } from "@/lib/investigation";
import type { Investigation } from "@/lib/investigation";
import type { Incident } from "@/lib/search";
import { ASSISTANT_CLIENT_TIMEOUT_MS } from "@/lib/runtime";
import {
  createSessionId,
  deriveSessionTitle,
  toConversationTurns,
  userContextText,
  type AssistantInvestigationMessage,
  type InvestigationSession,
} from "@/lib/session";
import {
  loadSessionStore,
  persistSessionStore,
  startNewSession,
  upsertSession,
} from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { CaseFilePreview } from "@/components/CaseFilePreview";
import { IncidentSheet } from "@/components/IncidentSheet";
import { InvestigationThread } from "@/components/InvestigationThread";
import { IssueComposer } from "@/components/IssueComposer";
import { SessionSidebar } from "@/components/SessionSidebar";

const EXAMPLES = [
  "TTFT increased after a prompt change",
  "Streaming responses appear to stall",
  "An agent keeps repeating the same tool call",
];

export function InvestigationApp() {
  const [sessions, setSessions] = useState<InvestigationSession[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [hydrated, setHydrated] = useState(false);
  const [query, setQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(
    "Searching historical incidents…"
  );
  const [error, setError] = useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    null
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  const activeSession =
    sessions.find((session) => session.id === activeId) ?? sessions[0];
  const messages = activeSession?.messages ?? [];
  const hasAssistantTurn = messages.some((message) => message.role === "assistant");
  const latestInvestigation = [...messages]
    .reverse()
    .find(
      (message): message is AssistantInvestigationMessage =>
        message.role === "assistant"
    )?.investigation;

  useEffect(() => {
    const store = loadSessionStore();
    setSessions(store.sessions);
    setActiveId(store.activeId);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    persistSessionStore({ version: 1, activeId, sessions });
  }, [hydrated, activeId, sessions]);

  useEffect(() => {
    if (!isSubmitting) {
      setLoadingStatus("Searching historical incidents…");
      return;
    }
    const timeout = window.setTimeout(() => {
      setLoadingStatus("Checking public technical sources…");
    }, 1400);
    return () => window.clearTimeout(timeout);
  }, [isSubmitting]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, isSubmitting]);

  function selectSession(id: string) {
    if (id === activeId) return;
    setActiveId(id);
    setQuery("");
    setError(null);
    setSelectedIncident(null);
    setSheetOpen(false);
  }

  function handleNew() {
    const { sessions: nextSessions, active } = startNewSession(sessions);
    setSessions(nextSessions);
    setActiveId(active.id);
    setQuery("");
    setError(null);
    setSelectedIncident(null);
    setSheetOpen(false);
  }

  async function sendConversation(session: InvestigationSession) {
    setError(null);
    setSelectedIncident(null);
    setSheetOpen(false);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: toConversationTurns(session.messages),
        }),
        signal: AbortSignal.timeout(ASSISTANT_CLIENT_TIMEOUT_MS),
      });
      const data = (await response.json()) as {
        message?: string;
        investigation?: Investigation;
        error?: string;
        detail?: string;
      };

      if (!response.ok) {
        throw new Error(data.detail || data.error || "Request failed.");
      }

      const investigation = fromAssistantPayload(data);
      const completed: InvestigationSession = {
        ...session,
        updatedAt: new Date().toISOString(),
        messages: [
          ...session.messages,
          {
            id: createSessionId(),
            role: "assistant",
            content: investigation.assessment,
            createdAt: new Date().toISOString(),
            investigation,
          },
        ],
      };
      setSessions((current) => upsertSession(current, completed));
    } catch (cause) {
      const timedOut =
        cause instanceof DOMException &&
        (cause.name === "TimeoutError" || cause.name === "AbortError");
      setError(
        timedOut
          ? "The investigation hit the platform time limit. Retry, or add a more specific symptom."
          : cause instanceof Error
            ? cause.message
            : "Investigation failed."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function runTurn(message = query) {
    const trimmed = message.trim();
    if (isSubmitting || !activeSession) return;

    const last = activeSession.messages[activeSession.messages.length - 1];
    if (last?.role === "user" && (!trimmed || trimmed === last.content)) {
      await sendConversation(activeSession);
      return;
    }

    if (!trimmed) return;

    const now = new Date().toISOString();
    const pending: InvestigationSession = {
      ...activeSession,
      title:
        activeSession.messages.length === 0
          ? deriveSessionTitle(trimmed)
          : activeSession.title,
      updatedAt: now,
      messages: [
        ...activeSession.messages,
        {
          id: createSessionId(),
          role: "user",
          content: trimmed,
          createdAt: now,
        },
      ],
    };

    setSessions((current) => upsertSession(current, pending));
    setQuery("");
    await sendConversation(pending);
  }

  const contextForRelevance = useMemo(
    () => userContextText(messages),
    [messages]
  );

  const selectedRelevance = selectedIncident
    ? relevanceForIncident(
        selectedIncident,
        contextForRelevance,
        latestInvestigation?.relevanceById[selectedIncident.id]
      )
    : undefined;

  return (
    <div className="flex min-h-svh">
      <SessionSidebar
        sessions={sessions}
        activeId={activeSession?.id ?? ""}
        onSelect={selectSession}
        onNew={handleNew}
        disabled={isSubmitting}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border px-6 py-3">
          <h2 className="truncate text-[15px] font-semibold tracking-tight">
            {activeSession?.title ?? "New investigation"}
          </h2>
          <p className="shrink-0 text-[12px] text-muted-foreground tabular-nums">
            {incidents.length} incidents
          </p>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="mx-auto w-full max-w-[1120px] space-y-5">
            {messages.length === 0 && !isSubmitting ? (
              <>
                <IssueComposer
                  value={query}
                  onChange={setQuery}
                  onSubmit={() => void runTurn()}
                  isSubmitting={isSubmitting}
                />
                {error ? (
                  <ErrorPanel
                    error={error}
                    onRetry={() => void runTurn(query)}
                  />
                ) : (
                  <CaseFilePreview
                    examples={EXAMPLES}
                    onPickExample={setQuery}
                  />
                )}
              </>
            ) : (
              <>
                <InvestigationThread
                  messages={messages}
                  isSubmitting={isSubmitting}
                  loadingStatus={loadingStatus}
                  selectedId={selectedIncident?.id}
                  onInspect={(incident) => {
                    setSelectedIncident(incident);
                    setSheetOpen(true);
                  }}
                />
                {error ? (
                  <ErrorPanel
                    error={error}
                    onRetry={() => void runTurn()}
                  />
                ) : null}
                <div ref={threadEndRef} />
              </>
            )}
          </div>
        </div>

        {hasAssistantTurn && !isSubmitting ? (
          <div className="border-t border-border bg-background px-6 py-3">
            <div className="mx-auto w-full max-w-[1120px]">
              <IssueComposer
                variant="follow-up"
                value={query}
                onChange={setQuery}
                onSubmit={() => void runTurn()}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        ) : null}
      </div>

      <IncidentSheet
        incident={sheetOpen ? selectedIncident : null}
        relevance={sheetOpen ? selectedRelevance : undefined}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}

function ErrorPanel({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <section className="rounded-md border border-destructive/30 bg-white px-4 py-4">
      <h2 className="text-[15px] font-semibold">Investigation failed</h2>
      <p className="mt-1.5 max-w-[65ch] text-[14px] leading-6 text-muted-foreground">
        {error}
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3"
        onClick={onRetry}
      >
        Retry
      </Button>
    </section>
  );
}
