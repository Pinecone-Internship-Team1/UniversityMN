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
  title = "Алдаа гарлаа",
  description = "Мэдээллийг ачааллахад алдаа гарлаа. Backend сервер ажиллаж байгаа эсэхийг шалгаад дахин оролдоно уу.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/[0.04] px-6 py-16 text-center",
        className,
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <p className="text-sm font-bold text-ink">{title}</p>
      <p className="max-w-sm text-xs leading-relaxed text-ink/60">
        {description}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-1">
          <RotateCcw className="h-3.5 w-3.5" />
          Дахин оролдох
        </Button>
      )}
    </div>
  );
}
