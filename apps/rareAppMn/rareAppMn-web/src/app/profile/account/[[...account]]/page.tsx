import type { Metadata } from "next";
import { UserProfile } from "@clerk/nextjs";
import { ACCOUNT_SETTINGS_PATH } from "@/lib/auth-routes";

export const metadata: Metadata = {
  title: "Бүртгэлийн тохиргоо — Oyutan MN",
  description: "Нэр, зураг, имэйл, нууц үг, Google бүртгэл болон төхөөрөмжүүдээ удирдах.",
};

// Clerk's account screens (name, photo, email, password, Google account,
// devices) on their own sub-routes, e.g. /profile/account/security.
export default function AccountSettingsPage() {
  return (
    <UserProfile
      routing="path"
      path={ACCOUNT_SETTINGS_PATH}
      appearance={{
        elements: {
          rootBox: "w-full",
          cardBox: "w-full max-w-none",
        },
      }}
    />
  );
}
