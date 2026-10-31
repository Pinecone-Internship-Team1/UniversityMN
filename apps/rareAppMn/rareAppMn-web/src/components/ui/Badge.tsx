import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "default" | "accent" | "success" | "outline";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: "bg-ink/[0.06] text-ink-2",
  accent: "bg-accent-soft text-accent",
  success: "bg-success-soft text-success",
  outline: "border border-ink/15 text-ink-3",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

/** A short status or fact. Never shrinks: put it on its own line when space is tight. */
export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-[13px] font-bold leading-none [&_svg]:size-3.5",
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    />
  );
}
