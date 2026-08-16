"use client";

import { ArrowUpRight } from "lucide-react";
import type { ExternalSource, WebRetrievalStatus } from "@/lib/investigation";

export function ExternalSourceList({
  sources,
  status,
  note,
}: {
  sources: ExternalSource[];
  status: WebRetrievalStatus;
  note: string;
}) {
  if (status === "skipped" && sources.length === 0) return null;

  return (
    <section className="mt-6">
      <h3 className="text-[15px] font-semibold">External references</h3>
      <p className="mt-1 text-[12px] text-muted-foreground">
        Public technical sources
      </p>
      {sources.length === 0 ? (
        <p className="mt-2 text-[13px] leading-5 text-muted-foreground">
          {note ||
            (status === "unavailable"
              ? "Web retrieval is unavailable."
              : "Web retrieval returned no useful sources.")}
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-border border-y border-border">
          {sources.map((source) => (
            <li key={source.url}>
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="flex w-full min-w-0 items-start gap-3 py-2.5 text-left transition-colors duration-150 hover:bg-muted/80 focus-visible:bg-muted/80 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none"
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-mono text-[12px] text-muted-foreground">
                      {source.domain}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-[13px] leading-5">
                    {source.title}
                  </span>
                  {source.relevance ? (
                    <span className="mt-0.5 block text-[13px] leading-5 text-muted-foreground">
                      {source.relevance}
                    </span>
                  ) : null}
                </span>
                <span className="mt-0.5 flex shrink-0 items-center gap-0.5 text-[12px] text-muted-foreground">
                  Open
                  <ArrowUpRight className="size-3.5" aria-hidden="true" />
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
