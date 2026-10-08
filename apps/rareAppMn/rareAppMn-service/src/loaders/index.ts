import DataLoader from 'dataloader';
import { asc, inArray } from 'drizzle-orm';
import type { Database } from '../db';
import {
  admissionSchedules,
  dormitories,
  faculties,
  majors,
  savedMajors,
  savedSchools,
  scholarships,
  schools,
  users,
  type AdmissionSchedule,
  type Dormitory,
  type Faculty,
  type Major,
  type Scholarship,
  type School,
  type User,
} from '../db/schema';

const D1_MAX_BOUND_PARAMETERS = 100;

function batchLoader<V>(load: (keys: readonly string[]) => Promise<V[]>) {
  return new DataLoader<string, V>(load, { maxBatchSize: D1_MAX_BOUND_PARAMETERS });
}

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
  const schoolById = batchLoader<School | null>(async (ids) => {
    const rows = await db.select().from(schools).where(inArray(schools.id, ids as string[]));
    const byId = new Map(rows.map((row) => [row.id, row]));
    return ids.map((id) => byId.get(id) ?? null);
  });

  const facultyById = batchLoader<Faculty | null>(async (ids) => {
    const rows = await db.select().from(faculties).where(inArray(faculties.id, ids as string[]));
    const byId = new Map(rows.map((row) => [row.id, row]));
    return ids.map((id) => byId.get(id) ?? null);
  });

  const facultiesBySchoolId = batchLoader<Faculty[]>(async (schoolIds) => {
    const rows = await db
      .select()
      .from(faculties)
      .where(inArray(faculties.schoolId, schoolIds as string[]))
      .orderBy(asc(faculties.createdAt), asc(faculties.name));
    const bySchool = groupBy(rows, (row) => row.schoolId);
    return schoolIds.map((id) => bySchool.get(id) ?? []);
  });

  const majorById = batchLoader<Major | null>(async (ids) => {
    const rows = await db.select().from(majors).where(inArray(majors.id, ids as string[]));
    const byId = new Map(rows.map((row) => [row.id, row]));
    return ids.map((id) => byId.get(id) ?? null);
  });

  const majorsBySchoolId = batchLoader<Major[]>(async (schoolIds) => {
    const rows = await db
      .select()
      .from(majors)
      .where(inArray(majors.schoolId, schoolIds as string[]));
    const bySchool = groupBy(rows, (row) => row.schoolId);
    return schoolIds.map((id) => bySchool.get(id) ?? []);
  });

  const scholarshipsBySchoolId = batchLoader<Scholarship[]>(async (schoolIds) => {
    const rows = await db
      .select()
      .from(scholarships)
      .where(inArray(scholarships.schoolId, schoolIds as string[]));
    const bySchool = groupBy(rows, (row) => row.schoolId);
    return schoolIds.map((id) => bySchool.get(id) ?? []);
  });

  const dormitoriesBySchoolId = batchLoader<Dormitory[]>(async (schoolIds) => {
    const rows = await db
      .select()
      .from(dormitories)
      .where(inArray(dormitories.schoolId, schoolIds as string[]));
    const bySchool = groupBy(rows, (row) => row.schoolId);
    return schoolIds.map((id) => bySchool.get(id) ?? []);
  });

  const admissionSchedulesBySchoolId = batchLoader<AdmissionSchedule[]>(
    async (schoolIds) => {
      const rows = await db
        .select()
        .from(admissionSchedules)
        .where(inArray(admissionSchedules.schoolId, schoolIds as string[]));
      const bySchool = groupBy(rows, (row) => row.schoolId);
      return schoolIds.map((id) => bySchool.get(id) ?? []);
    }
  );

  const savedSchoolIdsByUserId = batchLoader<Set<string>>(async (userIds) => {
    const rows = await db
      .select({ userId: savedSchools.userId, schoolId: savedSchools.schoolId })
      .from(savedSchools)
      .where(inArray(savedSchools.userId, userIds as string[]));
    const byUser = groupBy(rows, (row) => row.userId);
    return userIds.map((id) => new Set((byUser.get(id) ?? []).map((row) => row.schoolId)));
  });

  const savedMajorIdsByUserId = batchLoader<Set<string>>(async (userIds) => {
    const rows = await db
      .select({ userId: savedMajors.userId, majorId: savedMajors.majorId })
      .from(savedMajors)
      .where(inArray(savedMajors.userId, userIds as string[]));
    const byUser = groupBy(rows, (row) => row.userId);
    return userIds.map((id) => new Set((byUser.get(id) ?? []).map((row) => row.majorId)));
  });

  const userByClerkUserId = batchLoader<User | null>(async (clerkUserIds) => {
    const rows = await db
      .select()
      .from(users)
      .where(inArray(users.clerkUserId, clerkUserIds as string[]));
    const byClerkUserId = new Map(rows.map((row) => [row.clerkUserId, row]));
    return clerkUserIds.map((id) => byClerkUserId.get(id) ?? null);
  });

  return {
    schoolById,
    facultyById,
    facultiesBySchoolId,
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
