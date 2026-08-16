import { Activity } from "lucide-react";

export function AppHeader({ incidentCount }: { incidentCount: number }) {
  return (
    <header className="flex items-center justify-between border-b border-border pb-3">
      <div className="flex items-center gap-2.5">
        <div className="flex size-6 items-center justify-center rounded-[5px] border border-border bg-white">
          <Activity className="size-3.5 text-foreground" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-[15px] leading-none font-semibold tracking-tight">
            Incident Copilot
          </h1>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Historical evidence for customer investigations
          </p>
        </div>
      </div>
      <p className="text-[12px] text-muted-foreground tabular-nums">
        {incidentCount} incidents
      </p>
    </header>
  );
}
