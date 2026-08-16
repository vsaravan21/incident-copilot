import { Skeleton } from "@/components/ui/skeleton";

export function InvestigationSkeleton({
  status = "Searching historical incidents…",
}: {
  status?: string;
}) {
  return (
    <section
      className="overflow-hidden rounded-md border border-border bg-white"
      aria-busy="true"
      aria-live="polite"
    >
      <p className="border-b border-border px-4 py-2.5 text-[12px] text-muted-foreground">
        {status}
      </p>
      <div className="grid md:grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)]">
        <div className="space-y-5 border-b border-border px-4 py-4 md:border-r md:border-b-0">
          <div className="space-y-2.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[92%]" />
            <Skeleton className="h-4 w-[68%]" />
          </div>
          <div className="space-y-2.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-[88%]" />
            <Skeleton className="h-4 w-[76%]" />
            <Skeleton className="h-4 w-[64%]" />
          </div>
        </div>
        <div className="space-y-3 px-4 py-4">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      </div>
    </section>
  );
}
