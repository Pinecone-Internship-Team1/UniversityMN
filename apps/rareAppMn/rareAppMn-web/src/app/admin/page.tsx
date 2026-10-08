import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { SectionLabel } from "@/components/home/SectionLabel";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

export const metadata: Metadata = {
  title: "Админ самбар — Oyutan MN",
  description: "Сургууль, мэргэжлийн мэдээлэл болон хэрэглэгчдийг удирдах.",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <Navbar />

      <main className="mx-auto max-w-[1440px] px-6 py-12 sm:px-8 sm:py-16">
        <SectionLabel>Админ</SectionLabel>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl md:text-4xl">
          Админ самбар
        </h1>

        <div className="mt-10">
          <AdminDashboard />
        </div>
      </main>

      <Footer />
    </div>
  );
}
