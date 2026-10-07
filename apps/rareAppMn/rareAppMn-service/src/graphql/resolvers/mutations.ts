import { and, eq } from 'drizzle-orm';
import type { GraphQLContext } from '../../context';
import { requireAdmin, requireUser } from '../../context';
import { majors, savedMajors, savedSchools, schools, users } from '../../db/schema';
import { badInput, forbidden, notFound } from '../../lib/validate';

export interface UserProfileInput {
  name?: string | null;
  avatarUrl?: string | null;
  scores?: Record<string, number> | null;
  preferences?: Record<string, unknown> | null;
}

export interface SchoolInput {
  name: string;
  logoUrl?: string | null;
  coverUrl?: string | null;
  location?: string | null;
  tuitionFee?: number | null;
  dormAvailable?: boolean | null;
  scholarshipAvailable?: boolean | null;
  overview?: string | null;
  website?: string | null;
}

export interface MajorInput {
  schoolId: string;
  name: string;
  category?: string | null;
  requiredSubjects?: string[] | null;
  cutOffScore?: number | null;
  degreeType?: string | null;
  tuitionFee?: number | null;
}

async function requireInternalUser(context: GraphQLContext) {
  const authUser = requireUser(context);
  const user = await context.loaders.userByClerkUserId.load(authUser.clerkUserId);
  if (!user) throw notFound('User', 'Call syncClerkUser before performing this action.');
  return user;
}

