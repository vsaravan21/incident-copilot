"use client";

import { Button } from "@/components/ui/button";

const PREVIEW_SLOTS = [1, 2, 3];

export function CaseFilePreview({
  examples,
  onPickExample,
}: {
  examples: string[];
  onPickExample: (example: string) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[12px] text-muted-foreground">Fill from a symptom</p>
        {examples.map((example) => (
          <Button
            key={example}
            type="button"
            variant="outline"
            size="xs"
            className="rounded-md font-normal"
            onClick={() => onPickExample(example)}
          >
            {example}
          </Button>
        ))}
      </div>

      <section
        className="overflow-hidden rounded-md border border-border bg-white"
        aria-hidden="true"
      >
        <div className="grid md:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)]">
          <div className="space-y-5 border-b border-border px-4 py-4 md:border-r md:border-b-0">
            <div>
              <p className="text-[13px] font-semibold text-muted-foreground">
                Assessment
              </p>
              <div className="mt-3 space-y-2">
                <div className="h-px w-full bg-border" />
                <div className="h-px w-[86%] bg-border" />
              </div>
            </div>
            <div>
              <p className="text-[13px] font-semibold text-muted-foreground">
                Investigation plan
              </p>
              <ol className="mt-3 space-y-2">
                {PREVIEW_SLOTS.map((slot) => (
                  <li key={slot} className="flex items-center gap-3">
                    <span className="w-5 shrink-0 font-mono text-[12px] text-muted-foreground/70 tabular-nums">
                      {String(slot).padStart(2, "0")}
                    </span>
                    <span className="h-px flex-1 bg-border" />
                  </li>
                ))}
              </ol>
            </div>
          </div>
          <div className="bg-muted/30 px-4 py-4">
            <p className="text-[13px] font-semibold text-muted-foreground">
              Evidence
            </p>
            <ul className="mt-3 divide-y divide-border border-y border-border">
              {PREVIEW_SLOTS.map((slot) => (
                <li key={slot} className="flex items-center gap-3 py-2.5">
                  <span className="font-mono text-[12px] text-muted-foreground/45">
                    INC-
                  </span>
                  <span className="h-px flex-1 bg-border" />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
