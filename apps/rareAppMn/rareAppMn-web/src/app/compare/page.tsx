import type { Metadata } from "next";
import { CompareExplorer } from "@/components/compare/CompareExplorer";
import { PageShell } from "@/components/layout/PageShell";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/Section";
import { getTranslations } from "next-intl/server";
import { MAX_COMPARE_ITEMS, type CompareMode } from "@/lib/compare";
import { staticPageMetadata } from "@/lib/metadata";

export async function generateMetadata(): Promise<Metadata> {
  return staticPageMetadata("compare");
}

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ComparePage({ searchParams }: PageProps) {
  const [params, t] = await Promise.all([searchParams, getTranslations("comparePage")]);
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
          title={t("title")}
          description={t("description", { max: MAX_COMPARE_ITEMS })}
        />

        <div className="mt-6 md:mt-8">
          <CompareExplorer mode={mode} ids={ids} />
        </div>
      </Container>
    </PageShell>
  );
}
