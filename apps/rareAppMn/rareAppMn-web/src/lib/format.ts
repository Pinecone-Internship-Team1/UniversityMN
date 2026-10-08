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

/** Degree types an admin can pick for a program; anything else is a custom program. */
export const DEGREE_TYPES = ["BACHELOR", "MASTER", "DOCTORATE", "DIPLOMA"];

const DEGREE_TYPE_LABELS: Record<string, string> = {
  BACHELOR: "Бакалавр",
  MASTER: "Магистр",
  DOCTORATE: "Доктор",
  PHD: "Доктор",
  DIPLOMA: "Диплом",
};

export function formatDegreeType(value: string | null | undefined): string | null {
  if (!value) return null;
  return DEGREE_TYPE_LABELS[value.toUpperCase()] ?? value;
}

/** Groups majors whose degree is missing or isn't one of `DEGREE_TYPES`. */
export const OTHER_DEGREE = "OTHER";

/** A major's degree as one of `DEGREE_TYPES` (PHD counts as DOCTORATE), else `OTHER_DEGREE`. */
export function degreeKey(degreeType: string | null | undefined): string {
  const degree = degreeType?.trim().toUpperCase();
  if (degree === "PHD") return "DOCTORATE";
  return degree && DEGREE_TYPES.includes(degree) ? degree : OTHER_DEGREE;
}

/** Display name for a `degreeKey` result, e.g. "Бакалавр" or "Бусад". */
export function formatDegreeKey(key: string): string {
  return key === OTHER_DEGREE ? "Бусад" : (formatDegreeType(key) ?? key);
}

export function formatAmount(amount: number | null | undefined): string {
  if (amount == null) return "Мэдээлэл байхгүй";
  return `${Math.round(amount).toLocaleString("mn-MN")} ₮`;
}

export function todayInMongolia(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ulaanbaatar" });
}
