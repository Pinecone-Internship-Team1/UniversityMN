import "server-only";

import { cache } from "react";
import {
  ADMISSION_DIRECTORY_QUERY,
  MAJORS_QUERY,
  SCHOLARSHIP_DIRECTORY_QUERY,
  SCHOOLS_QUERY,
  SCHOOL_QUERY,
  type AdmissionDirectoryResult,
  type MajorsQueryResult,
  type MajorsQueryVariables,
  type ScholarshipDirectoryResult,
  type SchoolQueryResult,
  type SchoolQueryVariables,
  type SchoolsQueryResult,
  type SchoolsQueryVariables,
} from "@/lib/graphql/documents";
import { fetchAllSchools } from "@/lib/graphql/fetch-all-schools";
import { createServerGraphqlClient } from "@/lib/graphql-server";
import { todayInMongolia } from "@/lib/format";

/** Runs a query, and once more if the first try fails (e.g. a dropped connection). */
async function withRetry<T extends { error?: unknown }>(run: () => Promise<T>): Promise<T> {
  const first = await run();
  return first.error ? run() : first;
}

/*
 * The homepage's data, all from the queries the other pages already use.
 * Each loader is cached for the request, so sections that need the same data
 * (the numbers, the tour previews, the featured cards) share one fetch.
 */

export const getHomeSchools = cache(async () => {
  const result = await withRetry(() =>
    createServerGraphqlClient()
      .query<SchoolsQueryResult, SchoolsQueryVariables>(SCHOOLS_QUERY, { filter: { limit: 50 } })
      .toPromise(),
  );
  return {
    schools: result.data?.schools.items ?? [],
    total: result.data?.schools.pageInfo.totalCount ?? null,
    error: result.error ?? null,
  };
});

/** How many majors there are; asks for one item and reads the total. */
export const getMajorCount = cache(async () => {
  const result = await withRetry(() =>
    createServerGraphqlClient()
      .query<MajorsQueryResult, MajorsQueryVariables>(MAJORS_QUERY, { filter: { limit: 1 } })
      .toPromise(),
  );
  return result.data?.majors.pageInfo.totalCount ?? null;
});

type ScholarshipSchool = ScholarshipDirectoryResult["schools"]["items"][number];
type AdmissionSchool = AdmissionDirectoryResult["schools"]["items"][number];

export const getScholarshipDirectory = cache(async () => {
  const { items, error } = await withRetry(() =>
    fetchAllSchools<ScholarshipSchool>(createServerGraphqlClient(), SCHOLARSHIP_DIRECTORY_QUERY),
  );
  const entries = items.flatMap((school) =>
    school.scholarships.map((scholarship) => ({ scholarship, school })),
  );
  return { entries, total: error ? null : entries.length };
});

/** Admission events that haven't ended yet, soonest first. */
export const getUpcomingAdmissions = cache(async () => {
  const { items } = await fetchAllSchools<AdmissionSchool>(
    createServerGraphqlClient(),
    ADMISSION_DIRECTORY_QUERY,
  );
  const today = todayInMongolia();
  return items
    .flatMap((school) => school.admissionSchedules.map((schedule) => ({ schedule, school })))
    .filter(({ schedule }) => {
      const lastDay = (schedule.endDate ?? schedule.startDate)?.slice(0, 10);
      return lastDay != null && lastDay >= today;
    })
    .sort((a, b) =>
      (a.schedule.startDate ?? a.schedule.endDate ?? "").localeCompare(
        b.schedule.startDate ?? b.schedule.endDate ?? "",
      ),
    );
});

export const getSchoolDetail = cache(async (id: string) => {
  const result = await withRetry(() =>
    createServerGraphqlClient()
      .query<SchoolQueryResult, SchoolQueryVariables>(SCHOOL_QUERY, { id })
      .toPromise(),
  );
  return result.data?.school ?? null;
});
