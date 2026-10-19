import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

/** Our /sign-in and /sign-up pages: Clerk's form inside the site's Navbar/Footer. */
export function AuthPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <Navbar />

      <main className="mx-auto flex max-w-[1440px] flex-col items-center px-5 py-12 sm:px-8 sm:py-16">
        <p className="max-w-md text-center text-sm leading-relaxed text-ink/70">
          Сургуулийн дэлгэрэнгүй мэдээллийг үзэхийн тулд нэвтэрнэ үү. Бүртгэлгүй бол
          бүртгүүлээрэй.
        </p>
        <div className="mt-8 flex w-full justify-center">{children}</div>
      </main>

      <Footer />
    </div>
  );
}
