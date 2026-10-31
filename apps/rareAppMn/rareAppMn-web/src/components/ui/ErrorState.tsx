"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Мэдээллийг ачаалж чадсангүй",
  description = "Холболт түр тасарсан байж магадгүй. Хэсэг хүлээгээд дахин оролдоно уу.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-destructive/25 bg-destructive/[0.04] px-6 py-14 text-center",
        className,
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
      </div>
      <p className="text-lg font-bold text-ink">{title}</p>
      <p className="max-w-sm text-base leading-relaxed text-ink-2">
        {description}
      </p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="mt-2">
          <RotateCcw />
          Дахин оролдох
        </Button>
      )}
    </div>
  );
}
