"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export interface ConfirmDeleteButtonProps {
  onConfirm: () => Promise<void>;
  disabled?: boolean;
  label?: string;
}

export function ConfirmDeleteButton({
  onConfirm,
  disabled,
  label = "Устгах",
}: ConfirmDeleteButtonProps) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={() => setConfirming(true)}
      >
        <Trash2 className="h-3.5 w-3.5" />
        {label}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="destructive"
        size="sm"
        disabled={disabled}
        onClick={async () => {
          await onConfirm();
          setConfirming(false);
        }}
      >
        Баталгаажуулах
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
        Болих
      </Button>
    </div>
  );
}