export const mutations = {
  syncClerkUser: async (
    _parent: unknown,
    args: { clerkUserId: string; email: string; name?: string | null; avatarUrl?: string | null },
    context: GraphQLContext
  ) => {
    const authUser = requireUser(context);
    if (authUser.clerkUserId !== args.clerkUserId) {
      throw forbidden('You can only sync your own Clerk profile.');
    }
    if (!args.email.includes('@')) throw badInput('A valid email address is required.');

    const existing = await context.loaders.userByClerkUserId.load(args.clerkUserId);

    if (existing) {
      const [updated] = await context.db
        .update(users)
        .set({
          email: args.email,
          name: args.name ?? existing.name,
          avatarUrl: args.avatarUrl ?? existing.avatarUrl,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(users.id, existing.id))
        .returning();
      context.loaders.userByClerkUserId.clear(args.clerkUserId);
      return updated;
    }

    const [created] = await context.db
      .insert(users)
      .values({
        clerkUserId: args.clerkUserId,
        email: args.email,
        name: args.name ?? null,
        avatarUrl: args.avatarUrl ?? null,
        role: authUser.role,
      })
      .returning();
    context.loaders.userByClerkUserId.clear(args.clerkUserId);
    return created;
  },

  updateUserProfile: async (
    _parent: unknown,
    args: { input: UserProfileInput },
    context: GraphQLContext
  ) => {
    const user = await requireInternalUser(context);

    const [updated] = await context.db
      .update(users)
      .set({
        name: args.input.name ?? user.name,
        avatarUrl: args.input.avatarUrl ?? user.avatarUrl,
        scores: args.input.scores ?? user.scores,
        preferences: args.input.preferences ?? user.preferences,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, user.id))
      .returning();
    context.loaders.userByClerkUserId.clear(user.clerkUserId);
    return updated;
  },

  toggleSaveSchool: async (
    _parent: unknown,
    args: { schoolId: string },
    context: GraphQLContext
  ) => {
    const user = await requireInternalUser(context);
    const school = await context.loaders.schoolById.load(args.schoolId);
    if (!school) throw notFound('School');

    const existingRows = await context.db
      .select()
      .from(savedSchools)
      .where(and(eq(savedSchools.userId, user.id), eq(savedSchools.schoolId, args.schoolId)));

    context.loaders.savedSchoolIdsByUserId.clear(user.id);

    if (existingRows[0]) {
      await context.db.delete(savedSchools).where(eq(savedSchools.id, existingRows[0].id));
      return false;
    }

    await context.db.insert(savedSchools).values({ userId: user.id, schoolId: args.schoolId });
    return true;
  },

  toggleSaveMajor: async (
    _parent: unknown,
    args: { majorId: string },
    context: GraphQLContext
  ) => {
    const user = await requireInternalUser(context);
    const major = await context.loaders.majorById.load(args.majorId);
    if (!major) throw notFound('Major');

    const existingRows = await context.db
      .select()
      .from(savedMajors)
      .where(and(eq(savedMajors.userId, user.id), eq(savedMajors.majorId, args.majorId)));

    context.loaders.savedMajorIdsByUserId.clear(user.id);

    if (existingRows[0]) {
      await context.db.delete(savedMajors).where(eq(savedMajors.id, existingRows[0].id));
      return false;
    }

    await context.db.insert(savedMajors).values({ userId: user.id, majorId: args.majorId });
    return true;
  },

  createSchool: async (
    _parent: unknown,
    args: { input: SchoolInput },
    context: GraphQLContext
  ) => {
    requireAdmin(context);
    const name = args.input.name.trim();
    if (!name) throw badInput('School name is required.');

    const [created] = await context.db
      .insert(schools)
      .values({
        name,
        logoUrl: args.input.logoUrl ?? null,
        coverUrl: args.input.coverUrl ?? null,
        location: args.input.location ?? null,
        tuitionFee: args.input.tuitionFee ?? null,
        dormAvailable: args.input.dormAvailable ?? false,
        scholarshipAvailable: args.input.scholarshipAvailable ?? false,
        overview: args.input.overview ?? null,
        website: args.input.website ?? null,
      })
      .returning();
    return created;
  },

  updateSchool: async (
    _parent: unknown,
    args: { id: string; input: SchoolInput },
    context: GraphQLContext
  ) => {
    requireAdmin(context);
    const name = args.input.name.trim();
    if (!name) throw badInput('School name is required.');

    const [updated] = await context.db
      .update(schools)
      .set({
        name,
        logoUrl: args.input.logoUrl ?? null,
        coverUrl: args.input.coverUrl ?? null,
        location: args.input.location ?? null,
        tuitionFee: args.input.tuitionFee ?? null,
        dormAvailable: args.input.dormAvailable ?? false,
        scholarshipAvailable: args.input.scholarshipAvailable ?? false,
        overview: args.input.overview ?? null,
        website: args.input.website ?? null,
      })
      .where(eq(schools.id, args.id))
      .returning();
    context.loaders.schoolById.clear(args.id);
    if (!updated) throw notFound('School');
    return updated;
  },

  deleteSchool: async (_parent: unknown, args: { id: string }, context: GraphQLContext) => {
    requireAdmin(context);
    const [deleted] = await context.db.delete(schools).where(eq(schools.id, args.id)).returning();
    context.loaders.schoolById.clear(args.id);
    if (!deleted) throw notFound('School');
    return true;
  },

  createMajor: async (
    _parent: unknown,
    args: { input: MajorInput },
    context: GraphQLContext
  ) => {
    requireAdmin(context);
    const name = args.input.name.trim();
    if (!name) throw badInput('Major name is required.');

    const school = await context.loaders.schoolById.load(args.input.schoolId);
    if (!school) throw notFound('School');

    const [created] = await context.db
      .insert(majors)
      .values({
        schoolId: args.input.schoolId,
        name,
        category: args.input.category ?? null,
        requiredSubjects: args.input.requiredSubjects ?? null,
        cutOffScore: args.input.cutOffScore ?? null,
        degreeType: args.input.degreeType ?? null,
        tuitionFee: args.input.tuitionFee ?? null,
      })
      .returning();
    return created;
  },

  updateMajor: async (
    _parent: unknown,
    args: { id: string; input: MajorInput },
    context: GraphQLContext
  ) => {
    requireAdmin(context);
    const name = args.input.name.trim();
    if (!name) throw badInput('Major name is required.');

    const school = await context.loaders.schoolById.load(args.input.schoolId);
    if (!school) throw notFound('School');

    const [updated] = await context.db
      .update(majors)
      .set({
        schoolId: args.input.schoolId,
        name,
        category: args.input.category ?? null,
        requiredSubjects: args.input.requiredSubjects ?? null,
        cutOffScore: args.input.cutOffScore ?? null,
        degreeType: args.input.degreeType ?? null,
        tuitionFee: args.input.tuitionFee ?? null,
      })
      .where(eq(majors.id, args.id))
      .returning();
    context.loaders.majorById.clear(args.id);
    context.loaders.majorsBySchoolId.clear(args.input.schoolId);
    if (!updated) throw notFound('Major');
    return updated;
  },

  deleteMajor: async (_parent: unknown, args: { id: string }, context: GraphQLContext) => {
    requireAdmin(context);
    const [deleted] = await context.db.delete(majors).where(eq(majors.id, args.id)).returning();
    context.loaders.majorById.clear(args.id);
    if (deleted) context.loaders.majorsBySchoolId.clear(deleted.schoolId);
    if (!deleted) throw notFound('Major');
    return true;
  },
};
