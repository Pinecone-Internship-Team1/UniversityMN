"use client";

import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
import type { ReactNode } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

/** The search box above a result list, with a clear button once there's text. */
export function SearchField({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
}) {
  return (
    <div className="relative flex-1">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-3" aria-hidden="true" />
      <Input
        type="search"
        enterKeyHint="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="pl-12 pr-12"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Хайлтыг арилгах"
          className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-ink-3 hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export interface FiltersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** How many filters are set (shown on the button). */
  activeCount: number;
  /** Results for the current filters, for «Үр дүн харах (N)»; null while unknown. */
  resultCount: number | null;
  onClear: () => void;
  /** The filter fields themselves. */
  children: ReactNode;
}

/**
 * The «Шүүлтүүр» button and its panel: a bottom sheet on phones (with a sticky
 * «Цэвэрлэх» / «Үр дүн харах (N)» bar), an inline panel on wider screens.
 * Filters apply as they change; the sheet's button just closes it.
 */
export function Filters({ open, onOpenChange, activeCount, resultCount, onClear, children }: FiltersProps) {
  const wide = useMediaQuery("(min-width: 768px)");
  return (
    <>
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        className={cn(
          "inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl border px-4 text-base font-bold transition-colors active:scale-[0.98]",
          open || activeCount > 0
            ? "border-accent bg-accent-soft text-accent-strong"
            : "border-ink/20 bg-card text-ink hover:border-ink/50",
        )}
      >
        <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
        <span className="max-[359px]:sr-only">Шүүлтүүр</span>
        {activeCount > 0 && (
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1.5 text-sm text-accent-foreground">
            {activeCount}
          </span>
        )}
      </button>

      {wide ? (
        open && <FiltersInline onClear={onClear} activeCount={activeCount}>{children}</FiltersInline>
      ) : (
        <BottomSheet
          open={open}
          onClose={() => onOpenChange(false)}
          title="Шүүлтүүр"
          footer={
            <div className="flex gap-3">
              <Button variant="secondary" onClick={onClear} disabled={activeCount === 0} className="flex-1">
                Цэвэрлэх
              </Button>
              <Button onClick={() => onOpenChange(false)} className="flex-[2]">
                Үр дүн харах{resultCount != null ? ` (${resultCount})` : ""}
              </Button>
            </div>
          }
        >
          <div className="space-y-5">{children}</div>
        </BottomSheet>
      )}
    </>
  );
}

function FiltersInline({
  children,
  onClear,
  activeCount,
}: {
  children: ReactNode;
  onClear: () => void;
  activeCount: number;
}) {
  return (
    <div className="order-last mt-1 w-full rounded-2xl border border-border-ink bg-card p-5">
      <div className="grid gap-5 md:grid-cols-3">{children}</div>
      {activeCount > 0 && (
        <button type="button" onClick={onClear} className="mt-4 min-h-11 font-bold text-accent-strong hover:underline">
          Шүүлтүүр цэвэрлэх
        </button>
      )}
    </div>
  );
}

/** A labelled checkbox row, 48px tall so it's easy to tap. */
export function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border-ink bg-paper px-4 text-base font-bold text-ink has-[:checked]:border-accent has-[:checked]:bg-accent-soft">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 accent-[var(--accent)]"
      />
      {label}
    </label>
  );
}

/** «N сургууль олдлоо» above the results; the list's heading (cards inside are h3). */
export function ResultCount({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-4 font-sans text-[15px] font-bold tracking-normal text-ink-2" aria-live="polite">
      {children}
    </h2>
  );
}

export function Pager({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  const go = (next: number) => {
    onPageChange(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <nav aria-label="Хуудаслалт" className="mt-10 flex items-center justify-center gap-3">
      <Button variant="secondary" size="icon" onClick={() => go(page - 1)} disabled={page <= 1} aria-label="Өмнөх хуудас">
        <ChevronLeft />
      </Button>
      <span className="min-w-20 text-center text-base font-bold text-ink-2 tabular-nums">
        {page} / {totalPages}
      </span>
      <Button variant="secondary" size="icon" onClick={() => go(page + 1)} disabled={page >= totalPages} aria-label="Дараагийн хуудас">
        <ChevronRight />
      </Button>
    </nav>
  );
}
