import type { Metadata } from "next";
import { Unbounded, PT_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { GraphqlProvider } from "@/components/providers/GraphqlProvider";
import { ClerkUserSyncProvider } from "@/components/providers/ClerkUserSync";
import { AppToaster } from "@/components/providers/AppToaster";
import "./global.css";

const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-unbounded",
  display: "swap",
});

const ptSans = PT_Sans({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
  variable: "--font-pt-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Oyutan MN — Монголын их, дээд сургуулиудыг нэг дороос",
  description:
    "ЭЕШ оноо, мэргэжил, сургалтын төлбөр, тэтгэлэг болон бусад мэдээллээр өөрт тохирох сургуулиа олоорой.",
};

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem("oyutan-theme");
    var theme = stored === "dark" || stored === "light"
      ? stored
      : window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    document.documentElement.classList.toggle("dark", theme === "dark");
  } catch (_error) {
    // localStorage/matchMedia unavailable (e.g. privacy mode) -- default light.
  }
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html
        lang="mn"
        className={`${unbounded.variable} ${ptSans.variable}`}
        suppressHydrationWarning
      >
        <head>
          <script
            // Runs before paint to avoid a flash of the wrong theme; reads
            // the same localStorage key ThemeToggle writes to.
            dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
          />
        </head>
        <body>
          <GraphqlProvider>
            <ClerkUserSyncProvider>{children}</ClerkUserSyncProvider>
            <AppToaster />
          </GraphqlProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
