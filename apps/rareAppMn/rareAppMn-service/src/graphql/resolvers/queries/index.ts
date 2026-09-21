import { and, asc, eq, ilike, inArray } from 'drizzle-orm';

import {
  admissionRequirements,
  admissionRequirementSubjects,
  faculties,
  programs,
  subjects,
  universities,
  users,
} from '../../../db';
import type { GraphQLContext } from '../../../types';
import { clampLimit, normalizeOffset } from '../helpers';

export interface PaginationArgs {
  limit?: number | null;
  offset?: number | null;
}

export interface UniversitiesArgs extends PaginationArgs {
  search?: string;
  type?: string;
  location?: string;
  isActive?: boolean;
}

export interface ProgramsArgs extends PaginationArgs {
  search?: string;
  universityId?: string;
  facultyId?: string;
  degree?: string;
  isActive?: boolean;
}

export interface AdmissionRequirementsArgs {
  programId?: string;
  academicYear?: number;
}

export interface SubjectScoreInput {
  subjectId: string;
  score: number;
}

export interface EligibleProgramsArgs extends PaginationArgs {
  scores: SubjectScoreInput[];
  academicYear?: number;
  universityId?: string;
}

export const queryResolvers = {
  universities: async (_parent: unknown, args: UniversitiesArgs, { db }: GraphQLContext) => {
    const conditions = [];
    if (args.search) conditions.push(ilike(universities.name, `%${args.search}%`));
    if (args.type) conditions.push(eq(universities.type, args.type));
    if (args.location) conditions.push(ilike(universities.location, `%${args.location}%`));
    if (typeof args.isActive === 'boolean') conditions.push(eq(universities.isActive, args.isActive));

    let query = db
      .select()
      .from(universities)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(asc(universities.name))
      .$dynamic();

    const limit = clampLimit(args.limit);
    const offset = normalizeOffset(args.offset);
    if (limit !== undefined) query = query.limit(limit);
    if (offset !== undefined) query = query.offset(offset);

    return query;
  },

  university: async (_parent: unknown, args: { id: string }, { db }: GraphQLContext) => {
    const [result] = await db.select().from(universities).where(eq(universities.id, args.id));
    return result ?? null;
  },

  compareUniversities: async (_parent: unknown, args: { ids: string[] }, { db }: GraphQLContext) => {
    if (args.ids.length === 0) return [];
    return db.select().from(universities).where(inArray(universities.id, args.ids));
  },

  faculties: async (
    _parent: unknown,
    args: { universityId?: string },
    { db }: GraphQLContext,
  ) => {
    if (args.universityId) {
      return db.select().from(faculties).where(eq(faculties.universityId, args.universityId));
    }
    return db.select().from(faculties);
  },

  faculty: async (_parent: unknown, args: { id: string }, { db }: GraphQLContext) => {
    const [result] = await db.select().from(faculties).where(eq(faculties.id, args.id));
    return result ?? null;
  },

  programs: async (_parent: unknown, args: ProgramsArgs, { db }: GraphQLContext) => {
    const conditions = [];
    if (args.search) conditions.push(ilike(programs.name, `%${args.search}%`));
    if (args.universityId) conditions.push(eq(programs.universityId, args.universityId));
    if (args.facultyId) conditions.push(eq(programs.facultyId, args.facultyId));
    if (args.degree) conditions.push(eq(programs.degree, args.degree));
    if (typeof args.isActive === 'boolean') conditions.push(eq(programs.isActive, args.isActive));

    let query = db
      .select()
      .from(programs)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(asc(programs.name))
      .$dynamic();

    const limit = clampLimit(args.limit);
    const offset = normalizeOffset(args.offset);
    if (limit !== undefined) query = query.limit(limit);
    if (offset !== undefined) query = query.offset(offset);

    return query;
  },

  program: async (_parent: unknown, args: { id: string }, { db }: GraphQLContext) => {
    const [result] = await db.select().from(programs).where(eq(programs.id, args.id));
    return result ?? null;
  },

  programsByUniversity: async (
    _parent: unknown,
    args: { universityId: string },
    { db }: GraphQLContext,
  ) => {
    return db.select().from(programs).where(eq(programs.universityId, args.universityId));
  },

  programsByFaculty: async (
    _parent: unknown,
    args: { facultyId: string },
    { db }: GraphQLContext,
  ) => {
    return db.select().from(programs).where(eq(programs.facultyId, args.facultyId));
  },

  comparePrograms: async (_parent: unknown, args: { ids: string[] }, { db }: GraphQLContext) => {
    if (args.ids.length === 0) return [];
    return db.select().from(programs).where(inArray(programs.id, args.ids));
  },

  admissionRequirements: async (
    _parent: unknown,
    args: AdmissionRequirementsArgs,
    { db }: GraphQLContext,
  ) => {
    const conditions = [];
    if (args.programId) conditions.push(eq(admissionRequirements.programId, args.programId));
    if (args.academicYear !== undefined && args.academicYear !== null) {
      conditions.push(eq(admissionRequirements.academicYear, String(args.academicYear)));
    }

    return db
      .select()
      .from(admissionRequirements)
      .where(conditions.length ? and(...conditions) : undefined);
  },

  admissionRequirement: async (_parent: unknown, args: { id: string }, { db }: GraphQLContext) => {
    const [result] = await db
      .select()
      .from(admissionRequirements)
      .where(eq(admissionRequirements.id, args.id));
    return result ?? null;
  },

  subjects: async (_parent: unknown, args: { search?: string }, { db }: GraphQLContext) => {
    if (args.search) {
      return db.select().from(subjects).where(ilike(subjects.name, `%${args.search}%`));
    }
    return db.select().from(subjects);
  },

  subject: async (_parent: unknown, args: { id: string }, { db }: GraphQLContext) => {
    const [result] = await db.select().from(subjects).where(eq(subjects.id, args.id));
    return result ?? null;
  },

  /**
   * See the `eligiblePrograms` SDL doc comment (admission.ts) for the exact
   * eligibility semantics this implements and what it deliberately doesn't
   * infer beyond the current schema.
   */
  eligiblePrograms: async (
    _parent: unknown,
    args: EligibleProgramsArgs,
    { db }: GraphQLContext,
  ) => {
    const conditions = [];
    if (args.academicYear !== undefined && args.academicYear !== null) {
      conditions.push(eq(admissionRequirements.academicYear, String(args.academicYear)));
    }
    if (args.universityId) conditions.push(eq(programs.universityId, args.universityId));

    const rows = await db
      .select({
        admissionRequirementId: admissionRequirements.id,
        programId: admissionRequirements.programId,
        minimumScore: admissionRequirements.minimumScore,
        subjectId: admissionRequirementSubjects.subjectId,
      })
      .from(admissionRequirements)
      .innerJoin(programs, eq(admissionRequirements.programId, programs.id))
      .innerJoin(
        admissionRequirementSubjects,
        eq(admissionRequirementSubjects.admissionRequirementId, admissionRequirements.id),
      )
      .where(conditions.length ? and(...conditions) : undefined);

    const byRequirement = new Map<
      string,
      { programId: string; minimumScore: number | null; subjectIds: string[] }
    >();
    for (const row of rows) {
      const entry = byRequirement.get(row.admissionRequirementId) ?? {
        programId: row.programId,
        minimumScore: row.minimumScore,
        subjectIds: [],
      };
      entry.subjectIds.push(row.subjectId);
      byRequirement.set(row.admissionRequirementId, entry);
    }

    const scoreBySubjectId = new Map(args.scores.map((entry) => [entry.subjectId, entry.score]));
    const eligibleProgramIds = new Set<string>();
    for (const { programId, minimumScore, subjectIds } of byRequirement.values()) {
      const satisfied = subjectIds.every((subjectId) => {
        const score = scoreBySubjectId.get(subjectId);
        if (score === undefined) return false;
        return minimumScore === null || score >= minimumScore;
      });
      if (satisfied) eligibleProgramIds.add(programId);
    }

    if (eligibleProgramIds.size === 0) return [];

    let query = db
      .select()
      .from(programs)
      .where(inArray(programs.id, [...eligibleProgramIds]))
      .orderBy(asc(programs.name))
      .$dynamic();

    const limit = clampLimit(args.limit);
    const offset = normalizeOffset(args.offset);
    if (limit !== undefined) query = query.limit(limit);
    if (offset !== undefined) query = query.offset(offset);

    return query;
  },

  users: async (_parent: unknown, _args: unknown, { db }: GraphQLContext) => {
    return db.select().from(users);
  },

  user: async (_parent: unknown, args: { id: string }, { db }: GraphQLContext) => {
    const [result] = await db.select().from(users).where(eq(users.id, args.id));
    return result ?? null;
  },
};
