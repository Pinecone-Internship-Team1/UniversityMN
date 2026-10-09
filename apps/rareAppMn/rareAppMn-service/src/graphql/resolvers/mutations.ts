import { and, eq } from 'drizzle-orm';
import type { GraphQLError } from 'graphql';
import type { GraphQLContext } from '../../context';
import { requireAdmin, requireUser } from '../../context';
import {
  faculties,
  majors,
  savedMajors,
  savedSchools,
  schools,
  users,
  type NewUser,
} from '../../db/schema';
import { fetchClerkPrimaryEmail } from '../../lib/auth';
import {
  MAX_LONG_TEXT_LENGTH,
  badInput,
  conflict,
  forbidden,
  isForeignKeyConstraintError,
  isUniqueConstraintError,
  notFound,
  optionalEmail,
  optionalNonNegativeNumber,
  optionalText,
  optionalUrl,
  parseEmail,
  parsePhoneList,
  parsePreferences,
  parseScores,
  parseSubjectList,
  requiredText,
} from '../../lib/validate';

export interface UserProfileInput {
  name?: string | null;
  avatarUrl?: string | null;
  scores?: unknown;
  preferences?: unknown;
}

export interface SchoolInput {
  name: string;
  logoUrl?: string | null;
  coverUrl?: string | null;
  location?: string | null;
  tuitionFee?: number | null;
  tuitionText?: string | null;
  dormAvailable?: boolean | null;
  scholarshipAvailable?: boolean | null;
  overview?: string | null;
  website?: string | null;
  phones?: string[] | null;
  email?: string | null;
}

export interface FacultyInput {
  schoolId: string;
  name: string;
  location?: string | null;
}

export interface MajorInput {
  facultyId: string;
  name: string;
  category?: string | null;
  requiredSubjects?: unknown;
  primarySubjects?: string[] | null;
  secondarySubjects?: string[] | null;
  examNote?: string | null;
  cutOffScore?: number | null;
  degreeType?: string | null;
  tuitionFee?: number | null;
  tuitionIsEstimate?: boolean | null;
}

async function requireInternalUser(context: GraphQLContext) {
  const authUser = requireUser(context);
  const user = await context.loaders.userByClerkUserId.load(authUser.clerkUserId);
  if (!user) throw notFound('User', 'Call syncClerkUser before performing this action.');
  return user;
}

async function translateConstraintErrors<T>(
  operation: PromiseLike<T>,
  errors: { unique?: GraphQLError; foreignKey?: GraphQLError }
): Promise<T> {
  try {
    return await operation;
  } catch (error) {
    if (errors.unique && isUniqueConstraintError(error)) throw errors.unique;
    if (errors.foreignKey && isForeignKeyConstraintError(error)) throw errors.foreignKey;
    throw error;
  }
}

function schoolValues(input: SchoolInput) {
  return {
    name: requiredText(input.name, 'School name'),
    logoUrl: optionalUrl(input.logoUrl, 'logoUrl'),
    coverUrl: optionalUrl(input.coverUrl, 'coverUrl'),
    location: optionalText(input.location, 'location'),
    tuitionFee: optionalNonNegativeNumber(input.tuitionFee, 'tuitionFee'),
    tuitionText: optionalText(input.tuitionText, 'tuitionText'),
    dormAvailable: input.dormAvailable ?? null,
    scholarshipAvailable: input.scholarshipAvailable ?? null,
    overview: optionalText(input.overview, 'overview', MAX_LONG_TEXT_LENGTH),
    website: optionalUrl(input.website, 'website'),
    phones: parsePhoneList(input.phones, 'phones'),
    email: optionalEmail(input.email, 'email'),
  };
}

function facultyValues(input: FacultyInput) {
  return {
    schoolId: input.schoolId,
    name: requiredText(input.name, 'Faculty name'),
    location: optionalText(input.location, 'location'),
  };
}

