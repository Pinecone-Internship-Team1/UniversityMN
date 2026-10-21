import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { PAGE_SEO } from "@/lib/seo";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = {
  ...pageMetadata(PAGE_SEO.signIn),
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  return (
    <AuthPageShell>
      <SignIn />
    </AuthPageShell>
  );
}
