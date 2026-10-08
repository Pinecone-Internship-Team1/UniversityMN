import type { Metadata } from "next";
import { CompareExplorer } from "@/components/compare/CompareExplorer";
import { SectionLabel } from "@/components/home/SectionLabel";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { MAX_COMPARE_ITEMS, type CompareMode } from "@/lib/compare";

export const metadata: Metadata = {
  title: "Харьцуулах — Oyutan MN",
  description:
    "Их, дээд сургууль эсвэл мэргэжлүүдийг сургалтын төлбөр, ЭЕШ босго оноо, дотуур байр, тэтгэлгээр нь зэрэгцүүлэн харьцуулаарай.",
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ComparePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const mode: CompareMode = firstValue(params["type"]) === "majors" ? "majors" : "schools";
  const ids = [
    ...new Set(
      (firstValue(params["ids"]) ?? "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  ].slice(0, MAX_COMPARE_ITEMS);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <Navbar />

      <main className="mx-auto max-w-[1440px] px-6 py-12 sm:px-8 sm:py-16">
        <SectionLabel>Харьцуулах</SectionLabel>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl md:text-4xl">
          Сургууль, мэргэжлээ зэрэгцүүлэн харьцуул
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/70 sm:text-base">
          Хамгийн ихдээ {MAX_COMPARE_ITEMS} сургууль эсвэл мэргэжлийг сонгоод төлбөр,
          босго оноо, дотуур байр, тэтгэлгийг нь нэг дор хараарай.
        </p>

        <div className="mt-10">
          <CompareExplorer mode={mode} ids={ids} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
