import type { ValidationT } from "@/i18n/types";

export const MAX_EXAM_SCORE = 800;
export const MAX_SCORE_SUBJECTS = 50;
export const MAX_SUBJECT_LENGTH = 100;
export const MAX_REQUIRED_SUBJECTS = 20;
export const MAX_SHORT_TEXT_LENGTH = 200;
export const MAX_LONG_TEXT_LENGTH = 10_000;
export const MAX_URL_LENGTH = 2048;
export const MAX_PHONES = 10;
const MAX_PHONE_LENGTH = 30;
const MAX_EMAIL_LENGTH = 254;
const PHONE_PATTERN = /^\+?[\d\s()-]+$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

const valid = <T>(value: T): ValidationResult<T> => ({ ok: true, value });
const invalid = <T>(error: string): ValidationResult<T> => ({ ok: false, error });

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Each parser takes `t` = useTranslations("validation"); `label` is the
 * field's name in the current language, already translated by the caller.
 */
export function parseRequiredText(
  t: ValidationT,
  raw: string,
  label: string,
  maxLength = MAX_SHORT_TEXT_LENGTH,
): ValidationResult<string> {
  const value = raw.trim();
  if (!value) return invalid(t("required", { label }));
  if (value.length > maxLength) {
    return invalid(t("tooLong", { label, max: maxLength }));
  }
  return valid(value);
}

export function parseOptionalText(
  t: ValidationT,
  raw: string,
  label: string,
  maxLength = MAX_SHORT_TEXT_LENGTH,
): ValidationResult<string | null> {
  const value = raw.trim();
  if (!value) return valid(null);
  if (value.length > maxLength) {
    return invalid(t("tooLong", { label, max: maxLength }));
  }
  return valid(value);
}

export function parseOptionalUrl(
  t: ValidationT,
  raw: string,
  label: string,
): ValidationResult<string | null> {
  const value = raw.trim();
  if (!value) return valid(null);
  if (value.length > MAX_URL_LENGTH || !isHttpUrl(value)) {
    return invalid(t("url", { label }));
  }
  return valid(value);
}

export function parseOptionalEmail(t: ValidationT, raw: string, label: string): ValidationResult<string | null> {
  const value = raw.trim();
  if (!value) return valid(null);
  if (value.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(value)) {
    return invalid(t("email", { label }));
  }
  return valid(value);
}

export const MAX_ALIASES = 20;

/** Comma-separated search names (МУИС, muis, NUM), trimmed and de-duplicated. */
export function parseAliasList(t: ValidationT, raw: string): ValidationResult<string[]> {
  const seen = new Set<string>();
  const aliases: string[] = [];
  for (const part of raw.split(",")) {
    const alias = part.trim();
    if (!alias || seen.has(alias.toLowerCase())) continue;
    seen.add(alias.toLowerCase());
    aliases.push(alias);
  }
  if (aliases.length > MAX_ALIASES) {
    return invalid(t("tooManyAliases", { max: MAX_ALIASES }));
  }
  const tooLong = aliases.find((alias) => alias.length > MAX_SHORT_TEXT_LENGTH);
  if (tooLong) {
    return invalid(t("aliasTooLong", { alias: tooLong.slice(0, 30), max: MAX_SHORT_TEXT_LENGTH }));
  }
  return valid(aliases);
}

/** Trimmed, de-duplicated phone numbers (6-15 digits each); blank rows are ignored. */
export function parsePhoneList(t: ValidationT, raw: string[]): ValidationResult<string[]> {
  const phones = [...new Set(raw.map((phone) => phone.trim()).filter(Boolean))];
  if (phones.length > MAX_PHONES) {
    return invalid(t("tooManyPhones", { max: MAX_PHONES }));
  }
  for (const phone of phones) {
    const digits = phone.replace(/\D/g, "").length;
    if (phone.length > MAX_PHONE_LENGTH || !PHONE_PATTERN.test(phone) || digits < 6 || digits > 15) {
      return invalid(t("badPhone", { phone }));
    }
  }
  return valid(phones);
}

export function parseOptionalNumber(
  t: ValidationT,
  raw: string,
  label: string,
  max?: number,
): ValidationResult<number | null> {
  const value = raw.trim();
  if (!value) return valid(null);
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    return invalid(t("notNegative", { label }));
  }
  if (max !== undefined && number > max) {
    return invalid(t("tooBig", { label, max }));
  }
  return valid(number);
}

export function parseSubjectList(t: ValidationT, raw: string, label: string): ValidationResult<string[]> {
  const subjects = [
    ...new Set(
      raw
        .split(",")
        .map((subject) => subject.trim())
        .filter(Boolean),
    ),
  ];
  if (subjects.length > MAX_REQUIRED_SUBJECTS) {
    return invalid(t("tooManySubjects", { label, max: MAX_REQUIRED_SUBJECTS }));
  }
  const tooLong = subjects.find((subject) => subject.length > MAX_SUBJECT_LENGTH);
  if (tooLong) {
    return invalid(t("subjectTooLong", { subject: tooLong }));
  }
  return valid(subjects);
}

export interface ScoreEntry {
  subject: string;
  score: string;
}

export function parseScoreEntries(
  t: ValidationT,
  entries: ScoreEntry[],
): ValidationResult<Record<string, number>> {
  const scores: [string, number][] = [];
  const seen = new Set<string>();

  for (const entry of entries) {
    const subject = entry.subject.trim();
    const rawScore = entry.score.trim();
    if (!subject && !rawScore) continue;
    if (!subject) return invalid(t("subjectNameMissing"));
    if (subject.length > MAX_SUBJECT_LENGTH) {
      return invalid(t("subjectTooLong", { subject }));
    }
    if (seen.has(subject)) return invalid(t("subjectDuplicate", { subject }));
    if (!rawScore) return invalid(t("scoreMissing", { subject }));

    const score = Number(rawScore);
    if (!Number.isFinite(score) || score < 0 || score > MAX_EXAM_SCORE) {
      return invalid(t("scoreRange", { subject, max: MAX_EXAM_SCORE }));
    }
    seen.add(subject);
    scores.push([subject, score]);
  }

  if (scores.length > MAX_SCORE_SUBJECTS) {
    return invalid(t("tooManyScores", { max: MAX_SCORE_SUBJECTS }));
  }
  return valid(Object.fromEntries(scores));
}
