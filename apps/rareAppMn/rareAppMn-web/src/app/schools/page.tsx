import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { SearchExplorer } from "@/components/schools/SearchExplorer";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/Section";
import { getTranslations } from "next-intl/server";
import { parseExamScore } from "@/lib/format";
import { staticPageMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return staticPageMetadata("schools");
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SchoolsPage({ searchParams }: PageProps) {
  const [{ tab, score }, t] = await Promise.all([searchParams, getTranslations("schoolsPage")]);
  const mode = tab === "majors" ? "majors" : "schools";

  return (
    <PageShell>
      <Container className="py-6 md:py-12">
        <SectionHeader
          as="h1"
          title={t("title")}
          description={t("description")}
        />
        <div className="mt-6 md:mt-8">
          <SearchExplorer mode={mode} score={parseExamScore(typeof score === "string" ? score : undefined)} />
        </div>
      </Container>
    </PageShell>
  );
}
