import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from "./config";

/**
 * The request's language: the visitor's saved choice, else Mongolian. Read on
 * the server, so the first HTML is already in the right language (no flash).
 */
export default getRequestConfig(async () => {
  const saved = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = isLocale(saved) ? saved : DEFAULT_LOCALE;
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
    // Dates are all fixed strings in our data; pin the zone so server and
    // browser agree if a formatter is ever used.
    timeZone: "Asia/Ulaanbaatar",
  };
});
