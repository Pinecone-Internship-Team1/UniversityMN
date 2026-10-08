import { and, count, eq, gte, inArray, lte, or, sql, type SQL } from 'drizzle-orm';
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';
import type { GraphQLContext } from '../../context';
import { requireAdmin, requireUser } from '../../context';
import { majors, schools, type Major, type School } from '../../db/schema';
import { MAX_SCORE_SUBJECTS, badInput, isPlainObject, notFound, parseScores } from '../../lib/validate';
import { hasRelevantScores, scoreMajorMatch } from '../../lib/scoreMatch';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const DEFAULT_RECOMMENDATIONS_LIMIT = 10;
const MAX_RECOMMENDATIONS_LIMIT = 50;
const MAX_COMPARE_ITEMS = 10;

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
const LIKE_SPECIAL_CHARACTERS = new Set(['%', '_', '\\']);
const utf8Encoder = new TextEncoder();

function escapeLikeTerm(value: string): string {
  let escaped = '';
  let bytes = 0;
  for (const character of value) {
    const piece = LIKE_SPECIAL_CHARACTERS.has(character) ? `\\${character}` : character;
    const size = utf8Encoder.encode(piece).length;
    if (bytes + size > MAX_LIKE_TERM_BYTES) break;
    escaped += piece;
    bytes += size;
  }
  return escaped;
}

function caseVariants(value: string): string[] {
  const lower = value.toLowerCase();
  return [
    ...new Set([
      value,
      lower,
      value.toUpperCase(),
      lower.replace(/^\p{Ll}/u, (letter) => letter.toUpperCase()),
      lower.replace(/(^|\s)(\p{Ll})/gu, (_match, prefix: string, letter: string) => prefix + letter.toUpperCase()),
    ]),
  ];
}

function containsText(column: SQLiteColumn, value: string | null | undefined): SQL | undefined {
  const term = value?.trim();
  if (!term) return undefined;
  const patterns = new Set(caseVariants(term).map((variant) => `%${escapeLikeTerm(variant)}%`));
  return or(...[...patterns].map((pattern) => sql`${column} like ${pattern} escape '\\'`));
}

function equalsText(column: SQLiteColumn, value: string | null | undefined): SQL | undefined {
  const term = value?.trim();
  if (!term) return undefined;
  return inArray(column, caseVariants(term));
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
  me: (_parent: unknown, _args: unknown, context: GraphQLContext) => resolveInternalUser(context),

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

    const conditions: (SQL | undefined)[] = [
      containsText(schools.name, filter.search),
      containsText(schools.location, filter.location),
    ];
    if (typeof filter.dormAvailable === 'boolean') {
      conditions.push(eq(schools.dormAvailable, filter.dormAvailable));
    }
    if (typeof filter.scholarshipAvailable === 'boolean') {
      conditions.push(eq(schools.scholarshipAvailable, filter.scholarshipAvailable));
    }
    if (typeof filter.maxTuitionFee === 'number') {
      conditions.push(lte(schools.tuitionFee, filter.maxTuitionFee));
    }
    const whereClause = and(...conditions);

    const [items, totalRows] = await context.db.batch([
      context.db
        .select()
        .from(schools)
        .where(whereClause)
        .orderBy(sql`${schools}.rowid`)
        .limit(limit)
        .offset(offset),
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

    const conditions: (SQL | undefined)[] = [
      equalsText(majors.category, filter.category),
      equalsText(majors.degreeType, filter.degreeType),
      containsText(majors.name, filter.search),
    ];
    if (filter.schoolId) conditions.push(eq(majors.schoolId, filter.schoolId));
    if (typeof filter.minCutOffScore === 'number') {
      conditions.push(gte(majors.cutOffScore, filter.minCutOffScore));
    }
    if (typeof filter.maxCutOffScore === 'number') {
      conditions.push(lte(majors.cutOffScore, filter.maxCutOffScore));
    }
    const whereClause = and(...conditions);

    const [items, totalRows] = await context.db.batch([
      context.db
        .select()
        .from(majors)
        .where(whereClause)
        .orderBy(sql`${majors}.rowid`)
        .limit(limit)
        .offset(offset),
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

    const scores: Record<string, number> = isPlainObject(user.scores) ? user.scores : {};
    const scoredSubjects = Object.keys(scores).filter(
      (subject) => typeof scores[subject] === 'number'
    );
    if (scoredSubjects.length === 0) return [];

    const limit = Math.min(
      Math.max(args.limit ?? DEFAULT_RECOMMENDATIONS_LIMIT, 1),
      MAX_RECOMMENDATIONS_LIMIT
    );
    const candidates = await context.db
      .select()
      .from(majors)
      .where(
        scoredSubjects.length <= MAX_SCORE_SUBJECTS
          ? sql`exists (select 1 from json_each(${majors.requiredSubjects}) where ${inArray(sql`json_each.value`, scoredSubjects)})`
          : undefined
      )
      .orderBy(sql`${majors}.rowid`);

    const ranked = candidates
      .filter((major) => hasRelevantScores(major, scores))
      .map((major) => ({ major, ...scoreMajorMatch(major, scores) }))
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);

    const rankedSchools = await Promise.all(
      ranked.map((entry) => context.loaders.schoolById.load(entry.major.schoolId))
    );

    return ranked.flatMap((entry, index) => {
      const school = rankedSchools[index];
      return school ? [{ school, ...entry }] : [];
    });
  },

  analyzeScoreMatch: async (
    _parent: unknown,
    args: { majorId: string; scores: unknown },
    context: GraphQLContext
  ) => {
    const scores = parseScores(args.scores);

    const major = await context.loaders.majorById.load(args.majorId);
    if (!major) throw notFound('Major');

    const school = await context.loaders.schoolById.load(major.schoolId);
    if (!school) throw notFound('School');

    return { school, major, ...scoreMajorMatch(major, scores) };
  },

  compareItems: async (
    _parent: unknown,
    args: { ids: string[]; type: 'SCHOOL' | 'MAJOR' },
    context: GraphQLContext
  ) => {
    const ids = [...new Set(args.ids)];
    if (ids.length > MAX_COMPARE_ITEMS) {
      throw badInput(`You can compare at most ${MAX_COMPARE_ITEMS} items at once.`);
    }

    if (args.type === 'SCHOOL') {
      const rows = await Promise.all(ids.map((id) => context.loaders.schoolById.load(id)));
      return rows
        .filter((row): row is School => row !== null)
        .map((row) => ({ ...row, __typename: 'School' as const }));
    }

    const rows = await Promise.all(ids.map((id) => context.loaders.majorById.load(id)));
    return rows
      .filter((row): row is Major => row !== null)
      .map((row) => ({ ...row, __typename: 'Major' as const }));
  },
};
