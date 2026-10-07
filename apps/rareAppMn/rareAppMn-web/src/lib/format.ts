/** Formats a tuition fee (plain MNT amount) as e.g. "4.5 сая ₮". */
export function formatTuition(fee: number | null | undefined): string {
  if (fee == null) return "Мэдээлэл байхгүй";
  const millions = fee / 1_000_000;
  const rounded = Math.round(millions * 10) / 10;
  return `${rounded.toLocaleString("mn-MN")} сая ₮`;
}

/** Formats an ISO date string (e.g. admission schedule dates) as "2026.07.15". */
export function formatDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("mn-MN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/** Formats a date range for an admission schedule entry. */
export function formatDateRange(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
): string {
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  if (start && end) return `${start} — ${end}`;
  return start ?? end ?? "Хугацаа тодорхойгүй";
}
