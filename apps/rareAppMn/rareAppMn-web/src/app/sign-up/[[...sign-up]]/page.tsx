import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { staticPageMetadata } from "@/lib/metadata";
import { authCardAppearance } from "@/lib/clerk-ui";

export async function generateMetadata(): Promise<Metadata> {
  return { ...(await staticPageMetadata("signUp")), robots: { index: false, follow: false } };
}

export default function SignUpPage() {
  return (
    <AuthPageShell>
      <SignUp appearance={authCardAppearance} />
    </AuthPageShell>
  );
}
