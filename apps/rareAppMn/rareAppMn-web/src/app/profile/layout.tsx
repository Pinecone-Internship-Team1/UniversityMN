import type { ReactNode } from "react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { SectionLabel } from "@/components/home/SectionLabel";
import { ProfileTabs } from "@/components/profile/ProfileTabs";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <Navbar />

      <main className="mx-auto max-w-[1440px] px-6 py-12 sm:px-8 sm:py-16">
        <SectionLabel>Миний профайл</SectionLabel>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl md:text-4xl">
          Таны профайл
        </h1>

        <ProfileTabs className="mt-8" />

        <div className="mt-8">{children}</div>
      </main>

      <Footer />
    </div>
  );
}
