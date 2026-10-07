import type { LucideIcon } from "lucide-react";
import { SearchX } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = SearchX,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ink/15 bg-card/60 px-6 py-16 text-center",
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink/5 text-ink/40">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <p className="text-sm font-bold text-ink">{title}</p>
      {description && (
        <p className="max-w-sm text-xs leading-relaxed text-ink/60">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}
