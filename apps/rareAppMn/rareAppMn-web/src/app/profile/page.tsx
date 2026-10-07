import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { SectionLabel } from "@/components/home/SectionLabel";
import { ProfileView } from "@/components/profile/ProfileView";

export const metadata: Metadata = {
  title: "Миний профайл — Oyutan MN",
  description: "Профайлын мэдээлэл, хадгалсан сургууль, мэргэжлээ хянах.",
};

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <Navbar />

      <main className="mx-auto max-w-[1440px] px-6 py-12 sm:px-8 sm:py-16">
        <SectionLabel>Миний профайл</SectionLabel>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl md:text-4xl">
          Таны профайл
        </h1>

        <div className="mt-10">
          <ProfileView />
        </div>
      </main>

      <Footer />
    </div>
  );
}
