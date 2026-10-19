import type { Metadata } from "next";
import { ProfileView } from "@/components/profile/ProfileView";

export const metadata: Metadata = {
  title: "Миний профайл — Oyutan MN",
  description: "Профайлын мэдээлэл, хадгалсан сургууль, мэргэжлээ хянах.",
};

export default function ProfilePage() {
  return <ProfileView />;
}
