"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useState, type MouseEvent } from "react";
import { toast } from "sonner";
import { useMutation } from "urql";
import {
  TOGGLE_SAVE_SCHOOL_MUTATION,
  type ToggleSaveSchoolResult,
  type ToggleSaveSchoolVariables,
} from "@/lib/graphql/documents";
import { cn } from "@/lib/utils";

export interface SchoolBookmarkButtonProps {
  schoolId: string;
  initialSaved: boolean;
  /** Used only for toast copy, e.g. "МУИС-г хадгаллаа". */
  schoolName?: string;
  className?: string;
  size?: "sm" | "md";
  /** Called after a successful toggle with the new saved state (e.g. to remove a card from a "saved schools" list once unsaved). */
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

export function SchoolBookmarkButton({
  schoolId,
  initialSaved,
  schoolName,
  className,
  size = "md",
  onToggled,
}: SchoolBookmarkButtonProps) {
  const { isSignedIn } = useAuth();
  const [saved, setSaved] = useState(initialSaved);
  const [{ fetching }, toggleSaveSchool] = useMutation<
    ToggleSaveSchoolResult,
    ToggleSaveSchoolVariables
  >(TOGGLE_SAVE_SCHOOL_MUTATION);

  async function handleClick(event: MouseEvent<HTMLButtonElement>) {
    stopEventPropagation(event);
    if (fetching) return;

    const optimisticValue = !saved;
    setSaved(optimisticValue);

    const result = await toggleSaveSchool({ schoolId });
    if (result.error) {
      setSaved(!optimisticValue);
      toast.error("Хадгалахад алдаа гарлаа", {
        description: result.error.message,
      });
      return;
    }
    if (typeof result.data?.toggleSaveSchool === "boolean") {
      const nowSaved = result.data.toggleSaveSchool;
      setSaved(nowSaved);
      onToggled?.(nowSaved);
      const label = schoolName ?? "Сургууль";
      toast.success(
        nowSaved ? `${label} хадгаллаа` : `${label} хадгалснаас хасав`,
      );
    }
  }

  const button = (
    <button
      type="button"
      // When signed out, SignInButton below clones this element and layers
      // its own "open sign-in modal" handler on top of this one -- this
      // handler only needs to stop the click reaching a parent <Link>.
      onClick={isSignedIn ? handleClick : stopEventPropagation}
      aria-pressed={saved}
      aria-label={saved ? "Хадгалсан сургуулиас хасах" : "Сургуулийг хадгалах"}
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
