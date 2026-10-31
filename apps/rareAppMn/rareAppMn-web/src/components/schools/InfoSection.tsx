import type { LucideIcon } from "lucide-react";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A titled card on a school page. Long sections are collapsible (<details>, so
 * they work without JS and stay in the HTML for search engines); short ones
 * pass collapsible={false}.
 */
export function InfoSection({
  icon: Icon,
  title,
  meta,
  children,
  collapsible = true,
  defaultOpen = false,
  id,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  /** Short text beside the title, e.g. "17 тэтгэлэг". */
  meta?: ReactNode;
  children: ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  id?: string;
  className?: string;
}) {
  const heading = (
    <span className="flex min-w-0 flex-1 items-center gap-3">
      {Icon && (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      )}
      <h2 className="min-w-0 text-lg leading-tight text-ink md:text-xl">{title}</h2>
    </span>
  );
  const frame = cn("scroll-mt-20 rounded-2xl border border-border-ink bg-card", className);

  if (!collapsible) {
    return (
      <section id={id} className={cn(frame, "p-5 md:p-7")}>
        <div className="flex items-center gap-3">
          {heading}
          {meta && <span className="shrink-0 text-[15px] text-ink-3">{meta}</span>}
        </div>
        <div className="mt-4">{children}</div>
      </section>
    );
  }

  return (
    <details id={id} open={defaultOpen} className={cn(frame, "group")}>
      <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 p-5 md:px-7 [&::-webkit-details-marker]:hidden">
        {heading}
        {meta && <span className="hidden shrink-0 text-[15px] text-ink-3 min-[400px]:inline">{meta}</span>}
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink/[0.05] text-ink-2 transition-transform duration-200 group-open:rotate-180">
          <ChevronDown className="h-5 w-5" aria-hidden="true" />
        </span>
      </summary>
      <div className="px-5 pb-5 md:px-7 md:pb-7">{children}</div>
    </details>
  );
}
