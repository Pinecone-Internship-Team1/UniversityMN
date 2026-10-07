import { and, count, eq, gte, inArray, like, lte, sql } from 'drizzle-orm';
import type { GraphQLContext } from '../../context';
import { requireAdmin, requireUser } from '../../context';
import { majors, schools } from '../../db/schema';
import { badInput, notFound } from '../../lib/validate';
import { scoreMajorMatch } from '../../lib/scoreMatch';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const DEFAULT_RECOMMENDATIONS_LIMIT = 10;
const MAX_RECOMMENDATIONS_LIMIT = 50;

/**
 * D1/SQLite rejects `LIKE` patterns above a certain complexity with
 * "LIKE or GLOB pattern too complex: SQLITE_ERROR". Empirically (tested
 * directly against the local D1 simulator) the cutoff is a *byte* length,
 * not a character count: a full `%<term>%` pattern of 50 UTF-8 bytes
 * passes, 51 fails. Multi-byte text (e.g. Cyrillic, 2 bytes/char) therefore
 * hits the limit at a much shorter character count than ASCII.
 *
 * Any `search`/`location` filter term is clamped to a conservative byte
 * budget before being wrapped in `%...%` so no input can ever trigger it,
 * without ever splitting a multi-byte character mid-sequence.
 */
const MAX_LIKE_TERM_BYTES = 40;

function clampLikeTerm(value: string): string {
  const encoded = new TextEncoder().encode(value);
  if (encoded.length <= MAX_LIKE_TERM_BYTES) return value;
  const truncated = encoded.slice(0, MAX_LIKE_TERM_BYTES);
  // A truncated multi-byte sequence decodes as trailing U+FFFD replacement
  // characters; strip them so the pattern stays valid, human-readable text.
  return new TextDecoder('utf-8', { fatal: false })
    .decode(truncated)
    .replace(/�+$/u, '');
}

interface PaginationInput {
  limit?: number | null;
  offset?: number | null;
}

