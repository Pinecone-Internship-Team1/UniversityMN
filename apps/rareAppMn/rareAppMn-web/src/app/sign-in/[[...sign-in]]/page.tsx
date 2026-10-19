import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { AuthPageShell } from "@/components/auth/AuthPageShell";

export const metadata: Metadata = {
  title: "Нэвтрэх — Oyutan MN",
  description: "Сургуулийн дэлгэрэнгүй мэдээллийг үзэхийн тулд нэвтэрнэ үү.",
};

export default function SignInPage() {
  return (
    <AuthPageShell>
      <SignIn />
    </AuthPageShell>
  );
}
