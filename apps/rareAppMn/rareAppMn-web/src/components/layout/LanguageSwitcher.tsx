"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Globe } from "lucide-react";
import { LOCALE_COOKIE, LOCALE_COOKIE_MAX_AGE, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

/**
 * Toggles Mongolian/English: saves the choice in the NEXT_LOCALE cookie
 * (read by the server, see i18n/request.ts) and refreshes the current route
 * in place, with no page reload. The page keeps its scroll position and
 * client state; the server sends the new language's HTML and <html lang>.
 *
 * Shows a globe and the current language's code, in ThemeToggle's style.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations("language");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const next: Locale = locale === "mn" ? "en" : "mn";

  function switchLanguage() {
    const secure = window.location.protocol === "https:" ? "; secure" : "";
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax${secure}`;
    // Screen readers and the browser's spellcheck/translate pick this up at
    // once; the refreshed layout renders the same value.
    document.documentElement.lang = next;
    startTransition(() => router.refresh());
  }

  return (
    <button
      type="button"
      onClick={switchLanguage}
      disabled={pending}
      aria-label={t("switchTo")}
      title={t("switchTo")}
      lang={locale}
      className={cn(
        "relative flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-full px-2.5 text-ink-2 transition-colors hover:bg-ink/[0.06] hover:text-ink active:bg-ink/[0.1] disabled:opacity-60",
        className,
      )}
    >
      <Globe className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
      <span className="text-sm font-bold tabular-nums">
        {/* While the new language loads, show where we're going. */}
        {(pending ? next : locale).toUpperCase()}
      </span>
    </button>
  );
}
