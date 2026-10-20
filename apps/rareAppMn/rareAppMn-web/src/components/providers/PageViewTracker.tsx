"use client";

import { useAuth } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useMutation } from "urql";
import {
  TRACK_PAGE_VIEW_MUTATION,
  type TrackPageViewResult,
  type TrackPageViewVariables,
} from "@/lib/graphql/documents";

const VISITOR_ID_KEY = "oyutan-visitor-id";
let fallbackVisitorId: string | null = null;

/** A random id per browser (no personal data), so visits can count distinct visitors. */
function getVisitorId(): string {
  try {
    const stored = localStorage.getItem(VISITOR_ID_KEY);
    if (stored) return stored;
    const created = crypto.randomUUID();
    localStorage.setItem(VISITOR_ID_KEY, created);
    return created;
  } catch {
    // Storage blocked (private mode): one id for this page load.
    fallbackVisitorId ??= crypto.randomUUID();
    return fallbackVisitorId;
  }
}

/**
 * Invisible: records one page view per page a visitor opens, for the admin
 * panel's "Хандалт" stats. Waits for Clerk so signed-in views are marked as
 * such; skips the admin panel itself. Failures are silent.
 */
export function PageViewTracker() {
  const pathname = usePathname();
  const { isLoaded } = useAuth();
  const [, trackPageView] = useMutation<TrackPageViewResult, TrackPageViewVariables>(
    TRACK_PAGE_VIEW_MUTATION,
  );
  const lastTracked = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !pathname || lastTracked.current === pathname) return;
    lastTracked.current = pathname;
    if (pathname === "/admin" || pathname.startsWith("/admin/")) return;
    void trackPageView({ path: pathname, visitorId: getVisitorId() });
  }, [isLoaded, pathname, trackPageView]);

  return null;
}
