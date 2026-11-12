import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { staticPageMetadata } from "@/lib/metadata";
import { authCardAppearance } from "@/lib/clerk-ui";

export async function generateMetadata(): Promise<Metadata> {
  return { ...(await staticPageMetadata("signIn")), robots: { index: false, follow: false } };
}

export default function SignInPage() {
  return (
    <AuthPageShell>
      <SignIn appearance={authCardAppearance} />
    </AuthPageShell>
  );
}
