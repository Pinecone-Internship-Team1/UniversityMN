import type { Metadata } from "next";
import { ProfileView } from "@/components/profile/ProfileView";
import { staticPageMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return { ...(await staticPageMetadata("profile")), robots: { index: false, follow: false } };
}

export default function ProfilePage() {
  return <ProfileView />;
}
