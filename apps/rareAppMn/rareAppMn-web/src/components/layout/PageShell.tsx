import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";

/** Header, main and footer for every public page, with a skip link for keyboard users. */
export function PageShell({ children, className }: { children: ReactNode; className?: string }) {
  const t = useTranslations("common");
  return (
    <div className="flex min-h-dvh flex-col bg-paper text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2.5 focus:font-bold focus:text-paper"
      >
        {t("skipToContent")}
      </a>
      <Navbar />
      <main id="main" className={cn("flex-1", className)}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
