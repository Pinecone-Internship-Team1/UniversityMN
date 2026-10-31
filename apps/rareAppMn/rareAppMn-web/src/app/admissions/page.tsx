import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/Section";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { formatDateRange, todayInMongolia } from "@/lib/format";
import {
  ADMISSION_DIRECTORY_QUERY,
  type AdmissionDirectoryResult,
} from "@/lib/graphql/documents";
import { getErrorMessage } from "@/lib/graphql/errors";
import { fetchAllSchools } from "@/lib/graphql/fetch-all-schools";
import { createServerGraphqlClient } from "@/lib/graphql-server";
import { PAGE_SEO } from "@/lib/seo";
import { pageMetadata } from "@/lib/site";
import { getUniversityBySchoolId, getUniversitySlug } from "@/lib/university-logos";
import { cn } from "@/lib/utils";
import { SchoolLogo } from "@/components/schools/SchoolCard";

export const metadata: Metadata = pageMetadata(PAGE_SEO.admissions);

type DirectorySchool = AdmissionDirectoryResult["schools"]["items"][number];
type ScheduleStatus = "open" | "upcoming" | "ended" | "unknown";

const STATUS_ORDER: Record<ScheduleStatus, number> = {
  open: 0,
  upcoming: 1,
  unknown: 2,
  ended: 3,
};

const STATUS_BADGES: Record<ScheduleStatus, { label: string; variant: BadgeVariant }> = {
  open: { label: "Явагдаж байна", variant: "success" },
  upcoming: { label: "Удахгүй", variant: "accent" },
  unknown: { label: "Хугацаа тодорхойгүй", variant: "outline" },
  ended: { label: "Дууссан", variant: "outline" },
};

function scheduleStatus(
  startDate: string | null,
  endDate: string | null,
  today: string,
): ScheduleStatus {
  if (!startDate && !endDate) return "unknown";
  // A date without an end (e.g. "results announced") is a one-day event.
  const lastDay = endDate ?? startDate;
  if (lastDay && lastDay.slice(0, 10) < today) return "ended";
  if (startDate && startDate.slice(0, 10) > today) return "upcoming";
  return "open";
}

export default async function AdmissionsPage() {
  const { items: schools, error } = await fetchAllSchools<DirectorySchool>(
    createServerGraphqlClient(),
    ADMISSION_DIRECTORY_QUERY,
  );

  const today = todayInMongolia();
  const entries = schools
    .flatMap((school) =>
      school.admissionSchedules.map((schedule) => ({
        schedule,
        school,
        status: scheduleStatus(schedule.startDate, schedule.endDate, today),
      })),
    )
    .sort((a, b) => {
      if (a.status !== b.status) return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
      const aDate = a.schedule.startDate ?? a.schedule.endDate ?? "";
      const bDate = b.schedule.startDate ?? b.schedule.endDate ?? "";
      return a.status === "ended" ? bDate.localeCompare(aDate) : aDate.localeCompare(bDate);
    });

  return (
    <PageShell>
      <Container className="py-6 md:py-12">
        <SectionHeader
          as="h1"
          title="Элсэлтийн хуанли"
          description="Сургууль бүрийн элсэлтийн бүртгэл болон бусад чухал үйл явдлын хугацааг нэг дороос хянаарай."
        />

        <div className="mt-6 md:mt-8">
          {error ? (
            <ErrorState
              title="Элсэлтийн мэдээллийг ачааллаж чадсангүй"
              description={getErrorMessage(error)}
            />
          ) : entries.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="Одоогоор элсэлтийн хуваарь бүртгэгдээгүй байна"
              description="Сургуулиуд элсэлтийн хуваариа нэмэх үед энд харагдана."
            />
          ) : (
            <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {entries.map(({ schedule, school, status }) => {
                const university = getUniversityBySchoolId(school.id);
                const badge = STATUS_BADGES[status];
                return (
                  <li
                    key={schedule.id}
                    className={cn(
                      "flex gap-4 rounded-2xl border border-border-ink bg-card p-4 md:p-5",
                      status === "ended" && "bg-card/60",
                    )}
                  >
                    <SchoolLogo school={{ id: school.id, name: school.name, logoUrl: null }} size={44} className="mt-0.5 hidden min-[400px]:flex" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                        <span className="text-[15px] font-bold text-ink tabular-nums">
                          {formatDateRange(schedule.startDate, schedule.endDate)}
                        </span>
                      </div>
                      <h2 className="mt-2 font-sans text-base leading-snug font-bold tracking-normal text-ink md:text-lg">
                        {schedule.eventName}
                      </h2>
                      <Link
                        href={`/university/${getUniversitySlug(school.id) ?? school.id}`}
                        className="mt-0.5 inline-flex min-h-8 items-center text-[15px] text-ink-2 underline-offset-4 hover:text-accent hover:underline max-lg:tap-target"
                      >
                        {university?.short ?? school.name}
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Container>
    </PageShell>
  );
}
