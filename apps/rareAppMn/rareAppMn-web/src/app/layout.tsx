import type { Metadata } from "next";
import { Unbounded, PT_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { GraphqlProvider } from "@/components/providers/GraphqlProvider";
import { ClerkUserSyncProvider } from "@/components/providers/ClerkUserSync";
import { AppToaster } from "@/components/providers/AppToaster";
import {
  AFTER_SIGN_IN_PATH,
  AFTER_SIGN_OUT_PATH,
  SIGN_IN_PATH,
  SIGN_UP_PATH,
} from "@/lib/auth-routes";
import { clerkAppearance, clerkLocalization } from "@/lib/clerk-ui";
import { LEGACY_THEME_STORAGE_KEY, THEME_STORAGE_KEY } from "@/lib/theme";
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

// Light by default, whatever the device's dark-mode setting; dark only when
// the visitor chose it with ThemeToggle (see lib/theme.ts).
const THEME_INIT_SCRIPT = `
(function () {
  try {
    localStorage.removeItem(${JSON.stringify(LEGACY_THEME_STORAGE_KEY)});
    var dark = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)}) === "dark";
    document.documentElement.classList.toggle("dark", dark);
  } catch (_error) {
    // localStorage unavailable (e.g. privacy mode) -- stay light.
  }
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      signInUrl={SIGN_IN_PATH}
      signUpUrl={SIGN_UP_PATH}
      signInFallbackRedirectUrl={AFTER_SIGN_IN_PATH}
      signUpFallbackRedirectUrl={AFTER_SIGN_IN_PATH}
      afterSignOutUrl={AFTER_SIGN_OUT_PATH}
      localization={clerkLocalization}
      appearance={clerkAppearance}
    >
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
