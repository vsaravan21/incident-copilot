"use client";

import { Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { groupSessions, type InvestigationSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export function SessionSidebar({
  sessions,
  activeId,
  onSelect,
  onNew,
  disabled = false,
}: {
  sessions: InvestigationSession[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  disabled?: boolean;
}) {
  const groups = groupSessions(sessions);

  return (
    <aside className="flex w-[260px] shrink-0 flex-col border-r border-border bg-muted/30">
      <div className="border-b border-border px-3 py-3">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-[5px] border border-border bg-white">
            <Activity className="size-3.5 text-foreground" aria-hidden="true" />
          </div>
          <h1 className="text-[15px] leading-none font-semibold tracking-tight">
            Incident Copilot
          </h1>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3 w-full rounded-md font-normal"
          onClick={onNew}
          disabled={disabled}
        >
          New investigation
        </Button>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-3" aria-label="Investigations">
        {groups.length === 0 ? (
          <p className="px-2 text-[12px] text-muted-foreground">No cases yet.</p>
        ) : (
          groups.map((group) => (
            <section key={group.label} className="mb-4">
              <h2 className="px-2 text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
                {group.label}
              </h2>
              <ul className="mt-1">
                {group.sessions.map((session) => {
                  const selected = session.id === activeId;
                  return (
                    <li key={session.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(session.id)}
                        disabled={disabled}
                        aria-current={selected ? "page" : undefined}
                        className={cn(
                          "w-full truncate rounded-md px-2 py-1.5 text-left text-[13px] leading-5 transition-colors duration-150",
                          selected
                            ? "bg-primary/10 text-foreground"
                            : "text-foreground hover:bg-muted"
                        )}
                        title={session.title}
                      >
                        {session.title}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </nav>
    </aside>
  );
}
