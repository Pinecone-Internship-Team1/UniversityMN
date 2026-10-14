import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { SearchExplorer } from "@/components/schools/SearchExplorer";
import { SectionLabel } from "@/components/home/SectionLabel";

export const metadata: Metadata = {
  title: "Сургууль хайх — Oyutan MN",
  description:
    "Байршил, сургалтын төлбөр, дотуур байр, тэтгэлэг, ЭЕШ босго оноогоор Монголын их, дээд сургууль, мэргэжлийг шүүж хайгаарай.",
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SchoolsPage({ searchParams }: PageProps) {
  const { tab } = await searchParams;
  const mode = tab === "majors" ? "majors" : "schools";

  return (
    <div className="min-h-screen bg-paper text-ink">
      <Navbar />

      <main className="mx-auto max-w-[1440px] px-6 py-12 sm:px-8 sm:py-16">
        <SectionLabel>Сургууль хайх</SectionLabel>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl md:text-4xl">
          Өөрт тохирох сургууль, мэргэжлээ ол
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/70 sm:text-base">
          Байршил, сургалтын төлбөр, дотуур байр, тэтгэлэг, ЭЕШ босго оноогоор
          шүүж, танд хамгийн тохирох сургууль эсвэл мэргэжлийг олоорой.
        </p>

        <div className="mt-10">
          <SearchExplorer mode={mode} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
