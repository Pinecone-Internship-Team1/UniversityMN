import type { ElementType, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  /** Lifts on hover (pointer devices only) and dims slightly when pressed. */
  interactive?: boolean;
  padding?: "none" | "sm" | "md";
}

const PADDING = { none: "", sm: "p-4", md: "p-5 md:p-6" };

export function cardClassName({
  interactive = false,
  padding = "md",
  className,
}: Pick<CardProps, "interactive" | "padding" | "className">) {
  return cn(
    "rounded-2xl border border-border-ink bg-card shadow-card",
    PADDING[padding],
    interactive &&
      "transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-ink/25 hover:shadow-lift active:scale-[0.995]",
    className,
  );
}

export function Card({ as: Tag = "div", interactive, padding, className, ...props }: CardProps) {
  return <Tag className={cardClassName({ interactive, padding, className })} {...props} />;
}
