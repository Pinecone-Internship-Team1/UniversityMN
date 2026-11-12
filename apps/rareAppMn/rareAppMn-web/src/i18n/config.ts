/**
 * The site's languages. Mongolian is the default for everyone; English is
 * used only after a visitor picks it with LanguageSwitcher, which saves the
 * choice in LOCALE_COOKIE. The browser's language is never consulted.
 *
 * URLs stay the same in both languages (no /en prefix): the server reads the
 * cookie on every request (see i18n/request.ts).
 */
export const LOCALES = ["mn", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "mn";

/** next-intl's conventional cookie name. */
export const LOCALE_COOKIE = "NEXT_LOCALE";
/** One year, so the choice survives until the visitor changes it. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Open Graph locale for each language. */
export const OG_LOCALES: Record<Locale, string> = { mn: "mn_MN", en: "en_US" };
