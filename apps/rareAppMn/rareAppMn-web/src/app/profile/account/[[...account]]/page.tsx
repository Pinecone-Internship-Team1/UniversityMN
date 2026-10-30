import type { Metadata } from "next";
import { UserProfile } from "@clerk/nextjs";
import { ACCOUNT_SETTINGS_PATH } from "@/lib/auth-routes";
import { PAGE_SEO } from "@/lib/seo";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = {
  ...pageMetadata(PAGE_SEO.account),
  robots: { index: false, follow: false },
};

// Clerk's account screens (name, photo, email, Google account,
// devices) on their own sub-routes, e.g. /profile/account/security.
export default function AccountSettingsPage() {
  return (
    <UserProfile
      routing="path"
      path={ACCOUNT_SETTINGS_PATH}
      appearance={{
        elements: {
          rootBox: "w-full",
          // Fit the content instead of Clerk's fixed 44rem height.
          cardBox: "h-auto min-h-[28rem] w-full max-w-none",
        },
      }}
    />
  );
}
