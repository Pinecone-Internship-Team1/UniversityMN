import type { ReactNode } from "react";
import { SignUpAgainNote } from "@/components/auth/SignUpAgainNote";
import { PageShell } from "@/components/layout/PageShell";

/** Our /sign-in and /sign-up pages: Clerk's form inside the site's header and footer. */
export function AuthPageShell({ children }: { children: ReactNode }) {
  return (
    <PageShell>
      {/* One column: the intro, the note and Clerk's card share a width. */}
      <div className="mx-auto flex w-full max-w-md flex-col items-center px-4 py-8 md:py-14">
        <p className="text-center text-base leading-relaxed text-ink-2">
          Сургуулийн дэлгэрэнгүй мэдээллийг үзэхийн тулд нэвтэрнэ үү. Бүртгэлгүй бол
          бүртгүүлээрэй.
        </p>
        <SignUpAgainNote />
        <div className="mt-6 w-full">{children}</div>
      </div>
    </PageShell>
  );
}
