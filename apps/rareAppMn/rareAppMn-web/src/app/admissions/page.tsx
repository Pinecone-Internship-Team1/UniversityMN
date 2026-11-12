import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/Section";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { getTranslations } from "next-intl/server";
import { formatDateRange, todayInMongolia } from "@/lib/format";
import {
  ADMISSION_DIRECTORY_QUERY,
  type AdmissionDirectoryResult,
} from "@/lib/graphql/documents";
import { getErrorMessage } from "@/lib/graphql/errors";
import { fetchAllSchools } from "@/lib/graphql/fetch-all-schools";
import { createServerGraphqlClient } from "@/lib/graphql-server";
import { staticPageMetadata } from "@/lib/metadata";
import { getUniversityBySchoolId, getUniversitySlug } from "@/lib/university-logos";
import { cn } from "@/lib/utils";
import { SchoolLogo } from "@/components/schools/SchoolCard";

export async function generateMetadata(): Promise<Metadata> {
  return staticPageMetadata("admissions");
}

type DirectorySchool = AdmissionDirectoryResult["schools"]["items"][number];
type ScheduleStatus = "open" | "upcoming" | "ended" | "unknown";

const STATUS_ORDER: Record<ScheduleStatus, number> = {
  open: 0,
  upcoming: 1,
  unknown: 2,
  ended: 3,
};

/** Labels: messages "admissionsPage.status.<status>". */
const STATUS_VARIANTS: Record<ScheduleStatus, BadgeVariant> = {
  open: "success",
  upcoming: "accent",
  unknown: "outline",
  ended: "outline",
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
  const [{ items: schools, error }, t, tFormat, tErrors] = await Promise.all([
    fetchAllSchools<DirectorySchool>(createServerGraphqlClient(), ADMISSION_DIRECTORY_QUERY),
    getTranslations("admissionsPage"),
    getTranslations("format"),
    getTranslations("errors"),
  ]);

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
              icon={CalendarDays}
              title={t("emptyTitle")}
              description={t("emptyText")}
            />
          ) : (
            <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {entries.map(({ schedule, school, status }) => {
                const university = getUniversityBySchoolId(school.id);
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
                        <Badge variant={STATUS_VARIANTS[status]}>{t(`status.${status}`)}</Badge>
                        <span className="text-[15px] font-bold text-ink tabular-nums">
                          {formatDateRange(tFormat, schedule.startDate, schedule.endDate)}
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
