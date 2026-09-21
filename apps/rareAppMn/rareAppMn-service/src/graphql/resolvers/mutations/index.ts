import { eq, inArray } from 'drizzle-orm';

import {
  admissionRequirements,
  admissionRequirementSubjects,
  faculties,
  programs,
  subjects,
  universities,
  users,
} from '../../../db';
import type { Database } from '../../../db';
import type { GraphQLContext } from '../../../types';
import { badInputError, notFoundError, runSafely } from '../helpers';

// Fields backed by a NOT NULL column (`name`, `degree`, `academicYear`,
// `isActive`) are typed without `| null`: they're optional-to-provide on
// update (meaning "leave unchanged"), but the schema forbids clearing them,
// so an explicit `null` is treated as caller error rather than a valid value.

export interface CreateUniversityInput {
  name: string;
  shortName?: string | null;
  description?: string | null;
  logo?: string | null;
  website?: string | null;
  type?: string | null;
  location?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  foundedYear?: number | null;
  isActive?: boolean;
}

export type UpdateUniversityInput = Partial<CreateUniversityInput>;

export interface CreateFacultyInput {
  universityId: string;
  name: string;
  description?: string | null;
}

export interface UpdateFacultyInput {
  name?: string;
  description?: string | null;
}

export interface CreateProgramInput {
  universityId: string;
  facultyId: string;
  name: string;
  degree: string;
  duration?: string | null;
  description?: string | null;
  language?: string | null;
  isActive?: boolean;
}

export interface UpdateProgramInput {
  name?: string;
  degree?: string;
  duration?: string | null;
  description?: string | null;
  language?: string | null;
  isActive?: boolean;
}

export interface UpsertUserInput {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
  role?: string | null;
}

export interface CreateSubjectInput {
  name: string;
}

export interface UpdateSubjectInput {
  name: string;
}

export interface CreateAdmissionRequirementInput {
  programId: string;
  academicYear: string;
  minimumScore?: number | null;
  description?: string | null;
  subjectIds?: string[] | null;
}

export interface UpdateAdmissionRequirementInput {
  academicYear?: string;
  minimumScore?: number | null;
  description?: string | null;
  subjectIds?: string[] | null;
}

async function requireUniversity(db: Database, id: string) {
  const [university] = await db.select().from(universities).where(eq(universities.id, id));
  if (!university) throw notFoundError('University', id);
  return university;
}

async function requireFaculty(db: Database, id: string) {
  const [faculty] = await db.select().from(faculties).where(eq(faculties.id, id));
  if (!faculty) throw notFoundError('Faculty', id);
  return faculty;
}

async function requireProgram(db: Database, id: string) {
  const [program] = await db.select().from(programs).where(eq(programs.id, id));
  if (!program) throw notFoundError('Program', id);
  return program;
}

async function requireAdmissionRequirement(db: Database, id: string) {
  const [admissionRequirement] = await db
    .select()
    .from(admissionRequirements)
    .where(eq(admissionRequirements.id, id));
  if (!admissionRequirement) throw notFoundError('AdmissionRequirement', id);
  return admissionRequirement;
}

async function requireSubject(db: Database, id: string) {
  const [subject] = await db.select().from(subjects).where(eq(subjects.id, id));
  if (!subject) throw notFoundError('Subject', id);
  return subject;
}

async function ensureSubjectNameAvailable(db: Database, name: string, excludeId?: string) {
  const existing = await db.select().from(subjects).where(eq(subjects.name, name));
  const conflict = existing.find((subject) => subject.id !== excludeId);
  if (conflict) throw badInputError(`Subject "${name}" already exists.`);
}

/** Validates every id resolves to a real Subject and returns them. */
async function requireSubjects(db: Database, subjectIds: string[]) {
  if (subjectIds.length === 0) return [];
  const found = await db.select().from(subjects).where(inArray(subjects.id, subjectIds));
  if (found.length !== new Set(subjectIds).size) {
    const foundIds = new Set(found.map((subject) => subject.id));
    const missing = subjectIds.filter((id) => !foundIds.has(id));
    throw badInputError(`Unknown subject id(s): ${missing.join(', ')}`);
  }
  return found;
}

async function replaceAdmissionRequirementSubjects(
  db: Database,
  admissionRequirementId: string,
  subjectIds: string[],
) {
  await requireSubjects(db, subjectIds);
  await db
    .delete(admissionRequirementSubjects)
    .where(eq(admissionRequirementSubjects.admissionRequirementId, admissionRequirementId));
  if (subjectIds.length > 0) {
    await db.insert(admissionRequirementSubjects).values(
      subjectIds.map((subjectId) => ({ admissionRequirementId, subjectId })),
    );
  }
}

