"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

export interface TabItem<T extends string> {
  id: T;
  label: string;
  icon?: LucideIcon;
  /** Set for tabs that are pages (each tab is a link); leave out for in-page tabs. */
  href?: string;
}

export interface TabsProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  /** Called for in-page tabs; link tabs navigate instead. */
  onChange?: (id: T) => void;
  label: string;
  /** Stretch to the full width (each tab gets an equal share). */
  fullWidth?: boolean;
  className?: string;
  /** Extra props for link tabs, e.g. replace/scroll. */
  linkProps?: { replace?: boolean; scroll?: boolean };
}

const TAB_CLASSES =
  "flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[10px] px-4 text-[15px] font-bold transition-colors duration-150 [&_svg]:size-4";

/**
 * A segmented control. In-page tabs follow the ARIA tabs pattern (arrow keys,
 * Home/End move between tabs); link tabs are a nav with aria-current.
 */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  label,
  fullWidth = false,
  className,
  linkProps,
}: TabsProps<T>) {
  const listRef = useRef<HTMLDivElement>(null);
  const isLinks = items.every((item) => item.href);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
    if (isLinks || !keys.includes(event.key)) return;
    event.preventDefault();
    const index = items.findIndex((item) => item.id === value);
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? items.length - 1
          : (index + (event.key === "ArrowRight" ? 1 : -1) + items.length) % items.length;
    onChange?.(items[next].id);
    listRef.current?.querySelectorAll<HTMLButtonElement>("[role=tab]")[next]?.focus();
  }

  const frame = cn(
    "inline-flex gap-1 rounded-2xl border border-border-ink bg-card p-1",
    fullWidth && "flex w-full",
    className,
  );

  if (isLinks) {
    return (
      <nav aria-label={label} className={frame}>
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.id === value;
          return (
            <Link
              key={item.id}
              href={item.href ?? "#"}
              {...linkProps}
              aria-current={active ? "page" : undefined}
              className={cn(TAB_CLASSES, active ? "bg-ink text-paper" : "text-ink-2 hover:bg-ink/[0.05] hover:text-ink")}
            >
              {Icon && <Icon aria-hidden="true" />}
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <div ref={listRef} role="tablist" aria-label={label} onKeyDown={handleKeyDown} className={frame}>
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange?.(item.id)}
            className={cn(TAB_CLASSES, active ? "bg-ink text-paper" : "text-ink-2 hover:bg-ink/[0.05] hover:text-ink")}
          >
            {Icon && <Icon aria-hidden="true" />}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
