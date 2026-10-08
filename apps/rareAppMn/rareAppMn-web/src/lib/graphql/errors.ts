import type { CombinedError } from "@urql/core";

export type ErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "BAD_USER_INPUT";

const MESSAGES_BY_CODE: Record<ErrorCode, string> = {
  UNAUTHENTICATED: "Энэ үйлдлийг хийхийн тулд нэвтэрнэ үү.",
  FORBIDDEN: "Танд энэ үйлдлийг хийх эрх байхгүй байна.",
  NOT_FOUND: "Хайсан мэдээлэл олдсонгүй. Устгагдсан байж магадгүй.",
  CONFLICT: "Энэ мэдээлэл өөр бүртгэлтэй давхцаж байна.",
  BAD_USER_INPUT: "Оруулсан мэдээлэл буруу байна.",
};

const NETWORK_MESSAGE =
  "Сервертэй холбогдож чадсангүй. Интернэт холболтоо шалгаад дахин оролдоно уу.";
const FALLBACK_MESSAGE = "Алдаа гарлаа. Дахин оролдоно уу.";

function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === "string" && value in MESSAGES_BY_CODE;
}

export function getErrorCode(error: CombinedError): ErrorCode | undefined {
  const code = error.graphQLErrors[0]?.extensions?.["code"];
  return isErrorCode(code) ? code : undefined;
}

export function getErrorMessage(
  error: CombinedError,
  overrides: Partial<Record<ErrorCode, string>> = {},
): string {
  const code = getErrorCode(error);
  if (code) return overrides[code] ?? MESSAGES_BY_CODE[code];
  if (error.networkError) return NETWORK_MESSAGE;
  return FALLBACK_MESSAGE;
}

export function getErrorDetail(error: CombinedError): string | undefined {
  return error.graphQLErrors[0]?.message;
}

export function getErrorMessageWithDetail(error: CombinedError): string {
  const message = getErrorMessage(error);
  const detail = getErrorDetail(error);
  return getErrorCode(error) === "BAD_USER_INPUT" && detail ? `${message} (${detail})` : message;
}
