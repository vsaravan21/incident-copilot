"use client";

import { ChevronRight } from "lucide-react";
import { formatIncidentDate } from "@/lib/investigation";
import type { Incident } from "@/lib/search";
import { cn } from "@/lib/utils";

export function EvidenceList({
  incidents,
  selectedId,
  onInspect,
  heading = "Historical evidence",
  emptyLabel = "No matching incidents found.",
  analog = false,
}: {
  incidents: Incident[];
  selectedId?: string;
  onInspect: (incident: Incident) => void;
  heading?: string;
  emptyLabel?: string;
  analog?: boolean;
}) {
  return (
    <section>
      <h3 className="flex items-baseline gap-2 text-[15px] font-semibold">
        {heading}
        <span className="font-normal text-[12px] text-muted-foreground tabular-nums">
          {incidents.length}
        </span>
      </h3>
      {incidents.length === 0 ? (
        <p className="mt-2 text-[13px] leading-5 text-muted-foreground">
          {emptyLabel}
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-border border-y border-border">
          {incidents.map((incident) => {
            const selected = incident.id === selectedId;
            return (
              <li key={incident.id}>
                <button
                  type="button"
                  aria-pressed={selected}
                  aria-label={`Inspect ${incident.id}: ${incident.title}`}
                  onClick={() => onInspect(incident)}
                  className={cn(
                    "flex w-full min-w-0 items-center gap-3 py-2.5 text-left transition-colors duration-150 hover:bg-muted/80 focus-visible:bg-muted/80 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none",
                    selected && "bg-primary/10"
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span
                        className={cn(
                          "font-mono text-[12px]",
                          selected ? "text-primary" : "text-muted-foreground"
                        )}
                      >
                        {incident.id}
                      </span>
                      <span className="text-[12px] text-muted-foreground tabular-nums">
                        {formatIncidentDate(incident.date)}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-[13px] leading-5">
                      {incident.title}
                    </span>
                    {analog ? (
                      <span className="mt-0.5 block font-mono text-[11px] tracking-[0.06em] text-muted-foreground">
                        ANALOG
                      </span>
                    ) : null}
                  </span>
                  <span className="flex shrink-0 items-center gap-0.5 text-[12px] text-muted-foreground">
                    Inspect
                    <ChevronRight className="size-3.5" aria-hidden="true" />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
