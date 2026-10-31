"use client"; // Replaces the root layout when it fails, so it brings its own <html> and styles.

import "./global.css";

export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="mn">
      <body className="flex min-h-dvh items-center justify-center bg-paper px-4 text-center text-ink">
        <title>Алдаа гарлаа — Oyutan MN</title>
        <div className="max-w-md">
          <p className="text-6xl font-bold text-accent" aria-hidden="true">
            Өө!
          </p>
          <h1 className="mt-6 text-2xl">Уучлаарай, алдаа гарлаа</h1>
          <p className="mt-3 text-base text-ink-2">
            Сайтыг ачаалах үед асуудал гарлаа. Дахин оролдоно уу.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => retry()}
              className="h-12 rounded-full bg-accent px-6 font-bold text-accent-foreground"
            >
              Дахин оролдох
            </button>
            {/* A full page load: the app's router may be what failed. */}
            <a href="/" className="inline-flex h-12 items-center justify-center rounded-full border border-ink/20 px-6 font-bold">
              Нүүр хуудас
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
