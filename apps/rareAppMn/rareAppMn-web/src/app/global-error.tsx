"use client"; // Replaces the root layout when it fails, so it brings its own <html> and styles.

import "./global.css";

/**
 * This page renders without the root layout, so without next-intl's provider
 * or messages: whatever broke may be the layout itself. Its few strings live
 * here, and the language comes straight from the NEXT_LOCALE cookie.
 */
const TEXT = {
  mn: {
    tabTitle: "Алдаа гарлаа",
    code: "Өө!",
    title: "Уучлаарай, алдаа гарлаа",
    text: "Сайтыг ачаалах үед асуудал гарлаа. Дахин оролдоно уу.",
    retry: "Дахин оролдох",
    home: "Нүүр хуудас",
  },
  en: {
    tabTitle: "Something went wrong",
    code: "Oops!",
    title: "Sorry, something went wrong",
    text: "There was a problem loading the site. Please try again.",
    retry: "Try again",
    home: "Home",
  },
};

function currentLocale(): keyof typeof TEXT {
  if (typeof document === "undefined") return "mn";
  return /(?:^|;\s*)NEXT_LOCALE=en(?:;|$)/.test(document.cookie) ? "en" : "mn";
}

export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const locale = currentLocale();
  const t = TEXT[locale];
  return (
    <html lang={locale}>
      <body className="flex min-h-dvh items-center justify-center bg-paper px-4 text-center text-ink">
        <title>{`${t.tabTitle} — Oyutan MN`}</title>
        <div className="max-w-md">
          <p className="text-6xl font-bold text-accent" aria-hidden="true">
            {t.code}
          </p>
          <h1 className="mt-6 text-2xl">{t.title}</h1>
          <p className="mt-3 text-base text-ink-2">{t.text}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => retry()}
              className="h-12 rounded-full bg-accent px-6 font-bold text-accent-foreground"
            >
              {t.retry}
            </button>
            {/* A full page load: the app's router may be what failed. */}
            <a href="/" className="inline-flex h-12 items-center justify-center rounded-full border border-ink/20 px-6 font-bold">
              {t.home}
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
