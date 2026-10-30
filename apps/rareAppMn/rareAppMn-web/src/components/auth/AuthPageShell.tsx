import type { ReactNode } from "react";
import { SignUpAgainNote } from "@/components/auth/SignUpAgainNote";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

/** Our /sign-in and /sign-up pages: Clerk's form inside the site's Navbar/Footer. */
export function AuthPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <Navbar />

      {/* One column: the intro, the note and Clerk's card share a width. */}
      <main className="mx-auto flex w-full max-w-md flex-col items-center px-5 py-10 sm:px-0 sm:py-16">
        <p className="text-center text-sm leading-relaxed text-ink-soft">
          Сургуулийн дэлгэрэнгүй мэдээллийг үзэхийн тулд нэвтэрнэ үү. Бүртгэлгүй бол
          бүртгүүлээрэй.
        </p>
        <SignUpAgainNote />
        <div className="mt-6 w-full">{children}</div>
      </main>

      <Footer />
    </div>
  );
}
