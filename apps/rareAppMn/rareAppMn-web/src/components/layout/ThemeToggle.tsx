"use client";

import { Moon, Sun } from "lucide-react";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import { cn } from "@/lib/utils";

/**
 * Switches light/dark. Both icons are rendered and CSS shows the right one
 * from the <html class="dark"> the inline script in layout.tsx set before
 * paint, so there is no state to sync and no icon flash on load.
 */
export function ThemeToggle({ className }: { className?: string }) {
  // Saved only on an explicit click, so the site keeps opening light
  // (white) for anyone who never chose dark.
  function toggleTheme() {
    const dark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, dark ? "dark" : "light");
    } catch {
      // Ignore storage failures (private browsing, quota, etc.).
    }
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Өнгөний горим солих"
      title="Өнгөний горим солих"
      className={cn(
        "relative flex h-11 w-11 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-ink/[0.06] hover:text-ink active:bg-ink/[0.1]",
        className,
      )}
    >
      <Sun className="h-5 w-5 dark:hidden" aria-hidden="true" />
      <Moon className="hidden h-5 w-5 dark:block" aria-hidden="true" />
    </button>
  );
}
