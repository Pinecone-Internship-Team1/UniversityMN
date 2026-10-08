import { GraphQLError } from 'graphql';

/**
 * Typed `GraphQLError` helpers used by every resolver so clients get a
 * consistent `extensions.code` (and matching HTTP status) to branch on,
 * instead of ad-hoc error shapes scattered across the schema.
 */

export function unauthenticated(
  message = 'You must be signed in to perform this action.'
): GraphQLError {
  return new GraphQLError(message, {
    extensions: { code: 'UNAUTHENTICATED', http: { status: 401 } },
  });
}

export function forbidden(
  message = 'You do not have permission to perform this action.'
): GraphQLError {
  return new GraphQLError(message, {
    extensions: { code: 'FORBIDDEN', http: { status: 403 } },
  });
}

export function badInput(
  message = 'The provided input is invalid.',
  details?: Record<string, unknown>
): GraphQLError {
  return new GraphQLError(message, {
    extensions: {
      code: 'BAD_USER_INPUT',
      http: { status: 400 },
      ...(details ? { details } : {}),
    },
  });
}

export function notFound(entity = 'Resource', message?: string): GraphQLError {
  return new GraphQLError(message ?? `${entity} not found.`, {
    extensions: { code: 'NOT_FOUND', http: { status: 404 } },
  });
}

export function conflict(message = 'The resource conflicts with existing data.'): GraphQLError {
  return new GraphQLError(message, {
    extensions: { code: 'CONFLICT', http: { status: 409 } },
  });
}

export const MAX_SHORT_TEXT_LENGTH = 200;
export const MAX_LONG_TEXT_LENGTH = 10_000;
export const MAX_SCORE_SUBJECTS = 50;
export const MAX_REQUIRED_SUBJECTS = 20;
export const MAX_PHONES = 10;

const MAX_URL_LENGTH = 2048;
const MAX_EMAIL_LENGTH = 254;
const MAX_SUBJECT_LENGTH = 100;
const MAX_SCORE_VALUE = 1000;
const MAX_PREFERENCES_BYTES = 10_000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PHONE_LENGTH = 30;
const PHONE_PATTERN = /^\+?[\d\s()-]+$/;
const HTTP_PROTOCOLS = new Set(['http:', 'https:']);

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function requiredText(value: string, field: string, maxLength = MAX_SHORT_TEXT_LENGTH): string {
  const text = value.trim();
  if (!text) throw badInput(`${field} is required.`);
  if (text.length > maxLength) throw badInput(`${field} must be at most ${maxLength} characters.`);
  return text;
}

export function optionalText(
  value: string | null | undefined,
  field: string,
  maxLength = MAX_SHORT_TEXT_LENGTH
): string | null {
  if (value === null || value === undefined) return null;
  const text = value.trim();
  if (!text) return null;
  if (text.length > maxLength) throw badInput(`${field} must be at most ${maxLength} characters.`);
  return text;
}

export function optionalUrl(value: string | null | undefined, field: string): string | null {
  const text = optionalText(value, field, MAX_URL_LENGTH);
  if (text === null) return null;
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    throw badInput(`${field} must be a valid http(s) URL.`);
  }
  if (!HTTP_PROTOCOLS.has(url.protocol)) throw badInput(`${field} must be a valid http(s) URL.`);
  return text;
}

export function optionalEmail(value: string | null | undefined, field: string): string | null {
  const email = optionalText(value, field, MAX_EMAIL_LENGTH);
  if (email === null) return null;
  if (!EMAIL_PATTERN.test(email)) throw badInput(`${field} must be a valid email address.`);
  return email;
}

/** Trimmed, de-duplicated phone numbers (6-15 digits each), or null when there are none. */
export function parsePhoneList(value: string[] | null | undefined, field: string): string[] | null {
  if (value === null || value === undefined) return null;
  const phones = [...new Set(value.map((phone) => phone.trim()).filter(Boolean))];
  if (phones.length > MAX_PHONES) {
    throw badInput(`${field} can contain at most ${MAX_PHONES} phone numbers.`);
  }
  for (const phone of phones) {
    const digits = phone.replace(/\D/g, '').length;
    if (phone.length > MAX_PHONE_LENGTH || !PHONE_PATTERN.test(phone) || digits < 6 || digits > 15) {
      throw badInput(`"${phone}" is not a valid phone number.`);
    }
  }
  return phones.length > 0 ? phones : null;
}

export function optionalNonNegativeNumber(
  value: number | null | undefined,
  field: string
): number | null {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value) || value < 0) {
    throw badInput(`${field} must be a non-negative number.`);
  }
  return value;
}

export function parseEmail(value: string): string {
  const email = value.trim();
  if (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
    throw badInput('A valid email address is required.');
  }
  return email;
}

function parseSubjectName(value: unknown, field: string): string {
  const subject = typeof value === 'string' ? value.trim() : '';
  if (!subject || subject.length > MAX_SUBJECT_LENGTH) {
    throw badInput(
      `${field} must use non-empty subject names of at most ${MAX_SUBJECT_LENGTH} characters.`
    );
  }
  return subject;
}

export function parseScores(value: unknown, field = 'scores'): Record<string, number> {
  if (!isPlainObject(value)) {
    throw badInput(`${field} must be a JSON object mapping subject names to numeric scores.`);
  }
  const entries = Object.entries(value);
  if (entries.length > MAX_SCORE_SUBJECTS) {
    throw badInput(`${field} can contain at most ${MAX_SCORE_SUBJECTS} subjects.`);
  }
  return Object.fromEntries(
    entries.map(([rawSubject, score]) => {
      const subject = parseSubjectName(rawSubject, field);
      if (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > MAX_SCORE_VALUE) {
        throw badInput(`Score for "${subject}" must be a number between 0 and ${MAX_SCORE_VALUE}.`);
      }
      return [subject, score];
    })
  );
}

export function parsePreferences(value: unknown): Record<string, unknown> {
  if (!isPlainObject(value)) throw badInput('preferences must be a JSON object.');
  const size = new TextEncoder().encode(JSON.stringify(value)).length;
  if (size > MAX_PREFERENCES_BYTES) {
    throw badInput(`preferences must be at most ${MAX_PREFERENCES_BYTES} bytes.`);
  }
  return value;
}

export function parseSubjectList(value: unknown, field: string): string[] | null {
  if (value === null || value === undefined) return null;
  if (!Array.isArray(value)) throw badInput(`${field} must be a JSON array of subject names.`);
  if (value.length > MAX_REQUIRED_SUBJECTS) {
    throw badInput(`${field} can contain at most ${MAX_REQUIRED_SUBJECTS} subjects.`);
  }
  return [...new Set(value.map((entry) => parseSubjectName(entry, field)))];
}

function errorMessages(error: unknown): string {
  const messages: string[] = [];
  let current: unknown = error;
  for (let depth = 0; current instanceof Error && depth < 5; depth += 1) {
    messages.push(current.message);
    current = current.cause;
  }
  return messages.join('\n');
}

export function isUniqueConstraintError(error: unknown): boolean {
  return errorMessages(error).includes('UNIQUE constraint failed');
}

export function isForeignKeyConstraintError(error: unknown): boolean {
  return errorMessages(error).includes('FOREIGN KEY constraint failed');
}
