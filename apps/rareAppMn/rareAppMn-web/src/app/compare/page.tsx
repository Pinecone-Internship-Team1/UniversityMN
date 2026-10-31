import type { Metadata } from "next";
import { CompareExplorer } from "@/components/compare/CompareExplorer";
import { PageShell } from "@/components/layout/PageShell";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/Section";
import { MAX_COMPARE_ITEMS, type CompareMode } from "@/lib/compare";
import { PAGE_SEO } from "@/lib/seo";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata(PAGE_SEO.compare);

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
    <PageShell>
      <Container className="py-6 md:py-12">
        <SectionHeader
          as="h1"
          title="Сургууль, мэргэжлээ зэрэгцүүлэн харьцуул"
          description={<>Хамгийн ихдээ {MAX_COMPARE_ITEMS} сургууль эсвэл мэргэжлийг сонгоод төлбөр, босго оноо, дотуур байр, тэтгэлгийг нь нэг дор хараарай.</>}
        />

        <div className="mt-6 md:mt-8">
          <CompareExplorer mode={mode} ids={ids} />
        </div>
      </Container>
    </PageShell>
  );
}
