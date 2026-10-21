import { and, count, countDistinct, desc, eq, gte, inArray, lte, or, sql, type SQL } from 'drizzle-orm';
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';
import type { GraphQLContext } from '../../context';
import { requireAdmin, requireUser } from '../../context';
import { faculties, majors, pageViews, schools, users, type Major, type School } from '../../db/schema';
import { MAX_SCORE_SUBJECTS, badInput, isPlainObject, notFound, parseScores } from '../../lib/validate';
import { foldSearchText, parseSearch, type SearchQuery } from '../../lib/search';
import { hasRelevantScores, scoreMajorMatch } from '../../lib/scoreMatch';
import { clampStatsDays, dayRange, ulaanbaatarDay } from '../../lib/siteStats';

type Region = 'ULAANBAATAR' | 'OUTSIDE_ULAANBAATAR';

/** Most universities are in Ulaanbaatar, so a missing location counts as Ulaanbaatar. */
function isInUlaanbaatar(location: string | null | undefined): boolean {
  return !location || /улаанбаатар|ulaanbaatar/i.test(location);
}

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

/**
 * Folded search text (src/lib/search.ts) is plain lowercase ASCII words, so it
 * never holds a LIKE wildcard; the phrase is cut to the same byte budget.
 */
function foldedPhrase(search: SearchQuery): string {
  return search.folded.slice(0, MAX_LIKE_TERM_BYTES);
}

/** Rows with every folded word of one reading of the search, e.g. `programm hangamj`. */
function hasFoldedWords(search: SearchQuery, wordMatches: (word: string) => SQL | undefined): SQL {
  return or(...search.readings.map((words) => and(...words.map(wordMatches)))) ?? sql`0`;
}

/** Majors of the universities that have this folded alias (МУИС → `muis`). */
function majorOfSchoolWithAlias(alias: string): SQL {
  return sql`${majors.schoolId} in (select ${schools.id} from ${schools} where ${schools.searchAliases} like ${`%|${alias}|%`})`;
}

/**
 * Cyrillic: the name contains the text, as before, or the text is one of the
 * university's aliases (МУИС). Latin: every typed word is in the folded name
 * or aliases ("muis", "mongol ulsiin ih surguuli").
 */
function schoolSearchCondition(search: SearchQuery | null): SQL | undefined {
  if (!search) return undefined;
  if (search.cyrillic) {
    const phrase = foldedPhrase(search);
    return or(
      containsText(schools.name, search.text),
      phrase ? sql`${schools.searchAliases} like ${`%|${phrase}|%`}` : undefined
    );
  }
  return hasFoldedWords(search, (word) => sql`${schools.searchText} like ${`%${word}%`}`);
}

/** Exact alias first, then an alias that starts with the text, then a name word that does. */
function schoolSearchRank(search: SearchQuery): SQL {
  const phrase = foldedPhrase(search);
  return sql`case
    when ${schools.searchAliases} like ${`%|${phrase}|%`} then 0
    when ${schools.searchAliases} like ${`%|${phrase}%`} then 1
    when ' ' || ${schools.searchText} like ${`% ${phrase}%`} then 2
    else 3 end`;
}

/** Majors in a faculty whose folded name has this word ("huuli" → Хууль зүйн сургууль). */
function majorInFacultyWith(word: string): SQL {
  return sql`${majors.facultyId} in (select ${faculties.id} from ${faculties} where ${faculties.searchText} like ${`%${word}%`})`;
}

/**
 * Cyrillic: the name contains the text, as before, or one word is a
 * university's alias and the name contains the rest ("МУИС программ"). Latin:
 * every typed word is in the folded name, in the faculty's name, or is the
 * university's alias ("programm hangamj", "huuli", "muis programm").
 */
function majorSearchCondition(search: SearchQuery | null): SQL | undefined {
  if (!search) return undefined;
  if (search.cyrillic) {
    const words = search.text.split(/\s+/).slice(0, 5);
    return or(
      containsText(majors.name, search.text),
      ...words.map((word, index) => {
        const alias = foldSearchText(word).slice(0, MAX_LIKE_TERM_BYTES);
        if (!alias) return undefined;
        const rest = words.filter((_word, other) => other !== index).join(' ');
        return and(majorOfSchoolWithAlias(alias), containsText(majors.name, rest));
      })
    );
  }
  return hasFoldedWords(search, (word) =>
    or(sql`${majors.searchText} like ${`%${word}%`}`, majorInFacultyWith(word), majorOfSchoolWithAlias(word))
  );
}

