"use client";

import { Toaster } from "sonner";
import { useEffect, useState } from "react";

/** Mirrors the `.dark` class on <html> (set by the inline script / ThemeToggle) so toasts match the current theme. */
export function AppToaster() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const root = document.documentElement;
    setTheme(root.classList.contains("dark") ? "dark" : "light");

    const observer = new MutationObserver(() => {
      setTheme(root.classList.contains("dark") ? "dark" : "light");
    });
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <Toaster
      theme={theme}
      position="top-center"
      richColors
      closeButton
      toastOptions={{
        style: {
          background: "var(--card)",
          color: "var(--ink)",
          border: "1px solid var(--border-ink)",
          fontFamily: "var(--font-sans)",
        },
      }}
    />
  );
}
