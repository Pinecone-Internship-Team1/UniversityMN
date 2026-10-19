import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import { AuthPageShell } from "@/components/auth/AuthPageShell";

export const metadata: Metadata = {
  title: "Бүртгүүлэх — Oyutan MN",
  description: "Сургуулийн дэлгэрэнгүй мэдээллийг үзэхийн тулд бүртгүүлээрэй.",
};

export default function SignUpPage() {
  return (
    <AuthPageShell>
      <SignUp />
    </AuthPageShell>
  );
}
