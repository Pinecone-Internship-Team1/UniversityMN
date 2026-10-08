"use client";

import { X } from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "urql";
import {
  MAJOR_BOOKMARK_CACHE,
  TOGGLE_SAVE_MAJOR_MUTATION,
  type ToggleSaveMajorResult,
  type ToggleSaveMajorVariables,
} from "@/lib/graphql/documents";
import { getErrorMessage } from "@/lib/graphql/errors";

export interface MajorUnsaveButtonProps {
  majorId: string;
  majorName?: string;
  onUnsaved: () => void;
}

/** Only used where a major is already known to be saved (the profile page's saved-majors list). */
export function MajorUnsaveButton({
  majorId,
  majorName,
  onUnsaved,
}: MajorUnsaveButtonProps) {
  const [{ fetching }, toggleSaveMajor] = useMutation<
    ToggleSaveMajorResult,
    ToggleSaveMajorVariables
  >(TOGGLE_SAVE_MAJOR_MUTATION);

  return (
    <button
      type="button"
      disabled={fetching}
      onClick={async () => {
        const result = await toggleSaveMajor({ majorId }, MAJOR_BOOKMARK_CACHE);
        if (result.error) {
          toast.error("Хасахад алдаа гарлаа", {
            description: getErrorMessage(result.error),
          });
          return;
        }
        if (result.data?.toggleSaveMajor === false) {
          onUnsaved();
          toast.success(`${majorName ?? "Мэргэжил"} хадгалснаас хасав`);
        }
      }}
      aria-label="Хадгалснаас хасах"
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink/40 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
    >
      <X className="h-3.5 w-3.5" />
    </button>
  );
}
