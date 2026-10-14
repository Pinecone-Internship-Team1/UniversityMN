"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { useMutation } from "urql";
import {
  SYNC_CLERK_USER_MUTATION,
  type SyncClerkUserResult,
  type SyncClerkUserVariables,
} from "@/lib/graphql/documents";
import { getErrorMessage } from "@/lib/graphql/errors";

export type ClerkUserSyncStatus = "idle" | "syncing" | "synced" | "error";

interface ClerkUserSyncValue {
  status: ClerkUserSyncStatus;
  errorMessage: string | null;
  retry: () => void;
}

interface SyncState {
  userId: string | null;
  status: ClerkUserSyncStatus;
  errorMessage: string | null;
}

const IDLE_STATE: SyncState = { userId: null, status: "idle", errorMessage: null };

const ClerkUserSyncContext = createContext<ClerkUserSyncValue>({
  status: "idle",
  errorMessage: null,
  retry: () => undefined,
});

export function useClerkUserSync(): ClerkUserSyncValue {
  return useContext(ClerkUserSyncContext);
}

/**
 * Invisible: mirrors the signed-in Clerk user into the backend's `users`
 * table via `syncClerkUser` so `me`, bookmarks, and profile edits have a
 * row to attach to. Runs once per Clerk user id per session.
 */
export function ClerkUserSyncProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const [, syncClerkUser] = useMutation<
    SyncClerkUserResult,
    SyncClerkUserVariables
  >(SYNC_CLERK_USER_MUTATION);
  const [state, setState] = useState<SyncState>(IDLE_STATE);
  const attemptedUserId = useRef<string | null>(null);

  const sync = useCallback(async () => {
    if (!isSignedIn || !userId || !user) return;

    const email =
      user.primaryEmailAddress?.emailAddress ??
      user.emailAddresses[0]?.emailAddress;
    if (!email) {
      setState({
        userId,
        status: "error",
        errorMessage:
          "Таны бүртгэлд имэйл хаяг байхгүй байна. Clerk профайлдаа имэйл хаяг нэмнэ үү.",
      });
      return;
    }

    setState({ userId, status: "syncing", errorMessage: null });
    const result = await syncClerkUser({
      clerkUserId: userId,
      email,
      name: user.fullName ?? undefined,
      avatarUrl: user.imageUrl ?? undefined,
    });

    if (result.error) {
      const errorMessage = getErrorMessage(result.error, {
        CONFLICT: "Энэ имэйл хаяг өөр бүртгэлтэй холбогдсон байна.",
      });
      setState({ userId, status: "error", errorMessage });
      toast.error("Профайлыг холбоход алдаа гарлаа", { description: errorMessage });
      return;
    }

    setState({ userId, status: "synced", errorMessage: null });
  }, [isSignedIn, userId, user, syncClerkUser]);

  useEffect(() => {
    if (!isSignedIn || !userId || !user) return;
    if (attemptedUserId.current === userId) return;
    attemptedUserId.current = userId;
    void sync();
  }, [isSignedIn, userId, user, sync]);

  const current = isSignedIn && state.userId === userId ? state : IDLE_STATE;
  const value = useMemo<ClerkUserSyncValue>(
    () => ({
      status: current.status,
      errorMessage: current.errorMessage,
      retry: () => void sync(),
    }),
    [current.status, current.errorMessage, sync],
  );

  return (
    <ClerkUserSyncContext.Provider value={value}>
      {children}
    </ClerkUserSyncContext.Provider>
  );
}
