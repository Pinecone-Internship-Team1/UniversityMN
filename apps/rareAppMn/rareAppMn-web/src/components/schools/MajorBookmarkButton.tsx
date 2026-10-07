"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useState, type MouseEvent } from "react";
import { toast } from "sonner";
import { useMutation } from "urql";
import {
  TOGGLE_SAVE_MAJOR_MUTATION,
  type ToggleSaveMajorResult,
  type ToggleSaveMajorVariables,
} from "@/lib/graphql/documents";
import { cn } from "@/lib/utils";

export interface MajorBookmarkButtonProps {
  majorId: string;
  initialSaved: boolean;
  /** Used only for toast copy. */
  majorName?: string;
  className?: string;
  size?: "sm" | "md";
  onToggled?: (saved: boolean) => void;
}

const DIMENSION_CLASSES: Record<"sm" | "md", string> = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
};

const ICON_SIZE_CLASSES: Record<"sm" | "md", string> = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
};

function stopEventPropagation(event: MouseEvent<HTMLButtonElement>) {
  event.preventDefault();
  event.stopPropagation();
}

export function MajorBookmarkButton({
  majorId,
  initialSaved,
  majorName,
  className,
  size = "md",
  onToggled,
}: MajorBookmarkButtonProps) {
  const { isSignedIn } = useAuth();
  const [saved, setSaved] = useState(initialSaved);
  const [{ fetching }, toggleSaveMajor] = useMutation<
    ToggleSaveMajorResult,
    ToggleSaveMajorVariables
  >(TOGGLE_SAVE_MAJOR_MUTATION);

  async function handleClick(event: MouseEvent<HTMLButtonElement>) {
    stopEventPropagation(event);
    if (fetching) return;

    const optimisticValue = !saved;
    setSaved(optimisticValue);

    const result = await toggleSaveMajor({ majorId });
    if (result.error) {
      setSaved(!optimisticValue);
      toast.error("Хадгалахад алдаа гарлаа", {
        description: result.error.message,
      });
      return;
    }
    if (typeof result.data?.toggleSaveMajor === "boolean") {
      const nowSaved = result.data.toggleSaveMajor;
      setSaved(nowSaved);
      onToggled?.(nowSaved);
      const label = majorName ?? "Мэргэжил";
      toast.success(
        nowSaved ? `${label} хадгаллаа` : `${label} хадгалснаас хасав`,
      );
    }
  }

  const button = (
    <button
      type="button"
      onClick={isSignedIn ? handleClick : stopEventPropagation}
      aria-pressed={saved}
      aria-label={saved ? "Хадгалсан мэргэжлээс хасах" : "Мэргэжлийг хадгалах"}
      disabled={fetching}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border transition-all duration-200 active:scale-90 disabled:cursor-not-allowed disabled:opacity-60",
        DIMENSION_CLASSES[size],
        saved
          ? "border-accent bg-accent text-paper"
          : "border-ink/15 bg-paper/80 text-ink/60 hover:border-ink hover:text-ink",
        className,
      )}
    >
      {saved ? (
        <BookmarkCheck className={ICON_SIZE_CLASSES[size]} />
      ) : (
        <Bookmark className={ICON_SIZE_CLASSES[size]} />
      )}
    </button>
  );

  if (!isSignedIn) {
    return <SignInButton mode="modal">{button}</SignInButton>;
  }

  return button;
}
