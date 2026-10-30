import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { PAGE_SEO } from "@/lib/seo";
import { pageMetadata } from "@/lib/site";
import { authCardAppearance } from "@/lib/clerk-ui";

export const metadata: Metadata = {
  ...pageMetadata(PAGE_SEO.signUp),
  robots: { index: false, follow: false },
};

export default function SignUpPage() {
  return (
    <AuthPageShell>
      <SignUp appearance={authCardAppearance} />
    </AuthPageShell>
  );
}
