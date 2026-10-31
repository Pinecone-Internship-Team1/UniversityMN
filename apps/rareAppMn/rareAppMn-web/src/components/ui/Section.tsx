import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Container } from "./Container";

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  /** "muted" gives the section the deeper paper background to separate it. */
  tone?: "default" | "muted";
  containerClassName?: string;
}

/** A homepage-style band: vertical rhythm plus the shared Container. */
export function Section({ tone = "default", className, containerClassName, children, ...props }: SectionProps) {
  return (
    <section
      className={cn("py-16 md:py-24", tone === "muted" && "bg-paper-deep/60", className)}
      {...props}
    >
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}

/** The small label above a title: an accent dot and a short word or two. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("inline-flex items-center gap-2 text-sm font-bold text-accent-strong", className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
      {children}
    </p>
  );
}

export interface SectionHeaderProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** The page title uses h1; homepage sections use h2. */
  as?: "h1" | "h2";
  align?: "start" | "center";
  /** Shown at the end of the row on wide screens (e.g. «Бүгдийг харах»). */
  action?: ReactNode;
  id?: string;
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  as: Heading = "h2",
  align = "start",
  action,
  id,
  className,
}: SectionHeaderProps) {
  const centered = align === "center";
  return (
    <div
      className={cn(
        "flex flex-col gap-5 md:flex-row md:items-end md:justify-between",
        centered && "items-center text-center md:flex-col md:items-center",
        className,
      )}
    >
      <div className={cn("max-w-2xl", centered && "mx-auto")}>
        {eyebrow && <Eyebrow className="mb-3">{eyebrow}</Eyebrow>}
        <Heading
          id={id}
          className={cn(
            "text-ink",
            Heading === "h1" ? "text-[1.75rem] sm:text-4xl lg:text-[2.75rem]" : "text-2xl sm:text-3xl lg:text-4xl",
          )}
        >
          {title}
        </Heading>
        {description && (
          <p className="mt-3 text-base leading-relaxed text-ink-2 md:text-lg">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