function majorValues(input: MajorInput) {
  return {
    facultyId: input.facultyId,
    name: requiredText(input.name, 'Major name'),
    category: optionalText(input.category, 'category'),
    requiredSubjects: parseSubjectList(input.requiredSubjects, 'requiredSubjects'),
    primarySubjects: parseSubjectList(input.primarySubjects, 'primarySubjects'),
    secondarySubjects: parseSubjectList(input.secondarySubjects, 'secondarySubjects'),
    examNote: optionalText(input.examNote, 'examNote', MAX_LONG_TEXT_LENGTH),
    cutOffScore: optionalNonNegativeNumber(input.cutOffScore, 'cutOffScore'),
    degreeType: optionalText(input.degreeType, 'degreeType'),
    tuitionFee: optionalNonNegativeNumber(input.tuitionFee, 'tuitionFee'),
    tuitionIsEstimate: input.tuitionIsEstimate ?? false,
  };
}

async function requireFaculty(facultyId: string, context: GraphQLContext) {
  const faculty = await context.loaders.facultyById.load(facultyId);
  if (!faculty) throw notFound('Faculty');
  return faculty;
}

const duplicateFaculty = () => conflict('This university already has a faculty with that name.');
const facultyHasMajors = () => conflict('Delete the majors in this faculty first.');

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
    let email = parseEmail(args.email);
    const name = optionalText(args.name, 'name');
    const avatarUrl = optionalUrl(args.avatarUrl, 'avatarUrl');

    const existing = await context.loaders.userByClerkUserId.load(authUser.clerkUserId);
    if (existing?.email !== email) {
      const verifiedEmail = await fetchClerkPrimaryEmail(authUser.clerkUserId, context.env);
      if (verifiedEmail === null) throw badInput('Your account does not have an email address.');
      if (verifiedEmail !== undefined) email = verifiedEmail;
    }

    const [synced] = await translateConstraintErrors(
      context.db
        .insert(users)
        .values({
          clerkUserId: authUser.clerkUserId,
          email,
          name,
          avatarUrl,
          role: authUser.role,
        })
        .onConflictDoUpdate({
          target: users.clerkUserId,
          set: {
            email,
            role: authUser.role,
            ...(name !== null ? { name } : {}),
            ...(avatarUrl !== null ? { avatarUrl } : {}),
            updatedAt: new Date().toISOString(),
          },
        })
        .returning(),
      { unique: conflict('This email address is already linked to another account.') }
    );
    context.loaders.userByClerkUserId.clear(authUser.clerkUserId);
    return synced;
  },

  updateUserProfile: async (
    _parent: unknown,
    args: { input: UserProfileInput },
    context: GraphQLContext
  ) => {
    const user = await requireInternalUser(context);
    const { input } = args;

    const changes: Partial<NewUser> = { updatedAt: new Date().toISOString() };
    if (input.name !== undefined) changes.name = optionalText(input.name, 'name');
    if (input.avatarUrl !== undefined) changes.avatarUrl = optionalUrl(input.avatarUrl, 'avatarUrl');
    if (input.scores !== undefined) {
      changes.scores = input.scores === null ? null : parseScores(input.scores);
    }
    if (input.preferences !== undefined) {
      changes.preferences = input.preferences === null ? null : parsePreferences(input.preferences);
    }

    const [updated] = await context.db
      .update(users)
      .set(changes)
      .where(eq(users.id, user.id))
      .returning();
    context.loaders.userByClerkUserId.clear(user.clerkUserId);
    if (!updated) throw notFound('User');
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

    context.loaders.savedSchoolIdsByUserId.clear(user.id);

    const removed = await context.db
      .delete(savedSchools)
      .where(and(eq(savedSchools.userId, user.id), eq(savedSchools.schoolId, args.schoolId)))
      .returning({ id: savedSchools.id });
    if (removed.length) return false;

    await translateConstraintErrors(
      context.db
        .insert(savedSchools)
        .values({ userId: user.id, schoolId: args.schoolId })
        .onConflictDoNothing(),
      { foreignKey: notFound('School') }
    );
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

    context.loaders.savedMajorIdsByUserId.clear(user.id);

    const removed = await context.db
      .delete(savedMajors)
      .where(and(eq(savedMajors.userId, user.id), eq(savedMajors.majorId, args.majorId)))
      .returning({ id: savedMajors.id });
    if (removed.length) return false;

    await translateConstraintErrors(
      context.db
        .insert(savedMajors)
        .values({ userId: user.id, majorId: args.majorId })
        .onConflictDoNothing(),
      { foreignKey: notFound('Major') }
    );
    return true;
  },

  createSchool: async (
    _parent: unknown,
    args: { input: SchoolInput },
    context: GraphQLContext
  ) => {
    requireAdmin(context);
    const [created] = await context.db.insert(schools).values(schoolValues(args.input)).returning();
    return created;
  },

  updateSchool: async (
    _parent: unknown,
    args: { id: string; input: SchoolInput },
    context: GraphQLContext
  ) => {
    requireAdmin(context);
    const [updated] = await context.db
      .update(schools)
      .set(schoolValues(args.input))
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

  createFaculty: async (
    _parent: unknown,
    args: { input: FacultyInput },
    context: GraphQLContext
  ) => {
    requireAdmin(context);
    const values = facultyValues(args.input);

    const school = await context.loaders.schoolById.load(values.schoolId);
    if (!school) throw notFound('School');

    const [created] = await translateConstraintErrors(
      context.db.insert(faculties).values(values).returning(),
      { unique: duplicateFaculty(), foreignKey: notFound('School') }
    );
    context.loaders.facultiesBySchoolId.clear(values.schoolId);
    return created;
  },

  updateFaculty: async (
    _parent: unknown,
    args: { id: string; input: FacultyInput },
    context: GraphQLContext
  ) => {
    requireAdmin(context);
    const values = facultyValues(args.input);

    const existing = await requireFaculty(args.id, context);
    if (existing.schoolId !== values.schoolId) {
      throw badInput('A faculty cannot be moved to another university.');
    }

    const [updated] = await translateConstraintErrors(
      context.db
        .update(faculties)
        .set({ name: values.name, location: values.location })
        .where(eq(faculties.id, args.id))
        .returning(),
      { unique: duplicateFaculty() }
    );
    context.loaders.facultyById.clear(args.id);
    context.loaders.facultiesBySchoolId.clear(existing.schoolId);
    if (!updated) throw notFound('Faculty');
    return updated;
  },

  deleteFaculty: async (_parent: unknown, args: { id: string }, context: GraphQLContext) => {
    requireAdmin(context);
    const [major] = await context.db
      .select({ id: majors.id })
      .from(majors)
      .where(eq(majors.facultyId, args.id))
      .limit(1);
    if (major) throw facultyHasMajors();

    const [deleted] = await translateConstraintErrors(
      context.db.delete(faculties).where(eq(faculties.id, args.id)).returning(),
      { foreignKey: facultyHasMajors() }
    );
    context.loaders.facultyById.clear(args.id);
    if (!deleted) throw notFound('Faculty');
    context.loaders.facultiesBySchoolId.clear(deleted.schoolId);
    return true;
  },

  createMajor: async (
    _parent: unknown,
    args: { input: MajorInput },
    context: GraphQLContext
  ) => {
    requireAdmin(context);
    const values = majorValues(args.input);
    const faculty = await requireFaculty(values.facultyId, context);

    const [created] = await translateConstraintErrors(
      context.db
        .insert(majors)
        .values({ ...values, schoolId: faculty.schoolId })
        .returning(),
      { foreignKey: notFound('Faculty') }
    );
    context.loaders.majorsBySchoolId.clear(faculty.schoolId);
    return created;
  },

  updateMajor: async (
    _parent: unknown,
    args: { id: string; input: MajorInput },
    context: GraphQLContext
  ) => {
    requireAdmin(context);
    const values = majorValues(args.input);

    const existing = await context.loaders.majorById.load(args.id);
    if (!existing) throw notFound('Major');
    const faculty = await requireFaculty(values.facultyId, context);

    const [updated] = await translateConstraintErrors(
      context.db
        .update(majors)
        .set({ ...values, schoolId: faculty.schoolId })
        .where(eq(majors.id, args.id))
        .returning(),
      { foreignKey: notFound('Faculty') }
    );
    context.loaders.majorById.clear(args.id);
    context.loaders.majorsBySchoolId.clear(existing.schoolId).clear(faculty.schoolId);
    if (!updated) throw notFound('Major');
    return updated;
  },

  deleteMajor: async (_parent: unknown, args: { id: string }, context: GraphQLContext) => {
    requireAdmin(context);
    const [deleted] = await context.db.delete(majors).where(eq(majors.id, args.id)).returning();
    context.loaders.majorById.clear(args.id);
    if (!deleted) throw notFound('Major');
    context.loaders.majorsBySchoolId.clear(deleted.schoolId);
    return true;
  },
};
