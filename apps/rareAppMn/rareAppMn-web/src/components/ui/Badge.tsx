import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "default" | "accent" | "outline";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: "bg-ink/5 text-ink/70",
  accent: "bg-accent-soft text-accent",
  outline: "border border-ink/15 text-ink/70",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold",
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    />
  );
}
