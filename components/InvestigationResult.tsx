"use client";

import type { ReactNode } from "react";
import type { HistoricalEvidenceStatus, Investigation } from "@/lib/investigation";
import {
  historicalEvidenceStatusOf,
  historicalStatusLabel,
  normalizeInvestigation,
  parsePlanStep,
  supportingIncidentLabel,
} from "@/lib/investigation";
import type { Incident } from "@/lib/search";
import { Badge } from "@/components/ui/badge";
import { EvidenceList } from "@/components/EvidenceList";
import { ExternalSourceList } from "@/components/ExternalSourceList";
import { InvestigationPlan } from "@/components/InvestigationPlan";

function AssessmentText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return (
    <p className="mt-2 max-w-[65ch] min-w-0 whitespace-pre-wrap break-words text-[14px] leading-6">
      {parts.map((part, index) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={index} className="font-semibold">
            {part.slice(2, -2)}
          </strong>
        ) : (
          part
        )
      )}
    </p>
  );
}

function Section({
  title,
  caption,
  badge,
  children,
}: {
  title: string;
  caption?: string;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[15px] font-semibold">{title}</h2>
        {badge ? (
          <Badge
            variant="outline"
            className="rounded-md font-normal text-foreground"
          >
            {badge}
          </Badge>
        ) : null}
      </div>
      {caption ? (
        <p className="mt-1.5 text-[12px] text-muted-foreground">{caption}</p>
      ) : null}
      <div className="mt-1.5">{children}</div>
    </section>
  );
}

export function InvestigationResult({
  investigation: rawInvestigation,
  selectedId,
  onInspect,
}: {
  investigation: Investigation;
  selectedId?: string;
  onInspect: (incident: Incident) => void;
}) {
  const investigation = normalizeInvestigation(rawInvestigation);
  const historicalStatus = historicalEvidenceStatusOf(investigation);
  const insufficient = investigation.assessmentType === "insufficient_context";
  const evidence = investigation.evidence;
  const count = evidence.length;
  const historical = investigation.historicalAssessment.trim();
  const general = investigation.generalTechnicalAssessment.trim();
  const nextSteps = investigation.nextSteps;
  const followUpQuestions = investigation.followUpQuestions;
  const showGeneral =
    !insufficient &&
    Boolean(general) &&
    (historicalStatus !== "strong" || general !== historical);

  return (
    <section className="overflow-hidden rounded-md border border-border bg-white">
      <div className="grid md:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)]">
        <div className="min-w-0 space-y-5 border-b border-border px-4 py-4 md:border-r md:border-b-0">
          {investigation.revised ? (
            <p className="text-[13px] font-medium">
              {investigation.revisionNote ||
                "Assessment updated based on new customer context."}
            </p>
          ) : null}

          {insufficient ? (
            <Section title="Insufficient information">
              <p className="max-w-[65ch] text-[14px] leading-6">
                {investigation.assessment ||
                  "There is not enough customer context to form a useful hypothesis yet."}
              </p>
            </Section>
          ) : (
            <HistoricalSection
              status={historicalStatus}
              count={count}
              text={historical}
            />
          )}

          {showGeneral ? (
            <Section
              title="General technical assessment"
              caption={
                historicalStatus === "none"
                  ? "Not grounded in internal incident history"
                  : "Model-generated hypothesis"
              }
            >
              <AssessmentText text={general} />
            </Section>
          ) : null}

          {insufficient ? (
            <InvestigationPlan
              title="Ask next"
              steps={followUpQuestions.map((question) => {
                const { action } = parsePlanStep(question);
                return `ASK ${action}`;
              })}
              emptyLabel="Ask which product, what changed, and whether they can share request IDs."
            />
          ) : (
            <InvestigationPlan
              title="What to check next"
              steps={nextSteps}
            />
          )}

          {!insufficient && followUpQuestions.length > 0 ? (
            <InvestigationPlan
              title="Ask the customer"
              steps={followUpQuestions.map((question) => {
                const { action } = parsePlanStep(question);
                return `ASK ${action}`;
              })}
            />
          ) : null}
        </div>

        <div className="min-w-0 bg-muted/30 px-4 py-4">
          <EvidenceList
            heading={
              historicalStatus === "analogous"
                ? "Historical analogs"
                : "Historical evidence"
            }
            emptyLabel="The internal incident corpus does not contain a prior case that directly supports this diagnosis."
            analog={historicalStatus === "analogous"}
            incidents={evidence}
            selectedId={selectedId}
            onInspect={onInspect}
          />
          <ExternalSourceList
            sources={investigation.externalSources}
            status={investigation.webRetrievalStatus}
            note={investigation.webRetrievalNote}
          />
        </div>
      </div>
    </section>
  );
}

function HistoricalSection({
  status,
  count,
  text,
}: {
  status: HistoricalEvidenceStatus;
  count: number;
  text: string;
}) {
  if (status === "strong") {
    return (
      <Section
        title="Historically grounded assessment"
        caption={`Internal Fireworks incident evidence · ${supportingIncidentLabel(count)}`}
        badge={historicalStatusLabel(status)}
      >
        <AssessmentText text={text} />
      </Section>
    );
  }

  if (status === "analogous") {
    return (
      <Section
        title="Relevant historical analog"
        caption="Similar internal case with important differences"
        badge={historicalStatusLabel(status)}
      >
        <AssessmentText
          text={
            text ||
            "Retrieved incidents share a relevant mechanism but are not a direct match."
          }
        />
      </Section>
    );
  }

  return (
    <Section
      title="No historical match"
      caption="Internal Fireworks incident evidence"
      badge={historicalStatusLabel(status)}
    >
      <p className="max-w-[65ch] text-[14px] leading-6">
        {text ||
          "The internal incident corpus does not contain a prior case that directly supports this diagnosis."}
      </p>
    </Section>
  );
}
