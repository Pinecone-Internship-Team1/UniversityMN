"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const STORAGE_KEY = "oyutan-theme";

type Theme = "light" | "dark";

export function ThemeToggle() {
  // Always starts as "light" to match the server-rendered markup exactly
  // (there's no `document` during SSR). The inline script in layout.tsx
  // already set the real class on <html> before hydration; this effect
  // just reads it back once mounted so the icon reflects reality.
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(
      document.documentElement.classList.contains("dark") ? "dark" : "light",
    );
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Ignore storage failures (private browsing, quota, etc.).
    }
  }, [theme, mounted]);

  return (
    <button
      type="button"
      onClick={() =>
        setTheme((current) => (current === "dark" ? "light" : "dark"))
      }
      aria-label={
        theme === "dark" ? "Цайвар горимд шилжих" : "Харанхуй горимд шилжих"
      }
      className="relative flex h-10 w-10 items-center justify-center rounded-lg text-ink/80 transition-colors hover:bg-ink/[0.04] hover:text-ink"
    >
      <Sun
        className={`h-[18px] w-[18px] transition-all duration-300 ${
          theme === "dark"
            ? "scale-0 rotate-90 opacity-0"
            : "scale-100 rotate-0 opacity-100"
        }`}
      />
      <Moon
        className={`absolute h-[18px] w-[18px] transition-all duration-300 ${
          theme === "dark"
            ? "scale-100 rotate-0 opacity-100"
            : "scale-0 -rotate-90 opacity-0"
        }`}
      />
    </button>
  );
}
