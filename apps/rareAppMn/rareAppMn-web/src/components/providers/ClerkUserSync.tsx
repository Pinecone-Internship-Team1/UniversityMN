"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import { useMutation } from "urql";
import {
  SYNC_CLERK_USER_MUTATION,
  type SyncClerkUserResult,
  type SyncClerkUserVariables,
} from "@/lib/graphql/documents";

/**
 * Invisible: mirrors the signed-in Clerk user into the backend's `users`
 * table via `syncClerkUser` so `me`, bookmarks, and profile edits have a
 * row to attach to. Runs once per Clerk user id per session.
 */
export function ClerkUserSync() {
  const { isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const [, syncClerkUser] = useMutation<
    SyncClerkUserResult,
    SyncClerkUserVariables
  >(SYNC_CLERK_USER_MUTATION);
  const syncedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!isSignedIn || !userId || !user) return;
    if (syncedUserId.current === userId) return;

    const email =
      user.primaryEmailAddress?.emailAddress ??
      user.emailAddresses[0]?.emailAddress;
    if (!email) return;

    syncedUserId.current = userId;
    void syncClerkUser({
      clerkUserId: userId,
      email,
      name: user.fullName ?? undefined,
      avatarUrl: user.imageUrl ?? undefined,
    });
  }, [isSignedIn, userId, user, syncClerkUser]);

  return null;
}
