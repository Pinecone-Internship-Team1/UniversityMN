import type { CombinedError } from "@urql/core";
import type { ErrorsT } from "@/i18n/types";

export type ErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "BAD_USER_INPUT";

const ERROR_CODES: readonly ErrorCode[] = [
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "BAD_USER_INPUT",
];

function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === "string" && (ERROR_CODES as readonly string[]).includes(value);
}

export function getErrorCode(error: CombinedError): ErrorCode | undefined {
  const code = error.graphQLErrors[0]?.extensions?.["code"];
  return isErrorCode(code) ? code : undefined;
}

/** A message for the user, from the "errors" namespace (`t` = useTranslations("errors")). */
export function getErrorMessage(
  t: ErrorsT,
  error: CombinedError,
  overrides: Partial<Record<ErrorCode, string>> = {},
): string {
  const code = getErrorCode(error);
  if (code) return overrides[code] ?? t(code);
  if (error.networkError) return t("network");
  return t("fallback");
}

export function getErrorDetail(error: CombinedError): string | undefined {
  return error.graphQLErrors[0]?.message;
}

export function getErrorMessageWithDetail(t: ErrorsT, error: CombinedError): string {
  const message = getErrorMessage(t, error);
  const detail = getErrorDetail(error);
  return getErrorCode(error) === "BAD_USER_INPUT" && detail ? `${message} (${detail})` : message;
}
