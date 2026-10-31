"use client";

import { useQuery } from "urql";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  MAJORS_QUERY,
  SCHOLARSHIP_DIRECTORY_QUERY,
  SCHOOLS_QUERY,
  type MajorsQueryResult,
  type MajorsQueryVariables,
  type ScholarshipDirectoryResult,
  type SchoolsQueryResult,
  type SchoolsQueryVariables,
} from "@/lib/graphql/documents";
import { CountUp } from "./CountUp";

export interface StatCounts {
  schools: number | null;
  majors: number | null;
  scholarships: number | null;
}

const CARD = "min-w-0 rounded-2xl border border-border-ink bg-card p-4 lg:p-6";
const VALUE =
  "font-display text-[1.6rem] font-bold leading-none tracking-tight whitespace-nowrap text-ink min-[400px]:text-[1.9rem] md:text-[1.75rem] lg:text-[2.5rem] xl:text-[2.75rem]";
const LABEL = "mt-2 text-[15px] leading-snug text-ink-2 md:text-base";

function Stat({ label, value, loading }: { label: string; value: number | string | null; loading?: boolean }) {
  return (
    <div className={CARD}>
      <dt className="sr-only">{label}</dt>
      <dd className={VALUE}>
        {loading ? (
          <Skeleton className="h-[1em] w-[2.5em] rounded-lg" />
        ) : typeof value === "number" ? (
          <CountUp value={value} />
        ) : (
          (value ?? "—")
        )}
      </dd>
      <dd className={LABEL} aria-hidden="true">
        {label}
      </dd>
    </div>
  );
}

/**
 * The four homepage stats. Counts come from the server render; any the server
 * couldn't load (e.g. the API was briefly unreachable) are fetched again here
 * in the browser, with a skeleton meanwhile, so a card never just disappears.
 */
export function StatGrid({ initial }: { initial: StatCounts }) {
  const [schools] = useQuery<SchoolsQueryResult, SchoolsQueryVariables>({
    query: SCHOOLS_QUERY,
    variables: { filter: { limit: 1 } },
    pause: initial.schools != null,
  });
  const [majors] = useQuery<MajorsQueryResult, MajorsQueryVariables>({
    query: MAJORS_QUERY,
    variables: { filter: { limit: 1 } },
    pause: initial.majors != null,
  });
  // Every school fits in one page of the directory (the API allows 100).
  const [scholarships] = useQuery<ScholarshipDirectoryResult>({
    query: SCHOLARSHIP_DIRECTORY_QUERY,
    variables: { filter: { limit: 100 } },
    pause: initial.scholarships != null,
  });

  const schoolCount = initial.schools ?? schools.data?.schools.pageInfo.totalCount ?? null;
  const majorCount = initial.majors ?? majors.data?.majors.pageInfo.totalCount ?? null;
  const scholarshipCount =
    initial.scholarships ??
    (scholarships.data
      ? scholarships.data.schools.items.reduce((sum, school) => sum + school.scholarships.length, 0)
      : null);

  return (
    <dl className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
      <Stat label="их, дээд сургууль" value={schoolCount} loading={schoolCount == null && !schools.error} />
      <Stat label="мэргэжил, хөтөлбөр" value={majorCount} loading={majorCount == null && !majors.error} />
      <Stat
        label="тэтгэлэг"
        value={scholarshipCount}
        loading={scholarshipCount == null && !scholarships.error}
      />
      <Stat label="оны элсэлтийн мэдээлэл" value="2026–27" />
    </dl>
  );
}

/** Same footprint as StatGrid, for the Suspense fallback. */
export function StatGridSkeleton() {
  return (
    <dl className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4" aria-busy="true">
      {["их, дээд сургууль", "мэргэжил, хөтөлбөр", "тэтгэлэг", "оны элсэлтийн мэдээлэл"].map((label) => (
        <Stat key={label} label={label} value={null} loading />
      ))}
    </dl>
  );
}
