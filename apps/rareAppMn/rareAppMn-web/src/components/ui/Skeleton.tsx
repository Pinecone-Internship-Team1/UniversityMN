import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-xl bg-ink/[0.07] dark:bg-ink/[0.09]",
        className,
      )}
      {...props}
    />
  );
}

/** Same footprint as SchoolCard, so nothing moves when the cards arrive. */
export function SchoolCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex w-full flex-col gap-4 rounded-2xl border border-border-ink bg-card p-5", className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
      <div className="space-y-2.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

export function SchoolCardSkeletonRow({ count = 4 }: { count?: number }) {
  return (
    <div className="flex gap-4 overflow-hidden">
      {Array.from({ length: count }).map((_, index) => (
        <SchoolCardSkeleton key={index} className="w-[300px] shrink-0 sm:w-[340px]" />
      ))}
    </div>
  );
}

export function SchoolCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div role="status" aria-label="Ачаалж байна" className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <SchoolCardSkeleton key={index} />
      ))}
    </div>
  );
}
