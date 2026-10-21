import type { Metadata } from "next";
import { ProfileView } from "@/components/profile/ProfileView";
import { PAGE_SEO } from "@/lib/seo";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = {
  ...pageMetadata(PAGE_SEO.profile),
  robots: { index: false, follow: false },
};

export default function ProfilePage() {
  return <ProfileView />;
}
