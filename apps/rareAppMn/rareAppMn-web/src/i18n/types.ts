import type { useTranslations } from "next-intl";
import type { Locale } from "./config";
import type messages from "../../messages/mn.json";

/**
 * Typed keys: a key missing from messages/mn.json is a type error. en.json
 * must have the same shape (scripts/check-messages.mjs checks it).
 */
declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof messages;
  }
}

/**
 * A translator for one namespace, for plain helper functions (lib/format.ts,
 * lib/validation.ts, ...) that take it as an argument. Components get one
 * from useTranslations("format") or await getTranslations("format").
 */
export type FormatT = ReturnType<typeof useTranslations<"format">>;
export type ErrorsT = ReturnType<typeof useTranslations<"errors">>;
export type ValidationT = ReturnType<typeof useTranslations<"validation">>;
export type SeoT = ReturnType<typeof useTranslations<"seo">>;
export type SiteT = ReturnType<typeof useTranslations<"site">>;
