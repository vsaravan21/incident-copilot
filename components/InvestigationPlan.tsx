"use client";

import { useEffect, useState } from "react";
import {
  formatPlanCopy,
  parsePlanSteps,
} from "@/lib/investigation";
import { Button } from "@/components/ui/button";

export function InvestigationPlan({
  title = "Investigation plan",
  steps,
  emptyLabel = "No investigation steps yet.",
}: {
  title?: string;
  steps: string[];
  emptyLabel?: string;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 1400);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  async function copyPlan() {
    try {
      await navigator.clipboard.writeText(formatPlanCopy(steps, title));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (steps.length === 0) {
    return (
      <section>
        <h3 className="text-[15px] font-semibold">{title}</h3>
        <p className="mt-2 max-w-[65ch] text-[14px] leading-6 text-muted-foreground">
          {emptyLabel}
        </p>
      </section>
    );
  }

  const parsed = parsePlanSteps(steps);

  return (
    <section>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[15px] font-semibold">{title}</h3>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          className="h-6 rounded-md px-1.5 font-normal text-muted-foreground hover:text-foreground"
          onClick={() => void copyPlan()}
        >
          {copied ? "Copied" : "Copy plan"}
        </Button>
      </div>
      <ol className="mt-2 space-y-1.5">
        {parsed.map((step, index) => (
          <li
            key={`${step.verb}-${index}`}
            className="grid grid-cols-[20px_6.5rem_minmax(0,1fr)] items-start gap-x-2 text-[14px] leading-5"
          >
            <span className="pt-px font-mono text-[12px] text-muted-foreground tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="pt-px font-mono text-[12px] tracking-[0.06em] whitespace-nowrap text-muted-foreground">
              {step.verb}
            </span>
            <span className="min-w-0">{step.action}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
