import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { SectionLabel } from "@/components/home/SectionLabel";
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
import { getUniversityByFullName, getUniversitySlug } from "@/lib/university-logos";

export const metadata: Metadata = {
  title: "Элсэлтийн хуанли — Oyutan MN",
  description:
    "Монголын их, дээд сургуулиудын элсэлтийн бүртгэл, шалгалт, үр дүнгийн хугацааг нэг хуанлиас.",
};

type DirectorySchool = AdmissionDirectoryResult["schools"]["items"][number];
type ScheduleStatus = "open" | "upcoming" | "ended" | "unknown";

const STATUS_ORDER: Record<ScheduleStatus, number> = {
  open: 0,
  upcoming: 1,
  unknown: 2,
  ended: 3,
};

const STATUS_BADGES: Record<ScheduleStatus, { label: string; variant: BadgeVariant }> = {
  open: { label: "Явагдаж байна", variant: "accent" },
  upcoming: { label: "Удахгүй", variant: "default" },
  unknown: { label: "Хугацаа тодорхойгүй", variant: "outline" },
  ended: { label: "Дууссан", variant: "outline" },
};

function scheduleStatus(
  startDate: string | null,
  endDate: string | null,
  today: string,
): ScheduleStatus {
  if (!startDate && !endDate) return "unknown";
  if (endDate && endDate.slice(0, 10) < today) return "ended";
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
    <div className="min-h-screen bg-paper text-ink">
      <Navbar />

      <main className="mx-auto max-w-[1440px] px-6 py-12 sm:px-8 sm:py-16">
        <SectionLabel>Элсэлт</SectionLabel>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl md:text-4xl">
          Элсэлтийн хуанли
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/70 sm:text-base">
          Сургууль бүрийн элсэлтийн бүртгэл болон бусад чухал үйл явдлын хугацааг
          нэг дороос хянаарай.
        </p>

        <div className="mt-10">
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
            <ul className="space-y-3">
              {entries.map(({ schedule, school, status }) => {
                const university = getUniversityByFullName(school.name);
                const badge = STATUS_BADGES[status];
                return (
                  <li
                    key={schedule.id}
                    className="flex flex-col gap-3 rounded-2xl border border-ink/10 bg-card p-5 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-ink">{schedule.eventName}</p>
                      <Link
                        href={`/university/${getUniversitySlug(school.name) ?? school.id}`}
                        className="mt-1 inline-block text-xs font-semibold text-ink/60 transition-colors hover:text-accent"
                      >
                        {university?.short ?? school.name}
                        {school.location ? ` · ${school.location}` : ""}
                      </Link>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-3">
                      <span className="text-xs font-medium text-ink/70">
                        {formatDateRange(schedule.startDate, schedule.endDate)}
                      </span>
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
