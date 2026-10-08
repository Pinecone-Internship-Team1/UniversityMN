export type CompareMode = "schools" | "majors";

export const MAX_COMPARE_ITEMS = 4;

export function compareHref(mode: CompareMode, ids: string[]): string {
  const params = new URLSearchParams({ type: mode });
  if (ids.length > 0) params.set("ids", ids.join(","));
  return `/compare?${params.toString()}`;
}