/**
 * For a Cyrillic search no major name matches: majors whose faculty name has
 * the text ("хууль" → Хууль зүйн сургууль's "Эрх зүй"). Searches that match
 * names keep exactly their old results.
 */
function majorFacultyFallback(search: SearchQuery): SQL | undefined {
  const facultyName = containsText(faculties.name, search.text);
  return facultyName
    ? sql`${majors.facultyId} in (select ${faculties.id} from ${faculties} where ${facultyName})`
    : undefined;
}

/**
 * The exact name first, then the university's majors when the text is its
 * alias, then names that start with it, then names that have it; majors found
 * only by their faculty's name come last.
 */
function majorSearchRank(search: SearchQuery): SQL {
  const phrase = foldedPhrase(search);
  return sql`case
    when ${majors.searchText} = ${phrase} then 0
    when ${majorOfSchoolWithAlias(phrase)} then 1
    when ' ' || ${majors.searchText} like ${`% ${phrase}%`} then 2
    when ${majors.searchText} like ${`%${phrase}%`} then 3
    else 4 end`;
}

/**
 * A university's majors matching `value` the way `Query.majors` matches them,
 * best first; all of them (unsorted) when `value` is empty.
 */
export async function searchSchoolMajors(
  context: GraphQLContext,
  schoolId: string,
  value: string | null | undefined
): Promise<Major[]> {
  const search = parseSearch(value);
  if (!search) return context.loaders.majorsBySchoolId.load(schoolId);
  const find = (condition: SQL | undefined) =>
    context.db
      .select()
      .from(majors)
      .where(and(eq(majors.schoolId, schoolId), condition))
      .orderBy(majorSearchRank(search), sql`${majors}.rowid`);
  const rows = await find(majorSearchCondition(search));
  const fallback = search.cyrillic && rows.length === 0 ? majorFacultyFallback(search) : undefined;
  return fallback ? find(fallback) : rows;
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

export interface UserFilterInput extends PaginationInput {
  search?: string | null;
  role?: 'STUDENT' | 'ADMIN' | null;
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

  users: async (
    _parent: unknown,
    args: { filter?: UserFilterInput | null },
    context: GraphQLContext
  ) => {
    requireAdmin(context);
    const filter = args.filter ?? {};
    const { limit, offset } = clampPagination(filter);

    const whereClause = and(
      or(
        containsText(users.name, filter.search),
        containsText(users.email, filter.search),
        containsText(users.clerkUserId, filter.search)
      ),
      filter.role ? eq(users.role, filter.role === 'ADMIN' ? 'admin' : 'student') : undefined
    );

    const [items, totalRows] = await context.db.batch([
      context.db
        .select()
        .from(users)
        .where(whereClause)
        .orderBy(desc(users.createdAt), sql`${users}.rowid`)
        .limit(limit)
        .offset(offset),
      context.db.select({ value: count() }).from(users).where(whereClause),
    ]);
    const totalCount = totalRows[0]?.value ?? 0;

    return {
      items,
      pageInfo: { totalCount, limit, offset, hasNextPage: offset + items.length < totalCount },
    };
  },

  siteStats: async (_parent: unknown, args: { days?: number | null }, context: GraphQLContext) => {
    requireAdmin(context);
    const days = dayRange(clampStatsDays(args.days), ulaanbaatarDay(new Date()));
    const from = days[0] as string;
    const to = days[days.length - 1] as string;
    const inRange = and(gte(pageViews.day, from), lte(pageViews.day, to));
    const viewCount = count();

    const [totals, today, daily, topPages] = await context.db.batch([
      context.db
        .select({
          views: count(),
          visitors: countDistinct(pageViews.visitorId),
          signedInViews: sql<number>`coalesce(sum(${pageViews.signedIn}), 0)`.mapWith(Number),
        })
        .from(pageViews)
        .where(inRange),
      context.db
        .select({ views: count(), visitors: countDistinct(pageViews.visitorId) })
        .from(pageViews)
        .where(eq(pageViews.day, to)),
      context.db
        .select({ day: pageViews.day, views: count(), visitors: countDistinct(pageViews.visitorId) })
        .from(pageViews)
        .where(inRange)
        .groupBy(pageViews.day),
      context.db
        .select({ path: pageViews.path, views: viewCount })
        .from(pageViews)
        .where(inRange)
        .groupBy(pageViews.path)
        .orderBy(desc(viewCount), pageViews.path)
        .limit(10),
    ]);

    const byDay = new Map(daily.map((row) => [row.day, row]));
    return {
      from,
      to,
      views: totals[0]?.views ?? 0,
      visitors: totals[0]?.visitors ?? 0,
      signedInViews: totals[0]?.signedInViews ?? 0,
      todayViews: today[0]?.views ?? 0,
      todayVisitors: today[0]?.visitors ?? 0,
      daily: days.map((day) => ({
        day,
        views: byDay.get(day)?.views ?? 0,
        visitors: byDay.get(day)?.visitors ?? 0,
      })),
      topPages,
    };
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
    const search = parseSearch(filter.search);

    const conditions: (SQL | undefined)[] = [
      schoolSearchCondition(search),
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
        .orderBy(...(search ? [schoolSearchRank(search)] : []), sql`${schools}.rowid`)
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
    const search = parseSearch(filter.search);

    const conditions: (SQL | undefined)[] = [
      equalsText(majors.category, filter.category),
      equalsText(majors.degreeType, filter.degreeType),
    ];
    if (filter.schoolId) conditions.push(eq(majors.schoolId, filter.schoolId));
    if (typeof filter.minCutOffScore === 'number') {
      conditions.push(gte(majors.cutOffScore, filter.minCutOffScore));
    }
    if (typeof filter.maxCutOffScore === 'number') {
      conditions.push(lte(majors.cutOffScore, filter.maxCutOffScore));
    }

    const page = async (searchCondition: SQL | undefined) => {
      const whereClause = and(...conditions, searchCondition);
      const [items, totalRows] = await context.db.batch([
        context.db
          .select()
          .from(majors)
          .where(whereClause)
          .orderBy(...(search ? [majorSearchRank(search)] : []), sql`${majors}.rowid`)
          .limit(limit)
          .offset(offset),
        context.db.select({ value: count() }).from(majors).where(whereClause),
      ]);
      return { items, totalCount: totalRows[0]?.value ?? 0 };
    };

    let { items, totalCount } = await page(majorSearchCondition(search));
    if (search?.cyrillic && totalCount === 0) {
      const fallback = majorFacultyFallback(search);
      if (fallback) ({ items, totalCount } = await page(fallback));
    }

    return {
      items,
      pageInfo: { totalCount, limit, offset, hasNextPage: offset + items.length < totalCount },
    };
  },

  personalizedRecommendations: async (
    _parent: unknown,
    args: { limit?: number | null; region?: Region | null },
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
          ? or(
              ...[majors.requiredSubjects, majors.primarySubjects, majors.secondarySubjects].map(
                (column) =>
                  sql`exists (select 1 from json_each(${column}) where ${inArray(sql`json_each.value`, scoredSubjects)})`
              )
            )
          : undefined
      )
      .orderBy(sql`${majors}.rowid`);

    const scored = candidates
      .filter((major) => hasRelevantScores(major, scores))
      .map((major) => ({ major, ...scoreMajorMatch(major, scores) }));

    // Loaders dedupe ids, so this is one lookup per university / faculty, not per major.
    const [scoredSchools, scoredFaculties] = await Promise.all([
      Promise.all(scored.map((entry) => context.loaders.schoolById.load(entry.major.schoolId))),
      Promise.all(
        scored.map((entry) =>
          args.region && entry.major.facultyId
            ? context.loaders.facultyById.load(entry.major.facultyId)
            : null
        )
      ),
    ]);

    // Branch schools have lower cut-offs (e.g. 430 vs 490), so ranking them
    // together with Ulaanbaatar would always put branches first.
    return scored
      .flatMap((entry, index) => {
        const school = scoredSchools[index];
        if (!school) return [];
        if (args.region) {
          const location = scoredFaculties[index]?.location ?? school.location;
          if (isInUlaanbaatar(location) !== (args.region === 'ULAANBAATAR')) return [];
        }
        return [{ school, ...entry }];
      })
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
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
