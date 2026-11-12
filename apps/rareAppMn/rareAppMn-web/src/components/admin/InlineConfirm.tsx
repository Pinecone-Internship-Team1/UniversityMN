"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface InlineConfirmProps {
  message: string;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
  busy?: boolean;
  confirmLabel?: string;
  busyLabel?: string;
  /** "danger" (default) for deletes and removals, "accent" for granting something. */
  tone?: "danger" | "accent";
  className?: string;
}

/** A slim "are you sure?" strip shown in place, after picking a destructive or sensitive action. */
export function InlineConfirm({
  message,
  onConfirm,
  onCancel,
  busy,
  confirmLabel,
  busyLabel,
  tone = "danger",
  className,
}: InlineConfirmProps) {
  const t = useTranslations("common");
  confirmLabel ??= t("delete");
  busyLabel ??= t("deleting");
  return (
    <div
      role="alertdialog"
      aria-label={message}
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2",
        tone === "danger"
          ? "border-destructive/25 bg-destructive/5"
          : "border-accent/30 bg-accent/5",
        className,
      )}
    >
      <p className="text-xs font-medium text-ink/80">{message}</p>
      <div className="flex gap-1.5">
        <Button
          variant={tone === "danger" ? "destructive" : "primary"}
          size="sm"
          disabled={busy}
          onClick={() => void onConfirm()}
        >
          {busy ? busyLabel : confirmLabel}
        </Button>
        <Button variant="ghost" size="sm" disabled={busy} onClick={onCancel}>
          {t("cancel")}
        </Button>
      </div>
    </div>
  );
}
