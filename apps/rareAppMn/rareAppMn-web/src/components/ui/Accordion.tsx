import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface AccordionItemProps {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  /** Heading level for the title, so the page outline stays correct. */
  headingLevel?: "h2" | "h3" | "h4";
  /** Items sharing a name open one at a time. */
  name?: string;
  className?: string;
  /** Right-aligned text next to the title, e.g. a count. */
  meta?: ReactNode;
}

/**
 * Built on <details>/<summary>: keyboard, screen readers and find-in-page work
 * without JavaScript, and the content is in the HTML for search engines.
 */
export function AccordionItem({
  title,
  children,
  defaultOpen,
  headingLevel: Heading = "h3",
  name,
  className,
  meta,
}: AccordionItemProps) {
  return (
    <details name={name} open={defaultOpen} className={cn("group border-b border-border-ink last:border-b-0", className)}>
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 py-4 text-left [&::-webkit-details-marker]:hidden">
        <Heading className="flex-1 font-sans text-[17px] font-bold leading-snug tracking-normal text-ink">
          {title}
        </Heading>
        {meta && <span className="shrink-0 text-sm text-ink-3">{meta}</span>}
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink/[0.05] text-ink-2 transition-transform duration-200 group-open:rotate-180">
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </span>
      </summary>
      <div className="pb-5 text-base leading-relaxed text-ink-2">{children}</div>
    </details>
  );
}

export function Accordion({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl border border-border-ink bg-card px-4 md:px-6", className)}>{children}</div>;
}
