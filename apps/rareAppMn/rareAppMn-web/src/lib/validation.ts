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

export function parseRequiredText(
  raw: string,
  label: string,
  maxLength = MAX_SHORT_TEXT_LENGTH,
): ValidationResult<string> {
  const value = raw.trim();
  if (!value) return invalid(`${label} оруулна уу.`);
  if (value.length > maxLength) {
    return invalid(`${label} ${maxLength} тэмдэгтээс хэтрэхгүй байх ёстой.`);
  }
  return valid(value);
}

export function parseOptionalText(
  raw: string,
  label: string,
  maxLength = MAX_SHORT_TEXT_LENGTH,
): ValidationResult<string | null> {
  const value = raw.trim();
  if (!value) return valid(null);
  if (value.length > maxLength) {
    return invalid(`${label} ${maxLength} тэмдэгтээс хэтрэхгүй байх ёстой.`);
  }
  return valid(value);
}

export function parseOptionalUrl(
  raw: string,
  label: string,
): ValidationResult<string | null> {
  const value = raw.trim();
  if (!value) return valid(null);
  if (value.length > MAX_URL_LENGTH || !isHttpUrl(value)) {
    return invalid(`${label} нь http:// эсвэл https://-ээр эхэлсэн зөв холбоос байх ёстой.`);
  }
  return valid(value);
}

export function parseOptionalEmail(raw: string, label: string): ValidationResult<string | null> {
  const value = raw.trim();
  if (!value) return valid(null);
  if (value.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(value)) {
    return invalid(`${label} зөв и-мэйл хаяг байх ёстой.`);
  }
  return valid(value);
}

/** Trimmed, de-duplicated phone numbers (6-15 digits each); blank rows are ignored. */
export function parsePhoneList(raw: string[]): ValidationResult<string[]> {
  const phones = [...new Set(raw.map((phone) => phone.trim()).filter(Boolean))];
  if (phones.length > MAX_PHONES) {
    return invalid(`Хамгийн ихдээ ${MAX_PHONES} утасны дугаар оруулах боломжтой.`);
  }
  for (const phone of phones) {
    const digits = phone.replace(/\D/g, "").length;
    if (phone.length > MAX_PHONE_LENGTH || !PHONE_PATTERN.test(phone) || digits < 6 || digits > 15) {
      return invalid(`"${phone}" утасны дугаар буруу байна.`);
    }
  }
  return valid(phones);
}

export function parseOptionalNumber(
  raw: string,
  label: string,
  max?: number,
): ValidationResult<number | null> {
  const value = raw.trim();
  if (!value) return valid(null);
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    return invalid(`${label} 0-ээс их буюу тэнцүү тоо байх ёстой.`);
  }
  if (max !== undefined && number > max) {
    return invalid(`${label} ${max}-аас хэтрэхгүй байх ёстой.`);
  }
  return valid(number);
}

export function parseSubjectList(raw: string, label: string): ValidationResult<string[]> {
  const subjects = [
    ...new Set(
      raw
        .split(",")
        .map((subject) => subject.trim())
        .filter(Boolean),
    ),
  ];
  if (subjects.length > MAX_REQUIRED_SUBJECTS) {
    return invalid(`${label} ${MAX_REQUIRED_SUBJECTS}-оос олон байж болохгүй.`);
  }
  const tooLong = subjects.find((subject) => subject.length > MAX_SUBJECT_LENGTH);
  if (tooLong) {
    return invalid(`"${tooLong}" хичээлийн нэр хэт урт байна.`);
  }
  return valid(subjects);
}

export interface ScoreEntry {
  subject: string;
  score: string;
}

export function parseScoreEntries(
  entries: ScoreEntry[],
): ValidationResult<Record<string, number>> {
  const scores: [string, number][] = [];
  const seen = new Set<string>();

  for (const entry of entries) {
    const subject = entry.subject.trim();
    const rawScore = entry.score.trim();
    if (!subject && !rawScore) continue;
    if (!subject) return invalid("Оноо оруулсан мөр бүрт хичээлийн нэрийг бичнэ үү.");
    if (subject.length > MAX_SUBJECT_LENGTH) {
      return invalid(`"${subject}" хичээлийн нэр хэт урт байна.`);
    }
    if (seen.has(subject)) return invalid(`"${subject}" хичээл давхардсан байна.`);
    if (!rawScore) return invalid(`"${subject}" хичээлийн оноог оруулна уу.`);

    const score = Number(rawScore);
    if (!Number.isFinite(score) || score < 0 || score > MAX_EXAM_SCORE) {
      return invalid(`"${subject}" хичээлийн оноо 0-${MAX_EXAM_SCORE} хооронд байх ёстой.`);
    }
    seen.add(subject);
    scores.push([subject, score]);
  }

  if (scores.length > MAX_SCORE_SUBJECTS) {
    return invalid(`Хамгийн ихдээ ${MAX_SCORE_SUBJECTS} хичээлийн оноо оруулах боломжтой.`);
  }
  return valid(Object.fromEntries(scores));
}
