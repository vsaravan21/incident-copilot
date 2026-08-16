"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type IssueComposerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  variant?: "start" | "follow-up";
};

export function IssueComposer({
  value,
  onChange,
  onSubmit,
  isSubmitting,
  variant = "start",
}: IssueComposerProps) {
  const [modifier, setModifier] = useState("Ctrl");

  useEffect(() => {
    const isMac = /Mac|iPhone|iPad/.test(navigator.userAgent);
    setModifier(isMac ? "⌘" : "Ctrl");
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      if (value.trim() && !isSubmitting) {
        onSubmit();
      }
    }
  }

  const followUp = variant === "follow-up";
  const fieldId = followUp ? "customer-follow-up" : "customer-issue";

  return (
    <section>
      <label htmlFor={fieldId} className="text-[13px] font-medium">
        {followUp
          ? "Add information from the customer"
          : "What is the customer seeing?"}
      </label>
      <div className="mt-2 rounded-md border border-border bg-white transition-[border-color,box-shadow] duration-150 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20">
        <Textarea
          id={fieldId}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSubmitting}
          placeholder={
            followUp
              ? "e.g. They are using an H100 on-prem and the issue started after batch size doubled…"
              : "e.g. TTFT increased significantly after the customer changed their system prompt…"
          }
          rows={followUp ? 2 : 3}
          className={cn(
            "resize-none rounded-none border-0 bg-transparent px-3 py-2 text-[14px] leading-6 shadow-none focus-visible:border-transparent focus-visible:ring-0",
            followUp ? "min-h-[48px]" : "min-h-[78px]"
          )}
        />
        <div className="flex items-center justify-between gap-3 border-t border-border px-3 py-2">
          <p className="text-[12px] text-muted-foreground">
            {followUp
              ? "Copilot re-searches the corpus with the full case so far."
              : "Copilot searches historical incidents before it diagnoses."}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden text-[11px] text-muted-foreground tabular-nums sm:inline">
              {modifier} Enter
            </span>
            <Button
              type="button"
              size="sm"
              onClick={onSubmit}
              disabled={isSubmitting || !value.trim()}
            >
              <Search data-icon="inline-start" />
              {followUp ? "Update investigation" : "Investigate"}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
