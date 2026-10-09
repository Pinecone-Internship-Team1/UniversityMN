import type { ScoreMatchVerdict } from "@/lib/graphql/types";

/** Formats a tuition fee (plain MNT amount) as e.g. "4.5 сая ₮". */
export function formatTuition(fee: number | null | undefined): string {
  if (fee == null) return "Мэдээлэл удахгүй нэмэгдэнэ";
  const millions = fee / 1_000_000;
  const rounded = Math.round(millions * 10) / 10;
  return `${rounded.toLocaleString("mn-MN")} сая ₮`;
}

/** A university's yearly tuition: its own text (e.g. a range) when set, else the formatted fee. */
export function formatSchoolTuition(school: {
  tuitionFee: number | null;
  tuitionText: string | null;
}): string {
  return school.tuitionText ?? formatTuition(school.tuitionFee);
}

/** "Их сургууль" or "Дээд сургууль" (college), read from the official name's ending. */
export function formatSchoolType(name: string): string | null {
  if (/дээд сургууль$/i.test(name.trim())) return "Дээд сургууль";
  if (/их сургууль$/i.test(name.trim())) return "Их сургууль";
  return null;
}

/** A university's yes/no fact, which is null until someone has checked it. */
export function formatAvailability(available: boolean | null): string {
  if (available == null) return "Мэдээлэл удахгүй нэмэгдэнэ";
  return available ? "Боломжтой" : "Боломжгүй";
}

/** A fee in its own currency: "630,000 ₮", or "500 USD". Null currency means MNT. */
export function formatFee(amount: number, currency: string | null): string {
  if (!currency || currency === "MNT") return formatAmount(amount);
  return `${Math.round(amount).toLocaleString("mn-MN")} ${currency}`;
}

/** A major's yearly tuition; an estimated upper bound reads "≈ 8.5 сая ₮ хүртэл". */
export function formatMajorTuition(major: {
  tuitionFee: number | null;
  tuitionIsEstimate: boolean;
}): string {
  const fee = formatTuition(major.tuitionFee);
  return major.tuitionFee != null && major.tuitionIsEstimate ? `≈ ${fee} хүртэл` : fee;
}

/** Shown next to cut-off scores: the threshold only lets a student compete for a place. */
export const CUT_OFF_NOTE =
  "Босго оноо нь элсэлтэд өрсөлдөх хамгийн бага оноо. Эрэлттэй хөтөлбөрт элсэхэд үүнээс өндөр оноо хэрэгтэй байж болно.";

/** "Математик эсвэл Физик", "Газарзүй, Нийгэм судлал эсвэл Физик". */
function formatSubjectChoices(subjects: string[]): string {
  if (subjects.length <= 1) return subjects.join("");
  return `${subjects.slice(0, -1).join(", ")} эсвэл ${subjects[subjects.length - 1]}`;
}

/**
 * A major's admission exams as labelled lines. With a суурь/дагалдах split the
 * student takes one exam from each line; otherwise every listed subject counts.
 */
export function examSubjectLines(major: {
  requiredSubjects: string[] | null;
  primarySubjects: string[] | null;
  secondarySubjects: string[] | null;
}): { label: string; text: string }[] {
  const primary = major.primarySubjects ?? [];
  const secondary = major.secondarySubjects ?? [];
  if (primary.length > 0) {
    const overlaps = secondary.some((subject) => primary.includes(subject));
    return [
      { label: "Суурь (70%)", text: formatSubjectChoices(primary) },
      ...(secondary.length > 0
        ? [
            {
              label: "Дагалдах (30%)",
              text: `${formatSubjectChoices(secondary)}${overlaps ? " (суурьт сонгосноос өөр)" : ""}`,
            },
          ]
        : []),
    ];
  }
  const required = major.requiredSubjects ?? [];
  return required.length > 0 ? [{ label: "Шалгалт", text: required.join(", ") }] : [];
}

export const VERDICT_LABELS: Record<ScoreMatchVerdict, string> = {
  ELIGIBLE: "Босго хангаж байна",
  BELOW_CUT_OFF: "Босго хангахгүй",
  MISSING_SCORES: "Оноо дутуу",
  CHECK_WITH_SCHOOL: "Сургуулиас тодруулна уу",
};

/** Only these verdicts come from an actual score, so only they get a match percentage. */
export function isScoredVerdict(verdict: ScoreMatchVerdict): boolean {
  return verdict === "ELIGIBLE" || verdict === "BELOW_CUT_OFF";
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
