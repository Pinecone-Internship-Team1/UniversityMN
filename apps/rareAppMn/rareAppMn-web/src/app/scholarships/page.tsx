import type { Metadata } from "next";
import Link from "next/link";
import { Award, CalendarDays } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/Section";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { getTranslations } from "next-intl/server";
import { formatDateMn, todayInMongolia } from "@/lib/format";
import {
  SCHOLARSHIP_DIRECTORY_QUERY,
  type ScholarshipDirectoryResult,
} from "@/lib/graphql/documents";
import { getErrorMessage } from "@/lib/graphql/errors";
import { fetchAllSchools } from "@/lib/graphql/fetch-all-schools";
import { createServerGraphqlClient } from "@/lib/graphql-server";
import { staticPageMetadata } from "@/lib/metadata";
import { getUniversityBySchoolId, getUniversitySlug } from "@/lib/university-logos";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  return staticPageMetadata("scholarships");
}

type DirectorySchool = ScholarshipDirectoryResult["schools"]["items"][number];

export default async function ScholarshipsPage() {
  const [{ items: schools, error }, t, tErrors] = await Promise.all([
    fetchAllSchools<DirectorySchool>(createServerGraphqlClient(), SCHOLARSHIP_DIRECTORY_QUERY),
    getTranslations("scholarshipsPage"),
    getTranslations("errors"),
  ]);

  const today = todayInMongolia();
  const entries = schools
    .flatMap((school) =>
      school.scholarships.map((scholarship) => ({
        scholarship,
        school,
        expired: scholarship.deadline != null && scholarship.deadline < today,
      })),
    )
    .sort((a, b) => {
      if (a.expired !== b.expired) return a.expired ? 1 : -1;
      const aDeadline = a.scholarship.deadline ?? "9999-12-31";
      const bDeadline = b.scholarship.deadline ?? "9999-12-31";
      return a.expired
        ? bDeadline.localeCompare(aDeadline)
        : aDeadline.localeCompare(bDeadline);
    });

  return (
    <PageShell>
      <Container className="py-6 md:py-12">
        <SectionHeader
          as="h1"
          title={t("title")}
          description={t("description")}
        />

        <div className="mt-6 md:mt-8">
          {error ? (
            <ErrorState
              title={t("error")}
              description={getErrorMessage(tErrors, error)}
            />
          ) : entries.length === 0 ? (
            <EmptyState
              icon={Award}
              title={t("emptyTitle")}
              description={t("emptyText")}
            />
          ) : (
            <>
              <p className="mb-4 text-[15px] font-bold text-ink-2">{t("count", { count: entries.length })}</p>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                {entries.map(({ scholarship, school, expired }) => {
                  const university = getUniversityBySchoolId(school.id);
                  return (
                    <li
                      key={scholarship.id}
                      className={cn(
                        "flex flex-col rounded-2xl border border-border-ink bg-card p-5",
                        expired && "bg-card/60",
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={expired ? "outline" : "success"}>
                          {expired ? t("expired") : t("open")}
                        </Badge>
                        <Link
                          href={`/university/${getUniversitySlug(school.id) ?? school.id}`}
                          className="inline-flex min-h-8 items-center text-[15px] font-bold text-ink-2 underline-offset-4 hover:text-accent hover:underline max-lg:tap-target"
                        >
                          {university?.short ?? school.name}
                        </Link>
                      </div>
                      <h2 className="mt-3 font-sans text-lg leading-snug font-bold tracking-normal text-ink">
                        {scholarship.name}
                      </h2>
                      {scholarship.coverage && (
                        <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
                          <span className="font-bold text-ink">{t("coverage")} </span>
                          {scholarship.coverage}
                        </p>
                      )}
                      {scholarship.requirements && (
                        <p className="mt-2 line-clamp-4 text-[15px] leading-relaxed text-ink-2">
                          <span className="font-bold text-ink">{t("requirements")} </span>
                          {scholarship.requirements}
                        </p>
                      )}
                      <p className="mt-auto flex items-center gap-2 border-t border-border-ink pt-3 text-[15px] font-bold text-ink [&:not(:first-child)]:mt-4">
                        <CalendarDays className="h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />
                        {t("deadline", { date: formatDateMn(scholarship.deadline) ?? t("deadlineUnknown") })}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </Container>
    </PageShell>
  );
}
