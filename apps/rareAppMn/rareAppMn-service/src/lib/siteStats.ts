/** Helpers for the page-view stats (page_views table, siteStats / trackPageView). */

const ULAANBAATAR_OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export const DEFAULT_STATS_DAYS = 30;
export const MAX_STATS_DAYS = 365;
const MAX_PATH_LENGTH = 200;
const VISITOR_ID_PATTERN = /^[A-Za-z0-9-]{8,64}$/;

/** The Ulaanbaatar (UTC+8, no DST) calendar date of an instant, as YYYY-MM-DD. */
export function ulaanbaatarDay(instant: Date): string {
  return new Date(instant.getTime() + ULAANBAATAR_OFFSET_MS).toISOString().slice(0, 10);
}

/** `days` consecutive YYYY-MM-DD dates ending with `lastDay`, oldest first. */
export function dayRange(days: number, lastDay: string): string[] {
  const last = Date.parse(`${lastDay}T00:00:00Z`);
  return Array.from({ length: days }, (_, i) =>
    new Date(last - (days - 1 - i) * DAY_MS).toISOString().slice(0, 10)
  );
}

export function clampStatsDays(days: number | null | undefined): number {
  if (typeof days !== 'number' || !Number.isFinite(days)) return DEFAULT_STATS_DAYS;
  return Math.min(Math.max(Math.trunc(days), 1), MAX_STATS_DAYS);
}

/**
 * The pathname to record, or null when it isn't one: query string and hash
 * are dropped (they can carry search terms), trailing slashes trimmed.
 */
export function trackedPath(raw: string): string | null {
  const path = raw.split(/[?#]/, 1)[0]?.trim() ?? '';
  if (!path.startsWith('/') || path.startsWith('//') || path.length > MAX_PATH_LENGTH) return null;
  // eslint-disable-next-line no-control-regex -- rejecting control characters is the point
  if (/[\u0000-\u001f\u007f\s]/.test(path)) return null;
  return path.length > 1 ? path.replace(/\/+$/, '') : path;
}

export function isVisitorId(value: string): boolean {
  return VISITOR_ID_PATTERN.test(value);
}
