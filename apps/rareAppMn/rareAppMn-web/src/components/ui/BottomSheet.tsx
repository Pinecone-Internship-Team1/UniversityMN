"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Sticky footer, e.g. «Цэвэрлэх» and «Үр дүн харах (N)». */
  footer?: ReactNode;
  className?: string;
}

/**
 * A modal <dialog>: slides up from the bottom on phones, a centred panel on
 * wide screens. The browser handles focus trapping, Esc and the inert
 * background; we add scroll lock and close on backdrop tap.
 */
export function BottomSheet({ open, onClose, title, children, footer, className }: BottomSheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      document.documentElement.style.overflow = "hidden";
    } else if (!open && dialog.open) {
      dialog.close();
    }
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={() => {
        document.documentElement.style.overflow = "";
        onClose();
      }}
      onClick={(event) => {
        // A click on the dialog element itself is a click on the backdrop.
        if (event.target === ref.current) onClose();
      }}
      className={cn(
        "m-0 mt-auto max-h-[88dvh] w-full max-w-none overflow-hidden rounded-t-3xl border border-border-ink bg-card p-0 text-ink shadow-sheet backdrop:bg-black/40 open:flex open:flex-col open:animate-[sheet-in_220ms_ease-out] backdrop:animate-[fade-in_200ms_ease-out]",
        "md:m-auto md:max-h-[80dvh] md:max-w-lg md:rounded-3xl",
        className,
      )}
    >
      <div className="relative flex items-center justify-between gap-3 border-b border-border-ink px-4 py-3 md:px-6">
        <span className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-ink/15 md:hidden" aria-hidden="true" />
        <h2 id={titleId} className="pt-1 font-sans text-lg font-bold tracking-normal">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Хаах"
          className="flex h-11 w-11 items-center justify-center rounded-full text-ink-2 hover:bg-ink/[0.06] active:bg-ink/[0.1]"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5 md:px-6">{children}</div>
      {footer && <div className="border-t border-border-ink bg-card px-4 pt-3 pb-safe md:px-6">{footer}</div>}
    </dialog>
  );
}
