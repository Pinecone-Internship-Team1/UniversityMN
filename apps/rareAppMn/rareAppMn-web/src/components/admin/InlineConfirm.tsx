"use client";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface InlineConfirmProps {
  message: string;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
  busy?: boolean;
  confirmLabel?: string;
  className?: string;
}

/** A slim "are you sure?" strip shown in place, after picking a destructive menu action. */
export function InlineConfirm({
  message,
  onConfirm,
  onCancel,
  busy,
  confirmLabel = "Устгах",
  className,
}: InlineConfirmProps) {
  return (
    <div
      role="alertdialog"
      aria-label={message}
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2",
        className,
      )}
    >
      <p className="text-xs font-medium text-ink/80">{message}</p>
      <div className="flex gap-1.5">
        <Button variant="destructive" size="sm" disabled={busy} onClick={() => void onConfirm()}>
          {busy ? "Устгаж байна..." : confirmLabel}
        </Button>
        <Button variant="ghost" size="sm" disabled={busy} onClick={onCancel}>
          Болих
        </Button>
      </div>
    </div>
  );
}
