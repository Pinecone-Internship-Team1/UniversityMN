import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { SearchExplorer } from "@/components/schools/SearchExplorer";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/Section";
import { parseExamScore } from "@/lib/format";
import { PAGE_SEO } from "@/lib/seo";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata(PAGE_SEO.schools);

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SchoolsPage({ searchParams }: PageProps) {
  const { tab, score } = await searchParams;
  const mode = tab === "majors" ? "majors" : "schools";

  return (
    <PageShell>
      <Container className="py-6 md:py-12">
        <SectionHeader
          as="h1"
          title="Сургууль, мэргэжлээ ол"
          description="Байршил, төлбөр, дотуур байр, тэтгэлэг, ЭЕШ босго оноогоор шүүж хайгаарай."
        />
        <div className="mt-6 md:mt-8">
          <SearchExplorer mode={mode} score={parseExamScore(typeof score === "string" ? score : undefined)} />
        </div>
      </Container>
    </PageShell>
  );
}
