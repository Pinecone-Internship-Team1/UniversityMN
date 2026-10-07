import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-ink/[0.06] dark:bg-ink/[0.08]",
        className,
      )}
      {...props}
    />
  );
}

export function SchoolCardSkeleton() {
  return (
    <div className="flex w-[290px] shrink-0 flex-col gap-5 rounded-2xl border border-ink/10 bg-card p-6 sm:w-[320px]">
      <div className="flex items-start justify-between gap-4">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-11 w-11 rounded-xl" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-full" />
      </div>
      <div className="space-y-2.5 border-t border-ink/10 pt-4">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="h-3.5 w-2/3" />
      </div>
      <Skeleton className="h-4 w-28" />
    </div>
  );
}

export function SchoolCardSkeletonRow({ count = 4 }: { count?: number }) {
  return (
    <div className="mt-10 flex gap-5 overflow-hidden pb-4 pt-2">
      {Array.from({ length: count }).map((_, index) => (
        <SchoolCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function SchoolCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <SchoolCardSkeleton key={index} />
      ))}
    </div>
  );
}
