import DataLoader from 'dataloader';
import { inArray } from 'drizzle-orm';
import type { Database } from '../db';
import {
  admissionSchedules,
  dormitories,
  majors,
  savedMajors,
  savedSchools,
  scholarships,
  schools,
  users,
  type AdmissionSchedule,
  type Dormitory,
  type Major,
  type Scholarship,
  type School,
  type User,
} from '../db/schema';

function groupBy<T, K extends string>(rows: T[], keyOf: (row: T) => K): Map<K, T[]> {
  const grouped = new Map<K, T[]>();
  for (const row of rows) {
    const key = keyOf(row);
    const bucket = grouped.get(key);
    if (bucket) bucket.push(row);
    else grouped.set(key, [row]);
  }
  return grouped;
}

/**
 * Per-request DataLoader batch loaders. A fresh instance must be created for
 * every GraphQL request (see `context.ts`) so caches never leak across users.
 */
export function createLoaders(db: Database) {
  const schoolById = new DataLoader<string, School | null>(async (ids) => {
    const rows = await db.select().from(schools).where(inArray(schools.id, ids as string[]));
    const byId = new Map(rows.map((row) => [row.id, row]));
    return ids.map((id) => byId.get(id) ?? null);
  });

  const majorById = new DataLoader<string, Major | null>(async (ids) => {
    const rows = await db.select().from(majors).where(inArray(majors.id, ids as string[]));
    const byId = new Map(rows.map((row) => [row.id, row]));
    return ids.map((id) => byId.get(id) ?? null);
  });

  const majorsBySchoolId = new DataLoader<string, Major[]>(async (schoolIds) => {
    const rows = await db
      .select()
      .from(majors)
      .where(inArray(majors.schoolId, schoolIds as string[]));
    const bySchool = groupBy(rows, (row) => row.schoolId);
    return schoolIds.map((id) => bySchool.get(id) ?? []);
  });

  const scholarshipsBySchoolId = new DataLoader<string, Scholarship[]>(async (schoolIds) => {
    const rows = await db
      .select()
      .from(scholarships)
      .where(inArray(scholarships.schoolId, schoolIds as string[]));
    const bySchool = groupBy(rows, (row) => row.schoolId);
    return schoolIds.map((id) => bySchool.get(id) ?? []);
  });

  const dormitoriesBySchoolId = new DataLoader<string, Dormitory[]>(async (schoolIds) => {
    const rows = await db
      .select()
      .from(dormitories)
      .where(inArray(dormitories.schoolId, schoolIds as string[]));
    const bySchool = groupBy(rows, (row) => row.schoolId);
    return schoolIds.map((id) => bySchool.get(id) ?? []);
  });

  const admissionSchedulesBySchoolId = new DataLoader<string, AdmissionSchedule[]>(
    async (schoolIds) => {
      const rows = await db
        .select()
        .from(admissionSchedules)
        .where(inArray(admissionSchedules.schoolId, schoolIds as string[]));
      const bySchool = groupBy(rows, (row) => row.schoolId);
      return schoolIds.map((id) => bySchool.get(id) ?? []);
    }
  );

  const savedSchoolIdsByUserId = new DataLoader<string, Set<string>>(async (userIds) => {
    const rows = await db
      .select()
      .from(savedSchools)
      .where(inArray(savedSchools.userId, userIds as string[]));
    const byUser = groupBy(rows, (row) => row.userId);
    return userIds.map((id) => new Set((byUser.get(id) ?? []).map((row) => row.schoolId)));
  });

  const savedMajorIdsByUserId = new DataLoader<string, Set<string>>(async (userIds) => {
    const rows = await db
      .select()
      .from(savedMajors)
      .where(inArray(savedMajors.userId, userIds as string[]));
    const byUser = groupBy(rows, (row) => row.userId);
    return userIds.map((id) => new Set((byUser.get(id) ?? []).map((row) => row.majorId)));
  });

  const userByClerkUserId = new DataLoader<string, User | null>(async (clerkUserIds) => {
    const rows = await db
      .select()
      .from(users)
      .where(inArray(users.clerkUserId, clerkUserIds as string[]));
    const byClerkUserId = new Map(rows.map((row) => [row.clerkUserId, row]));
    return clerkUserIds.map((id) => byClerkUserId.get(id) ?? null);
  });

  return {
    schoolById,
    majorById,
    majorsBySchoolId,
    scholarshipsBySchoolId,
    dormitoriesBySchoolId,
    admissionSchedulesBySchoolId,
    savedSchoolIdsByUserId,
    savedMajorIdsByUserId,
    userByClerkUserId,
  };
}

export type Loaders = ReturnType<typeof createLoaders>;
