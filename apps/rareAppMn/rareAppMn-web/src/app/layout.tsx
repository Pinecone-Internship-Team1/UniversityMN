import type { Metadata, Viewport } from "next";
import { Montserrat, PT_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { GraphqlProvider } from "@/components/providers/GraphqlProvider";
import { ClerkUserSyncProvider } from "@/components/providers/ClerkUserSync";
import { AppToaster } from "@/components/providers/AppToaster";
import { PageViewTracker } from "@/components/providers/PageViewTracker";
import {
  AFTER_SIGN_IN_PATH,
  AFTER_SIGN_OUT_PATH,
  SIGN_IN_PATH,
  SIGN_UP_PATH,
} from "@/lib/auth-routes";
import { clerkAppearance, clerkLocalization } from "@/lib/clerk-ui";
import { PAGE_SEO } from "@/lib/seo";
import { OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/site";
import { LEGACY_THEME_STORAGE_KEY, THEME_STORAGE_KEY } from "@/lib/theme";
import "./global.css";

// Display font for headings. Montserrat replaces Unbounded, which has no
// Mongolian Ө/ө/Ү/ү glyphs (they fell back to Arial). Mongolian letters are in
// the cyrillic-ext subset. h1/h2 use 800, other display text 700.
const montserrat = Montserrat({
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: ["700", "800"],
  variable: "--font-display-face",
  display: "swap",
});

const ptSans = PT_Sans({
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: ["400", "700"],
  variable: "--font-pt-sans",
  display: "swap",
});

// Pages without their own metadata (e.g. 404) fall back to the home page's
// title and share card. No canonical here: each page sets its own.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: PAGE_SEO.home.title,
  description: PAGE_SEO.home.description,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "mn_MN",
    images: [OG_IMAGE],
  },
  twitter: { card: "summary_large_image", images: [OG_IMAGE] },
};

// viewport-fit=cover lets the footer, menus and sticky bars pad themselves
// with env(safe-area-inset-*) on phones with a notch or home indicator.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
        className={`${montserrat.variable} ${ptSans.variable}`}
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
            <PageViewTracker />
          </GraphqlProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
