import type { ScoreMatchVerdict } from "@/lib/graphql/types";
import type { FormatT } from "@/i18n/types";

/**
 * Functions that return text take `t`, a translator for the "format"
 * namespace of messages/*.json (useTranslations("format") in a component,
 * await getTranslations("format") in an async one).
 */

/** A plain MNT amount in millions, to one decimal: 4_520_000 → "4.5". */
export function formatMillions(amount: number): string {
  const rounded = Math.round((amount / 1_000_000) * 10) / 10;
  return rounded.toLocaleString("mn-MN");
}

/** A ?score= from the URL: a whole number in the ЭЕШ range (200–800), else null. */
export function parseExamScore(value: string | undefined): number | null {
  if (!value) return null;
  const score = Number(value);
  return Number.isInteger(score) && score >= 200 && score <= 800 ? score : null;
}

/** Formats a tuition fee (plain MNT amount) as e.g. "4.5 сая ₮" / "₮4.5M". */
export function formatTuition(t: FormatT, fee: number | null | undefined): string {
  if (fee == null) return t("comingSoon");
  return t("millions", { amount: formatMillions(fee) });
}

/** A university's yearly tuition: its own text (e.g. a range) when set, else the formatted fee. */
export function formatSchoolTuition(
  t: FormatT,
  school: {
    tuitionFee: number | null;
    tuitionText: string | null;
  },
): string {
  return school.tuitionText ?? formatTuition(t, school.tuitionFee);
}

/** University or college, read from the official (Mongolian) name's ending. */
export function formatSchoolType(t: FormatT, name: string): string | null {
  if (/дээд сургууль$/i.test(name.trim())) return t("college");
  if (/их сургууль$/i.test(name.trim())) return t("university");
  return null;
}

/** A university's yes/no fact, which is null until someone has checked it. */
export function formatAvailability(t: FormatT, available: boolean | null): string {
  if (available == null) return t("comingSoon");
  return available ? t("available") : t("unavailable");
}

/** A fee in its own currency: "630,000 ₮", or "500 USD". Null currency means MNT. */
export function formatFee(t: FormatT, amount: number, currency: string | null): string {
  if (!currency || currency === "MNT") return formatAmount(t, amount);
  return `${Math.round(amount).toLocaleString("mn-MN")} ${currency}`;
}

/** A major's yearly tuition; an estimated upper bound reads "≈ 8.5 сая ₮ хүртэл". */
export function formatMajorTuition(
  t: FormatT,
  major: {
    tuitionFee: number | null;
    tuitionIsEstimate: boolean;
  },
): string {
  const fee = formatTuition(t, major.tuitionFee);
  return major.tuitionFee != null && major.tuitionIsEstimate ? t("upTo", { fee }) : fee;
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
  t: FormatT,
  major: {
    cutOffScore: number | null;
    secondaryCutOffScore: number | null;
  } & ExamWeights,
): string | null {
  if (major.secondaryCutOffScore != null) {
    const equal = examsWeighEqually(major);
    const primary = major.cutOffScore ?? "—";
    if (major.secondaryCutOffScore > 0) {
      const values = { primary, secondary: major.secondaryCutOffScore };
      return equal ? t("cutOffEqual", values) : t("cutOffSplit", values);
    }
    return equal ? t("cutOffEqualUnknown", { primary }) : t("cutOffSplitUnknown", { primary });
  }
  return major.cutOffScore != null ? String(major.cutOffScore) : null;
}

/** How the two exams make the score: "Оноо = 0.7 × суурь + 0.3 × дагалдах." or a plain sum. */
export function formatExamFormula(t: FormatT, major: ExamWeights): string {
  const [primary, secondary] = examWeights(major);
  if (primary === 1 && secondary === 1) return t("formulaSum");
  return t("formulaWeighted", { primary, secondary });
}

/** "Жагсаалтаар сонгох (8 хүртэл)" / "Шууд сонгох (1)", or null when the university doesn't say. */
export function formatSelectionType(t: FormatT, selectionType: string | null): string | null {
  if (selectionType === "list") return t("selectionList");
  if (selectionType === "direct") return t("selectionDirect");
  return null;
}

/** "Математик эсвэл Физик", "Газарзүй, Нийгэм судлал эсвэл Физик". */
function formatSubjectChoices(t: FormatT, subjects: string[]): string {
  if (subjects.length <= 1) return subjects.join("");
  return t("subjectChoices", { rest: subjects.slice(0, -1).join(", "), last: subjects[subjects.length - 1] });
}

/**
 * A major's admission exams as labelled lines. With a суурь/дагалдах split the
 * student takes one exam from each line; otherwise every listed subject counts.
 */
export function examSubjectLines(
  t: FormatT,
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
        label: equal ? t("examFirst") : t("examPrimary", { share: share(primaryWeight) }),
        text: formatSubjectChoices(t, primary),
      },
      ...(secondary.length > 0
        ? [
            {
              label: equal ? t("examSecond") : t("examSecondary", { share: share(secondaryWeight) }),
              text: `${formatSubjectChoices(t, secondary)}${
                overlaps ? (equal ? t("differentFromFirst") : t("differentFromPrimary")) : ""
              }`,
            },
          ]
        : []),
    ];
  }
  const required = major.requiredSubjects ?? [];
  return required.length > 0 ? [{ label: t("exams"), text: required.join(", ") }] : [];
}

export function formatVerdict(t: FormatT, verdict: ScoreMatchVerdict): string {
  return t(`verdict.${verdict}`);
}

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
  t: FormatT,
  startDate: string | null | undefined,
  endDate: string | null | undefined,
): string {
  const start = formatDateMn(startDate);
  const end = formatDateMn(endDate);
  if (start && end) return start === end ? start : `${start} – ${end}`;
  if (end) return t("dateUntil", { date: end });
  return start ?? t("dateUnknown");
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

const DEGREE_KEYS = ["BACHELOR", "ASSOCIATE", "MASTER", "DOCTORATE", "DIPLOMA"] as const;

/** A known degree's name in the current language; any other value as stored. */
export function formatDegreeType(t: FormatT, value: string | null | undefined): string | null {
  if (!value) return null;
  const upper = value.toUpperCase();
  const key = upper === "PHD" ? "DOCTORATE" : upper;
  return (DEGREE_KEYS as readonly string[]).includes(key)
    ? t(`degree.${key as (typeof DEGREE_KEYS)[number]}`)
    : value;
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
export function formatDegreeKey(t: FormatT, key: string): string {
  return key === OTHER_DEGREE ? t("degree.OTHER") : (formatDegreeType(t, key) ?? key);
}

export function formatAmount(t: FormatT, amount: number | null | undefined): string {
  if (amount == null) return t("noData");
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
