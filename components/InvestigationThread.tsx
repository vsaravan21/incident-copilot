"use client";

import { useState } from "react";
import {
  historicalEvidenceStatusOf,
  historicalStatusLabel,
  normalizeInvestigation,
  supportingIncidentLabel,
} from "@/lib/investigation";
import type {
  AssistantInvestigationMessage,
  InvestigationMessage,
  UserInvestigationMessage,
} from "@/lib/session";
import type { Incident } from "@/lib/search";
import { InvestigationResult } from "@/components/InvestigationResult";
import { InvestigationSkeleton } from "@/components/InvestigationSkeleton";
import { cn } from "@/lib/utils";

function Stamp({ children }: { children: string }) {
  return (
    <p className="font-mono text-[11px] tracking-[0.08em] text-muted-foreground">
      {children}
    </p>
  );
}

function CustomerContext({ message }: { message: UserInvestigationMessage }) {
  return (
    <section>
      <Stamp>CUSTOMER CONTEXT</Stamp>
      <p className="mt-1.5 max-w-[65ch] text-[14px] leading-6 whitespace-pre-wrap">
        {message.content}
      </p>
    </section>
  );
}

function CollapsedAssessment({
  message,
}: {
  message: AssistantInvestigationMessage;
}) {
  const [open, setOpen] = useState(false);
  const investigation = normalizeInvestigation(message.investigation);
  const status = historicalEvidenceStatusOf(investigation);
  const summary = (
    investigation.assessmentType === "insufficient_context"
      ? investigation.assessment
      : status === "strong"
        ? investigation.historicalAssessment || investigation.assessment
        : investigation.generalTechnicalAssessment ||
          investigation.historicalAssessment ||
          investigation.assessment
  )
    .trim()
    .split(/\n/)[0];

  return (
    <section>
      <Stamp>COPILOT ASSESSMENT</Stamp>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="mt-1.5 w-full rounded-md border border-border bg-white px-3 py-2 text-left transition-colors duration-150 hover:bg-muted/60"
        aria-expanded={open}
      >
        <span className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-[13px] font-medium">
            {investigation.assessmentType === "insufficient_context"
              ? "Insufficient information"
              : historicalStatusLabel(status)}
          </span>
          <span className="text-[12px] text-muted-foreground tabular-nums">
            {supportingIncidentLabel(investigation.evidence.length)}
          </span>
        </span>
        <span
          className={cn(
            "mt-1 block text-[13px] leading-5 text-muted-foreground",
            !open && "truncate"
          )}
        >
          {summary}
        </span>
      </button>
    </section>
  );
}

export function InvestigationThread({
  messages,
  isSubmitting,
  loadingStatus,
  selectedId,
  onInspect,
}: {
  messages: InvestigationMessage[];
  isSubmitting: boolean;
  loadingStatus: string;
  selectedId?: string;
  onInspect: (incident: Incident) => void;
}) {
  const lastAssistantIndex = messages.findLastIndex(
    (message) => message.role === "assistant"
  );

  return (
    <div className="space-y-5">
      {messages.map((message, index) => {
        if (message.role === "user") {
          return <CustomerContext key={message.id} message={message} />;
        }

        const isLatest = index === lastAssistantIndex;
        if (!isLatest) {
          return <CollapsedAssessment key={message.id} message={message} />;
        }

        return (
          <section key={message.id}>
            <Stamp>COPILOT ASSESSMENT</Stamp>
            <div className="mt-2">
              <InvestigationResult
                investigation={message.investigation}
                selectedId={selectedId}
                onInspect={onInspect}
              />
            </div>
          </section>
        );
      })}

      {isSubmitting ? <InvestigationSkeleton status={loadingStatus} /> : null}
    </div>
  );
}