export const mutationResolvers = {
  upsertUser: async (
    _parent: unknown,
    { input }: { input: UpsertUserInput },
    { db }: GraphQLContext,
  ) => {
    if (!input.email.trim()) throw badInputError('Email must not be empty.');

    return runSafely(async () => {
      const [user] = await db
        .insert(users)
        .values({
          id: input.id,
          email: input.email,
          firstName: input.firstName ?? null,
          lastName: input.lastName ?? null,
          imageUrl: input.imageUrl ?? null,
          role: input.role ?? 'user',
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            email: input.email,
            firstName: input.firstName ?? null,
            lastName: input.lastName ?? null,
            imageUrl: input.imageUrl ?? null,
            ...(input.role ? { role: input.role } : {}),
            updatedAt: new Date(),
          },
        })
        .returning();
      return user;
    }, 'Failed to upsert user.');
  },

  deleteUser: async (_parent: unknown, { id }: { id: string }, { db }: GraphQLContext) => {
    return runSafely(async () => {
      const deleted = await db.delete(users).where(eq(users.id, id)).returning();
      return deleted.length > 0;
    }, 'Failed to delete user.');
  },

  createUniversity: async (
    _parent: unknown,
    { input }: { input: CreateUniversityInput },
    { db }: GraphQLContext,
  ) => {
    if (!input.name.trim()) throw badInputError('University name must not be empty.');

    return runSafely(async () => {
      const [university] = await db.insert(universities).values(input).returning();
      return university;
    }, 'Failed to create university.');
  },

  updateUniversity: async (
    _parent: unknown,
    { id, input }: { id: string; input: UpdateUniversityInput },
    { db }: GraphQLContext,
  ) => {
    await requireUniversity(db, id);
    if (input.name !== undefined && !input.name.trim()) {
      throw badInputError('University name must not be empty.');
    }

    return runSafely(async () => {
      const [university] = await db
        .update(universities)
        .set(input)
        .where(eq(universities.id, id))
        .returning();
      return university;
    }, 'Failed to update university.');
  },

  deleteUniversity: async (_parent: unknown, { id }: { id: string }, { db }: GraphQLContext) => {
    await requireUniversity(db, id);
    return runSafely(async () => {
      const deleted = await db.delete(universities).where(eq(universities.id, id)).returning();
      return deleted.length > 0;
    }, 'Failed to delete university.');
  },

  createFaculty: async (
    _parent: unknown,
    { input }: { input: CreateFacultyInput },
    { db }: GraphQLContext,
  ) => {
    if (!input.name.trim()) throw badInputError('Faculty name must not be empty.');
    await requireUniversity(db, input.universityId);

    return runSafely(async () => {
      const [faculty] = await db.insert(faculties).values(input).returning();
      return faculty;
    }, 'Failed to create faculty.');
  },

  updateFaculty: async (
    _parent: unknown,
    { id, input }: { id: string; input: UpdateFacultyInput },
    { db }: GraphQLContext,
  ) => {
    await requireFaculty(db, id);
    if (input.name !== undefined && !input.name.trim()) {
      throw badInputError('Faculty name must not be empty.');
    }

    return runSafely(async () => {
      const [faculty] = await db.update(faculties).set(input).where(eq(faculties.id, id)).returning();
      return faculty;
    }, 'Failed to update faculty.');
  },

  deleteFaculty: async (_parent: unknown, { id }: { id: string }, { db }: GraphQLContext) => {
    await requireFaculty(db, id);
    return runSafely(async () => {
      const deleted = await db.delete(faculties).where(eq(faculties.id, id)).returning();
      return deleted.length > 0;
    }, 'Failed to delete faculty.');
  },

  createProgram: async (
    _parent: unknown,
    { input }: { input: CreateProgramInput },
    { db }: GraphQLContext,
  ) => {
    if (!input.name.trim()) throw badInputError('Program name must not be empty.');
    if (!input.degree.trim()) throw badInputError('Program degree must not be empty.');

    await requireUniversity(db, input.universityId);
    const faculty = await requireFaculty(db, input.facultyId);
    if (faculty.universityId !== input.universityId) {
      throw badInputError(
        `Faculty "${input.facultyId}" does not belong to university "${input.universityId}".`,
      );
    }

    return runSafely(async () => {
      const [program] = await db.insert(programs).values(input).returning();
      return program;
    }, 'Failed to create program.');
  },

  updateProgram: async (
    _parent: unknown,
    { id, input }: { id: string; input: UpdateProgramInput },
    { db }: GraphQLContext,
  ) => {
    await requireProgram(db, id);
    if (input.name !== undefined && !input.name.trim()) {
      throw badInputError('Program name must not be empty.');
    }
    if (input.degree !== undefined && !input.degree.trim()) {
      throw badInputError('Program degree must not be empty.');
    }

    return runSafely(async () => {
      const [program] = await db.update(programs).set(input).where(eq(programs.id, id)).returning();
      return program;
    }, 'Failed to update program.');
  },

  deleteProgram: async (_parent: unknown, { id }: { id: string }, { db }: GraphQLContext) => {
    await requireProgram(db, id);
    return runSafely(async () => {
      const deleted = await db.delete(programs).where(eq(programs.id, id)).returning();
      return deleted.length > 0;
    }, 'Failed to delete program.');
  },

  createSubject: async (
    _parent: unknown,
    { input }: { input: CreateSubjectInput },
    { db }: GraphQLContext,
  ) => {
    if (!input.name.trim()) throw badInputError('Subject name must not be empty.');
    await ensureSubjectNameAvailable(db, input.name);

    return runSafely(async () => {
      const [subject] = await db.insert(subjects).values(input).returning();
      return subject;
    }, 'Failed to create subject.');
  },

  updateSubject: async (
    _parent: unknown,
    { id, input }: { id: string; input: UpdateSubjectInput },
    { db }: GraphQLContext,
  ) => {
    await requireSubject(db, id);
    if (!input.name.trim()) throw badInputError('Subject name must not be empty.');
    await ensureSubjectNameAvailable(db, input.name, id);

    return runSafely(async () => {
      const [subject] = await db.update(subjects).set(input).where(eq(subjects.id, id)).returning();
      return subject;
    }, 'Failed to update subject.');
  },

  deleteSubject: async (_parent: unknown, { id }: { id: string }, { db }: GraphQLContext) => {
    await requireSubject(db, id);
    return runSafely(async () => {
      const deleted = await db.delete(subjects).where(eq(subjects.id, id)).returning();
      return deleted.length > 0;
    }, 'Failed to delete subject.');
  },

  createAdmissionRequirement: async (
    _parent: unknown,
    { input }: { input: CreateAdmissionRequirementInput },
    { db }: GraphQLContext,
  ) => {
    if (!input.academicYear.trim()) throw badInputError('Academic year must not be empty.');
    await requireProgram(db, input.programId);
    const subjectIds = input.subjectIds ?? [];
    await requireSubjects(db, subjectIds);

    return runSafely(async () => {
      const { subjectIds: _ignored, ...values } = input;
      const [admissionRequirement] = await db
        .insert(admissionRequirements)
        .values(values)
        .returning();

      if (subjectIds.length > 0) {
        await db.insert(admissionRequirementSubjects).values(
          subjectIds.map((subjectId) => ({
            admissionRequirementId: admissionRequirement.id,
            subjectId,
          })),
        );
      }

      return admissionRequirement;
    }, 'Failed to create admission requirement.');
  },

  updateAdmissionRequirement: async (
    _parent: unknown,
    { id, input }: { id: string; input: UpdateAdmissionRequirementInput },
    { db }: GraphQLContext,
  ) => {
    let admissionRequirement = await requireAdmissionRequirement(db, id);
    if (input.academicYear !== undefined && !input.academicYear.trim()) {
      throw badInputError('Academic year must not be empty.');
    }

    return runSafely(async () => {
      const { subjectIds, ...values } = input;
      if (Object.keys(values).length > 0) {
        [admissionRequirement] = await db
          .update(admissionRequirements)
          .set(values)
          .where(eq(admissionRequirements.id, id))
          .returning();
      }

      if (subjectIds !== undefined && subjectIds !== null) {
        await replaceAdmissionRequirementSubjects(db, id, subjectIds);
      }

      return admissionRequirement;
    }, 'Failed to update admission requirement.');
  },

  deleteAdmissionRequirement: async (
    _parent: unknown,
    { id }: { id: string },
    { db }: GraphQLContext,
  ) => {
    await requireAdmissionRequirement(db, id);
    return runSafely(async () => {
      const deleted = await db
        .delete(admissionRequirements)
        .where(eq(admissionRequirements.id, id))
        .returning();
      return deleted.length > 0;
    }, 'Failed to delete admission requirement.');
  },
};
