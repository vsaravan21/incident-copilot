"use client";

import type { ReactNode } from "react";
import { formatIncidentDate } from "@/lib/investigation";
import type { Incident } from "@/lib/search";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

function DetailSection({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h3 className="text-[13px] font-semibold">{label}</h3>
      <div className="mt-1.5 text-[14px] leading-6">{children}</div>
    </section>
  );
}

export function IncidentSheet({
  incident,
  relevance,
  onOpenChange,
}: {
  incident: Incident | null;
  relevance?: string;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={Boolean(incident)} onOpenChange={onOpenChange}>
        <SheetContent className="gap-0 p-0 data-[side=right]:sm:max-w-lg">
        {incident ? (
          <>
            <SheetHeader className="border-b border-border px-5 py-4">
              <p className="font-mono text-[12px] text-muted-foreground">
                {incident.id}
              </p>
              <SheetTitle className="text-[15px] leading-snug font-semibold">
                {incident.title}
              </SheetTitle>
              <SheetDescription className="sr-only">
                Historical incident details for {incident.id}
              </SheetDescription>
            </SheetHeader>
            <div className="overflow-y-auto">
              <dl className="grid grid-cols-[72px_1fr] gap-x-4 gap-y-2 px-5 py-4 text-[13px]">
                <dt className="text-muted-foreground">Product</dt>
                <dd>{incident.product}</dd>
                <dt className="text-muted-foreground">Date</dt>
                <dd className="tabular-nums">
                  {formatIncidentDate(incident.date)}
                </dd>
                <dt className="text-muted-foreground">Tags</dt>
                <dd className="flex flex-wrap gap-1">
                  {incident.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="rounded-md font-normal"
                    >
                      {tag}
                    </Badge>
                  ))}
                </dd>
              </dl>

              {relevance ? (
                <section className="border-y border-border bg-muted/40 px-5 py-3">
                  <h3 className="text-[13px] font-semibold">
                    Why this is relevant
                  </h3>
                  <p className="mt-1.5 text-[14px] leading-6">{relevance}</p>
                </section>
              ) : null}

              <div className="space-y-4 px-5 py-4">
                <DetailSection label="Summary">{incident.summary}</DetailSection>

                <Separator />
                <DetailSection label="Symptoms">
                  <ul className="space-y-1.5">
                    {incident.symptoms.map((symptom) => (
                      <li key={symptom} className="flex gap-2">
                        <span className="mt-2 size-1 shrink-0 rounded-full bg-muted-foreground/50" />
                        <span>{symptom}</span>
                      </li>
                    ))}
                  </ul>
                </DetailSection>

                <Separator />
                <DetailSection label="Root cause">
                  {incident.root_cause}
                </DetailSection>

                <Separator />
                <DetailSection label="Resolution">
                  {incident.resolution}
                </DetailSection>

                <Separator />
                <DetailSection label="Support notes">
                  {incident.support_notes}
                </DetailSection>
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
