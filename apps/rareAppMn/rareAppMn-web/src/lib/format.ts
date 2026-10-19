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

interface ExamWeights {
  primaryWeight: number | null;
  secondaryWeight: number | null;
}

/** Null weights mean the usual 0.7 суурь / 0.3 дагалдах. */
function examWeights(major: ExamWeights): [number, number] {
  return [major.primaryWeight ?? 0.7, major.secondaryWeight ?? 0.3];
}

/**
 * True when both exams weigh the same (АШУҮИС adds them), so neither is the main
 * one: they read "1-р шалгалт" / "2-р шалгалт" instead of "Суурь" / "Дагалдах".
 */
export function examsWeighEqually(major: ExamWeights): boolean {
  const [primary, secondary] = examWeights(major);
  return primary === secondary;
}

/**
 * A major's cut-off: "490", or "Суурь ≥ 490, дагалдах ≥ 450" when each exam has
 * its own minimum ("1-р шалгалт ≥ 490, 2-р шалгалт ≥ 490" when the exams weigh
 * the same). A second minimum of 0 means it isn't known yet.
 */
export function formatCutOff(
  major: {
    cutOffScore: number | null;
    secondaryCutOffScore: number | null;
  } & ExamWeights,
): string | null {
  if (major.secondaryCutOffScore != null) {
    const [first, second] = examsWeighEqually(major)
      ? ["1-р шалгалт", "2-р шалгалт"]
      : ["Суурь", "дагалдах"];
    const primary = `${first} ≥ ${major.cutOffScore ?? "—"}`;
    return major.secondaryCutOffScore > 0
      ? `${primary}, ${second} ≥ ${major.secondaryCutOffScore}`
      : `${primary} (${second}: тодорхойгүй)`;
  }
  return major.cutOffScore != null ? String(major.cutOffScore) : null;
}

/** How the two exams make the score: "Оноо = 0.7 × суурь + 0.3 × дагалдах." or a plain sum. */
export function formatExamFormula(major: ExamWeights): string {
  const [primary, secondary] = examWeights(major);
  if (primary === 1 && secondary === 1) {
    return "1-р шалгалтын жагсаалтаас нэг, 2-р шалгалтынхаас нэг шалгалт өгнө. Нийлбэр оноо = 1-р шалгалт + 2-р шалгалт.";
  }
  return `Суурь жагсаалтаас нэг, дагалдахаас нэг шалгалт өгнө. Оноо = ${primary} × суурь + ${secondary} × дагалдах.`;
}

/** "Жагсаалтаар сонгох (8 хүртэл)" / "Шууд сонгох (1)", or null when the university doesn't say. */
export function formatSelectionType(selectionType: string | null): string | null {
  if (selectionType === "list") return "Жагсаалтаар сонгох (8 хүртэл)";
  if (selectionType === "direct") return "Шууд сонгох (1)";
  return null;
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
export function examSubjectLines(
  major: {
    requiredSubjects: string[] | null;
    primarySubjects: string[] | null;
    secondarySubjects: string[] | null;
  } & ExamWeights,
): { label: string; text: string }[] {
  const primary = major.primarySubjects ?? [];
  const secondary = major.secondarySubjects ?? [];
  if (primary.length > 0) {
    const overlaps = secondary.some((subject) => primary.includes(subject));
    const [primaryWeight, secondaryWeight] = examWeights(major);
    const share = (weight: number) => Math.round((weight / (primaryWeight + secondaryWeight)) * 100);
    const equal = examsWeighEqually(major);
    return [
      {
        label: equal ? "1-р шалгалт" : `Суурь (${share(primaryWeight)}%)`,
        text: formatSubjectChoices(primary),
      },
      ...(secondary.length > 0
        ? [
            {
              label: equal ? "2-р шалгалт" : `Дагалдах (${share(secondaryWeight)}%)`,
              text: `${formatSubjectChoices(secondary)}${
                overlaps ? (equal ? " (1-р шалгалтад сонгосноос өөр)" : " (суурьт сонгосноос өөр)") : ""
              }`,
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

/**
 * A stored date in Mongolian order: "2026-11-23" → "2026.11.23", month-day "08-20" → "08.20".
 * Read straight from the string, because Cloudflare's runtime has no Mongolian locale
 * and `new Date("2026-11-23")` is UTC midnight, the day before in American time zones.
 * A timestamp shows its day in Ulaanbaatar; any other text (e.g. "2025 оны жишиг: …") shows as is.
 */
export function formatDateMn(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  const date = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (date) return `${date[1]}.${date[2]}.${date[3]}`;
  const monthDay = /^(\d{2})-(\d{2})$/.exec(trimmed);
  if (monthDay) return `${monthDay[1]}.${monthDay[2]}`;
  if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
    const instant = new Date(trimmed);
    if (!Number.isNaN(instant.getTime())) return formatDateMn(dayInMongolia(instant));
  }
  return trimmed;
}

/** "2026.10.01 – 2026.11.23"; only an end → "2026.11.27 хүртэл"; only a start → that date. */
export function formatDateRange(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
): string {
  const start = formatDateMn(startDate);
  const end = formatDateMn(endDate);
  if (start && end) return start === end ? start : `${start} – ${end}`;
  if (end) return `${end} хүртэл`;
  return start ?? "Хугацаа тодорхойгүй";
}

/** The aimag of a branch school's location ("Орхон аймаг, Баян-Өндөр сум" → "Орхон аймаг"); null in Ulaanbaatar. */
export function formatAimag(location: string | null | undefined): string | null {
  // Matches the API's region rule: no location, or one naming Улаанбаатар, is Ulaanbaatar.
  if (!location || /улаанбаатар|ulaanbaatar/i.test(location)) return null;
  const parts = location.split(",").map((part) => part.trim());
  return parts.find((part) => /аймаг/i.test(part)) ?? parts[0] ?? null;
}

/**
 * Where a program is taught, for lists that mix schools: "Менежментийн сургууль", or for a
 * branch "Дархан-Уул аймаг дахь Технологийн сургууль · Дархан-Уул аймаг". Pass the university's
 * short name when the list mixes universities: "ШУТИС · Менежментийн сургууль".
 */
export function formatMajorPlace(
  faculty: { name: string; location: string | null } | null | undefined,
  universityShortName?: string | null,
): string | null {
  const parts = [universityShortName, faculty?.name, formatAimag(faculty?.location)];
  return parts.filter(Boolean).join(" · ") || null;
}

/** Degree types an admin can pick for a program; anything else is a custom program. */
export const DEGREE_TYPES = ["BACHELOR", "ASSOCIATE", "MASTER", "DOCTORATE", "DIPLOMA"];

const DEGREE_TYPE_LABELS: Record<string, string> = {
  BACHELOR: "Бакалавр",
  ASSOCIATE: "Дэд бакалавр",
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

/** Today in Ulaanbaatar as "YYYY-MM-DD", comparable with stored dates. */
export function todayInMongolia(): string {
  return dayInMongolia(new Date());
}

/**
 * An instant's calendar day in Ulaanbaatar as "YYYY-MM-DD". Built from the formatter's parts,
 * not its output string, so a runtime without the requested locale can't change the order.
 */
function dayInMongolia(instant: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ulaanbaatar",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