function clampPagination(input: PaginationInput | null | undefined) {
  const limit = Math.min(Math.max(input?.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);
  const offset = Math.max(input?.offset ?? 0, 0);
  return { limit, offset };
}

export interface SchoolFilterInput extends PaginationInput {
  search?: string | null;
  location?: string | null;
  dormAvailable?: boolean | null;
  scholarshipAvailable?: boolean | null;
  maxTuitionFee?: number | null;
}

export interface MajorFilterInput extends PaginationInput {
  schoolId?: string | null;
  category?: string | null;
  degreeType?: string | null;
  search?: string | null;
  minCutOffScore?: number | null;
  maxCutOffScore?: number | null;
}

async function resolveInternalUser(context: GraphQLContext) {
  const authUser = requireUser(context);
  return context.loaders.userByClerkUserId.load(authUser.clerkUserId);
}

export const queries = {
  me: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
    requireUser(context);
    return resolveInternalUser(context);
  },

  userByClerkId: async (
    _parent: unknown,
    args: { clerkUserId: string },
    context: GraphQLContext
  ) => {
    requireAdmin(context);
    return context.loaders.userByClerkUserId.load(args.clerkUserId);
  },

  school: async (_parent: unknown, args: { id: string }, context: GraphQLContext) => {
    return context.loaders.schoolById.load(args.id);
  },

  schools: async (
    _parent: unknown,
    args: { filter?: SchoolFilterInput | null },
    context: GraphQLContext
  ) => {
    const filter = args.filter ?? {};
    const { limit, offset } = clampPagination(filter);

    const conditions = [];
    if (filter.search) {
      conditions.push(like(schools.name, `%${clampLikeTerm(filter.search)}%`));
    }
    if (filter.location) {
      conditions.push(like(schools.location, `%${clampLikeTerm(filter.location)}%`));
    }
    if (typeof filter.dormAvailable === 'boolean') {
      conditions.push(eq(schools.dormAvailable, filter.dormAvailable));
    }
    if (typeof filter.scholarshipAvailable === 'boolean') {
      conditions.push(eq(schools.scholarshipAvailable, filter.scholarshipAvailable));
    }
    if (typeof filter.maxTuitionFee === 'number') {
      conditions.push(lte(schools.tuitionFee, filter.maxTuitionFee));
    }
    const whereClause = and(...conditions) ?? sql`1 = 1`;

    const [items, totalRows] = await Promise.all([
      context.db.select().from(schools).where(whereClause).limit(limit).offset(offset),
      context.db.select({ value: count() }).from(schools).where(whereClause),
    ]);
    const totalCount = totalRows[0]?.value ?? 0;

    return {
      items,
      pageInfo: { totalCount, limit, offset, hasNextPage: offset + items.length < totalCount },
    };
  },

  major: async (_parent: unknown, args: { id: string }, context: GraphQLContext) => {
    return context.loaders.majorById.load(args.id);
  },

  majors: async (
    _parent: unknown,
    args: { filter?: MajorFilterInput | null },
    context: GraphQLContext
  ) => {
    const filter = args.filter ?? {};
    const { limit, offset } = clampPagination(filter);

    const conditions = [];
    if (filter.schoolId) conditions.push(eq(majors.schoolId, filter.schoolId));
    if (filter.category) conditions.push(eq(majors.category, filter.category));
    if (filter.degreeType) conditions.push(eq(majors.degreeType, filter.degreeType));
    if (filter.search) {
      conditions.push(like(majors.name, `%${clampLikeTerm(filter.search)}%`));
    }
    if (typeof filter.minCutOffScore === 'number') {
      conditions.push(gte(majors.cutOffScore, filter.minCutOffScore));
    }
    if (typeof filter.maxCutOffScore === 'number') {
      conditions.push(lte(majors.cutOffScore, filter.maxCutOffScore));
    }
    const whereClause = and(...conditions) ?? sql`1 = 1`;

    const [items, totalRows] = await Promise.all([
      context.db.select().from(majors).where(whereClause).limit(limit).offset(offset),
      context.db.select({ value: count() }).from(majors).where(whereClause),
    ]);
    const totalCount = totalRows[0]?.value ?? 0;

    return {
      items,
      pageInfo: { totalCount, limit, offset, hasNextPage: offset + items.length < totalCount },
    };
  },

  personalizedRecommendations: async (
    _parent: unknown,
    args: { limit?: number | null },
    context: GraphQLContext
  ) => {
    const user = await resolveInternalUser(context);
    if (!user) {
      throw notFound('User', 'Sync your profile with syncClerkUser before requesting recommendations.');
    }

    const scores = user.scores ?? {};
    const allMajors = await context.db.select().from(majors);
    const limit = Math.min(
      Math.max(args.limit ?? DEFAULT_RECOMMENDATIONS_LIMIT, 1),
      MAX_RECOMMENDATIONS_LIMIT
    );

    const ranked = allMajors
      .map((major) => ({ major, ...scoreMajorMatch(major, scores) }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

    const schoolIds = [...new Set(ranked.map((entry) => entry.major.schoolId))];
    const schoolRows = schoolIds.length
      ? await context.db.select().from(schools).where(inArray(schools.id, schoolIds))
      : [];
    const schoolsById = new Map(schoolRows.map((row) => [row.id, row]));

    return ranked
      .filter((entry) => schoolsById.has(entry.major.schoolId))
      .map((entry) => ({
        school: schoolsById.get(entry.major.schoolId),
        major: entry.major,
        matchScore: entry.matchScore,
        eligible: entry.eligible,
        reason: entry.reason,
      }));
  },

  analyzeScoreMatch: async (
    _parent: unknown,
    args: { majorId: string; scores: unknown },
    context: GraphQLContext
  ) => {
    if (typeof args.scores !== 'object' || args.scores === null || Array.isArray(args.scores)) {
      throw badInput('scores must be a JSON object mapping subject names to numeric scores.');
    }

    const major = await context.loaders.majorById.load(args.majorId);
    if (!major) throw notFound('Major');

    const school = await context.loaders.schoolById.load(major.schoolId);
    if (!school) throw notFound('School');

    const outcome = scoreMajorMatch(major, args.scores as Record<string, number>);
    return { school, major, ...outcome };
  },

  compareItems: async (
    _parent: unknown,
    args: { ids: string[]; type: 'SCHOOL' | 'MAJOR' },
    context: GraphQLContext
  ) => {
    if (!args.ids.length) return [];

    if (args.type === 'SCHOOL') {
      const rows = await context.db.select().from(schools).where(inArray(schools.id, args.ids));
      return rows.map((row) => ({ ...row, __typename: 'School' as const }));
    }

    const rows = await context.db.select().from(majors).where(inArray(majors.id, args.ids));
    return rows.map((row) => ({ ...row, __typename: 'Major' as const }));
  },
};
