import type { Metadata } from "next";
import Link from "next/link";
import { Award } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { SectionLabel } from "@/components/home/SectionLabel";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { formatDate, todayInMongolia } from "@/lib/format";
import {
  SCHOLARSHIP_DIRECTORY_QUERY,
  type ScholarshipDirectoryResult,
} from "@/lib/graphql/documents";
import { getErrorMessage } from "@/lib/graphql/errors";
import { fetchAllSchools } from "@/lib/graphql/fetch-all-schools";
import { createServerGraphqlClient } from "@/lib/graphql-server";
import { getUniversityByFullName, getUniversitySlug } from "@/lib/university-logos";

export const metadata: Metadata = {
  title: "Тэтгэлэг — Oyutan MN",
  description:
    "Монголын их, дээд сургуулиудын тэтгэлэг, хамрах хүрээ, шаардлага болон бүртгэлийн эцсийн хугацааг нэг дороос.",
};

type DirectorySchool = ScholarshipDirectoryResult["schools"]["items"][number];

export default async function ScholarshipsPage() {
  const { items: schools, error } = await fetchAllSchools<DirectorySchool>(
    createServerGraphqlClient(),
    SCHOLARSHIP_DIRECTORY_QUERY,
  );

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
    <div className="min-h-screen bg-paper text-ink">
      <Navbar />

      <main className="mx-auto max-w-[1440px] px-6 py-12 sm:px-8 sm:py-16">
        <SectionLabel>Тэтгэлэг</SectionLabel>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl md:text-4xl">
          Сургуулиудын тэтгэлэг, хөнгөлөлт
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/70 sm:text-base">
          Тэтгэлэг бүрийн хамрах хүрээ, шаардлага болон эцсийн хугацааг харьцуулж,
          өөрт тохирохыг нь цагтаа бүртгүүлээрэй.
        </p>

        <div className="mt-10">
          {error ? (
            <ErrorState
              title="Тэтгэлгийн мэдээллийг ачааллаж чадсангүй"
              description={getErrorMessage(error)}
            />
          ) : entries.length === 0 ? (
            <EmptyState
              icon={Award}
              title="Одоогоор тэтгэлэг бүртгэгдээгүй байна"
              description="Сургуулиуд тэтгэлгийн мэдээлэл нэмэх үед энд харагдана."
            />
          ) : (
            <>
              <p className="mb-5 text-xs font-semibold uppercase tracking-wider text-ink/50">
                {entries.length} тэтгэлэг
              </p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {entries.map(({ scholarship, school, expired }) => {
                  const university = getUniversityByFullName(school.name);
                  return (
                    <article
                      key={scholarship.id}
                      className="flex flex-col gap-3 rounded-2xl border border-ink/10 bg-card p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h2 className="text-sm font-bold text-ink">{scholarship.name}</h2>
                        <Badge variant={expired ? "outline" : "accent"}>
                          {expired ? "Хугацаа дууссан" : "Нээлттэй"}
                        </Badge>
                      </div>
                      <Link
                        href={`/university/${getUniversitySlug(school.name) ?? school.id}`}
                        className="text-xs font-semibold text-ink/70 transition-colors hover:text-accent"
                      >
                        {university?.short ?? school.name}
                      </Link>
                      {scholarship.coverage && (
                        <p className="text-xs text-ink/70">
                          <span className="font-semibold text-ink">Хамрах хүрээ: </span>
                          {scholarship.coverage}
                        </p>
                      )}
                      {scholarship.requirements && (
                        <p className="text-xs text-ink/70">
                          <span className="font-semibold text-ink">Шаардлага: </span>
                          {scholarship.requirements}
                        </p>
                      )}
                      <p className="mt-auto border-t border-ink/10 pt-3 text-xs font-semibold text-ink/70">
                        Эцсийн хугацаа:{" "}
                        {formatDate(scholarship.deadline) ?? "Тодорхойгүй"}
                      </p>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
