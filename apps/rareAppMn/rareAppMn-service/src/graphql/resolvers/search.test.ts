import { beforeAll, describe, expect, test } from 'bun:test';
import { Database as SQLite } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GraphQLContext } from '../../context';
import type { Database } from '../../db';
import * as dbSchema from '../../db/schema';
import {
  facultySearchText,
  foldSearchText,
  majorSearchText,
  schoolSearchAliases,
  schoolSearchText,
} from '../../lib/search';
import { createLoaders } from '../../loaders';
import { resolvers } from './index';
import { mutations } from './mutations';
import { queries } from './queries';

const MIGRATIONS_DIR = join(import.meta.dir, '../../../d1');

/** Names on main: universities, faculties, and majors as [university id, faculty name, major name]. */
const CATALOG = JSON.parse(readFileSync(join(import.meta.dir, 'search.fixture.json'), 'utf8')) as {
  schools: [id: string, name: string][];
  faculties: [schoolId: string, name: string][];
  majors: [schoolId: string, faculty: string, name: string][];
};

let sqlite: SQLite;
let context: GraphQLContext;
const facultyNames = new Map<string, string>();

/**
 * Main's data: migrations up to 0009, its names, then 0010 (which adds the
 * aliases), then what data-import/backfill-search-text.mjs writes.
 */
beforeAll(() => {
  sqlite = new SQLite(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON;');
  const migrate = (keep: (file: string) => boolean) => {
    for (const file of readdirSync(MIGRATIONS_DIR).filter((name) => name.endsWith('.sql')).sort()) {
      if (!keep(file)) continue;
      for (const statement of readFileSync(join(MIGRATIONS_DIR, file), 'utf8').split('--> statement-breakpoint')) {
        if (statement.trim()) sqlite.exec(statement);
      }
    }
  };
  migrate((file) => file < '0010');
  const insertSchool = sqlite.prepare('INSERT INTO schools (id, name) VALUES (?, ?)');
  for (const [id, name] of CATALOG.schools) insertSchool.run(id, name);
  const insertFaculty = sqlite.prepare('INSERT INTO faculties (id, school_id, name) VALUES (?, ?, ?)');
  const facultyIds = new Map<string, string>();
  CATALOG.faculties.forEach(([schoolId, name], index) => {
    insertFaculty.run(`faculty_${index}`, schoolId, name);
    facultyIds.set(`${schoolId}/${name}`, `faculty_${index}`);
    facultyNames.set(`faculty_${index}`, name);
  });
  const insertMajor = sqlite.prepare('INSERT INTO majors (id, school_id, faculty_id, name) VALUES (?, ?, ?, ?)');
  CATALOG.majors.forEach(([schoolId, faculty, name], index) =>
    insertMajor.run(`major_${index}`, schoolId, facultyIds.get(`${schoolId}/${faculty}`) ?? null, name)
  );
  migrate((file) => file >= '0010');

  const schoolRows = sqlite.query('SELECT id, name, aliases FROM schools').all() as {
    id: string;
    name: string;
    aliases: string | null;
  }[];
  const updateSchool = sqlite.prepare('UPDATE schools SET search_text = ?, search_aliases = ? WHERE id = ?');
  for (const row of schoolRows) {
    const aliases = row.aliases ? (JSON.parse(row.aliases) as string[]) : null;
    updateSchool.run(schoolSearchText(row.name, aliases), schoolSearchAliases(aliases), row.id);
  }
  for (const [table, fold] of [
    ['faculties', facultySearchText],
    ['majors', majorSearchText],
  ] as const) {
    const update = sqlite.prepare(`UPDATE ${table} SET search_text = ? WHERE id = ?`);
    for (const row of sqlite.query(`SELECT id, name FROM ${table}`).all() as { id: string; name: string }[]) {
      update.run(fold(row.name), row.id);
    }
  }

  // The resolvers batch their queries, which D1 has and bun:sqlite's drizzle doesn't.
  const db = Object.assign(drizzle(sqlite, { schema: dbSchema }), {
    batch: (statements: readonly PromiseLike<unknown>[]) => Promise.all(statements),
  }) as unknown as Database;
  context = { db, loaders: createLoaders(db), user: null } as unknown as GraphQLContext;
});

interface Row {
  id: string;
  name: string;
  schoolId?: string;
  facultyId?: string | null;
}

/** A major's name and its faculty's name, lowercase. */
const majorText = (row: Row) => `${row.name} / ${facultyNames.get(row.facultyId ?? '') ?? ''}`.toLowerCase();

async function searchSchools(search: string, limit = 100): Promise<Row[]> {
  const page = await queries.schools(null, { filter: { search, limit } }, context);
  return page.items;
}

/** Every matching major, all pages. */
async function searchMajors(search: string, schoolId?: string): Promise<Row[]> {
  const rows: Row[] = [];
  for (let offset = 0; ; offset += 100) {
    const page = await queries.majors(null, { filter: { search, schoolId, limit: 100, offset } }, context);
    rows.push(...page.items);
    if (!page.pageInfo.hasNextPage) return rows;
  }
}

/** The old LIKE term: escaped and cut to 40 UTF-8 bytes (D1 rejects longer patterns). */
function oldLikeTerm(value: string): string {
  let term = '';
  for (const character of value) {
    const piece = /[%_\\]/.test(character) ? `\\${character}` : character;
    if (new TextEncoder().encode(term + piece).length > 40) break;
    term += piece;
  }
  return term;
}

/** What `search` matched before this change: the name contains the text in one of five letter cases, rowid order. */
function oldSearch(table: 'schools' | 'majors' | 'faculties', search: string): string[] {
  const term = search.trim();
  const lower = term.toLowerCase();
  const variants = [
    ...new Set([
      term,
      lower,
      term.toUpperCase(),
      lower.replace(/^\p{Ll}/u, (letter) => letter.toUpperCase()),
      lower.replace(/(^|\s)(\p{Ll})/gu, (_match, prefix: string, letter: string) => prefix + letter.toUpperCase()),
    ]),
  ].map((variant) => `%${oldLikeTerm(variant)}%`);
  const where = variants.map(() => "name LIKE ? ESCAPE '\\'").join(' OR ');
  return (sqlite.query(`SELECT id FROM ${table} WHERE ${where} ORDER BY rowid`).all(...variants) as { id: string }[]).map(
    (row) => row.id
  );
}

const ids = (rows: Row[]) => rows.map((row) => row.id);

function defined<T>(value: T | undefined): T {
  if (value === undefined) throw new Error('expected a row');
  return value;
}
const sorted = (values: string[]) => [...values].sort();

describe('school search', () => {
  test.each([
    ['muis', 'sch_muis'],
    ['MUIS', 'sch_muis'],
    ['МУИС', 'sch_muis'],
    ['NUM', 'sch_muis'],
    ['shutis', 'sch_shutis'],
    ['MUST', 'sch_shutis'],
    ['huree', 'sch_huree'],
    ['khuree', 'sch_huree'],
    ['xuree', 'sch_huree'],
    ['Хүрээ', 'sch_huree'],
    ['etugen', 'sch_etugen'],
    ['sezis', 'sch_sezis'],
    ['UFE', 'sch_sezis'],
    ['ashuuis', 'sch_ashuuis'],
    ['MNUMS', 'sch_ashuuis'],
    ['mubis', 'sch_mubis'],
    ['MNUE', 'sch_mubis'],
    ['MSUE', 'sch_mubis'],
    ['haais', 'sch_khaais'],
    ['khaais', 'sch_khaais'],
    ['MULS', 'sch_khaais'],
    ['ouubis', 'sch_iuu'],
    ['IUU', 'sch_iuu'],
    ['otgontenger', 'sch_otgontenger'],
    ['ОТИС', 'sch_otgontenger'],
    ['suis', 'sch_suis'],
    ['MSUAC', 'sch_suis'],
    ['mongol ulsiin ih surguuli', 'sch_muis'],
    ['Mongol Ulsyn Ikh Surguuli', 'sch_muis'],
    ['national university of mongolia', 'sch_muis'],
    ['shinjleh ukhaan', 'sch_shutis'],
    ['anagaah', 'sch_ashuuis'],
  ])('%p finds %p first', async (search, schoolId) => {
    const rows = await searchSchools(search);
    expect(rows[0]?.id).toBe(schoolId);
  });

  test('a short name finds just that university', async () => {
    for (const search of ['muis', 'МУИС', 'shutis', 'huree', 'etugen', 'sezis', 'ashuuis']) {
      expect([search, (await searchSchools(search)).length]).toEqual([search, 1]);
    }
  });

  test('"mongol ulsiin" finds the three "Монгол Улсын" universities', async () => {
    expect(sorted(ids(await searchSchools('mongol ulsiin')))).toEqual(['sch_mubis', 'sch_muis', 'sch_suis']);
  });

  test('a short name half typed already finds its university first', async () => {
    for (const [search, schoolId] of [
      ['sez', 'sch_sezis'],
      ['ash', 'sch_ashuuis'],
      ['hur', 'sch_huree'],
      ['etug', 'sch_etugen'],
      ['shut', 'sch_shutis'],
    ]) {
      expect([search, (await searchSchools(search))[0]?.id]).toEqual([search, schoolId]);
    }
  });

  test('text with no letters finds nothing', async () => {
    expect(await searchSchools('***')).toEqual([]);
  });
});

describe('major search', () => {
  test.each([
    ['programm hangamj', 'програм хангамж'],
    ['program hangamj', 'програм хангамж'],
    ['huuli', 'хууль'],
    ['anagaah', 'анагаах'],
    ['bagsh', 'багш'],
    ['hugjim', 'хөгжим'],
    ['erh zui', 'эрх зүй'],
    ['ediin zasag', 'эдийн засаг'],
  ])('%p finds the majors with %p in their name or faculty name', async (search, cyrillic) => {
    const rows = await searchMajors(search);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect([search, row.name, majorText(row).replace(/мм/g, 'м').includes(cyrillic)]).toEqual([
        search,
        row.name,
        true,
      ]);
    }
    // Everything the Cyrillic search finds by name, and the majors of faculties with that name.
    const found = ids(rows);
    const byName = oldSearch('majors', cyrillic);
    expect([search, byName.every((id) => found.includes(id))]).toEqual([search, true]);
    // Names that have it come before majors found only by their faculty's name.
    const firstFacultyOnly = rows.findIndex((row) => !row.name.toLowerCase().replace(/мм/g, 'м').includes(cyrillic));
    if (firstFacultyOnly >= 0) {
      expect([search, rows.slice(firstFacultyOnly).every((row) => !byName.includes(row.id))]).toEqual([search, true]);
    }
  });

  test('"huuli" finds the law schools\' majors (named "Эрх зүй")', async () => {
    const rows = await searchMajors('huuli');
    const lawFaculties = oldSearch('faculties', 'хууль');
    expect(lawFaculties.length).toBeGreaterThan(0);
    const expected = sqlite
      .query(`SELECT id FROM majors WHERE faculty_id IN (${lawFaculties.map(() => '?').join(', ')})`)
      .all(...lawFaculties) as { id: string }[];
    expect(sorted(ids(rows))).toEqual(sorted(expected.map((row) => row.id)));
    expect(rows.some((row) => row.name === 'Эрх зүй')).toBe(true);
  });

  test('a university short name finds its majors, first', async () => {
    for (const [search, schoolId] of [
      ['muis', 'sch_muis'],
      ['МУИС', 'sch_muis'],
      ['NUM', 'sch_muis'],
      ['huree', 'sch_huree'],
      ['sezis', 'sch_sezis'],
    ] as const) {
      const rows = await searchMajors(search);
      const expected = sqlite.query('SELECT count(*) AS n FROM majors WHERE school_id = ?').get(schoolId) as {
        n: number;
      };
      expect([search, rows.filter((row) => row.schoolId === schoolId).length]).toEqual([search, expected.n]);
      expect([search, rows.slice(0, expected.n).every((row) => row.schoolId === schoolId)]).toEqual([search, true]);
    }
  });

  test('a short name and a major name find that major at that university', async () => {
    for (const [search, schoolId] of [
      ['muis programm hangamj', 'sch_muis'],
      ['МУИС программ хангамж', 'sch_muis'],
      ['shutis programm hangamj', 'sch_shutis'],
      ['programm hangamj sezis', 'sch_sezis'],
    ] as const) {
      const rows = await searchMajors(search);
      expect([search, rows.length > 0]).toEqual([search, true]);
      for (const row of rows) {
        expect([search, row.schoolId, row.name.toLowerCase().replace(/мм/g, 'м').includes('програм хангамж')]).toEqual([
          search,
          schoolId,
          true,
        ]);
      }
    }
  });

  test('works within one university (schoolId)', async () => {
    const rows = await searchMajors('programm', 'sch_shutis');
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((row) => row.schoolId === 'sch_shutis')).toBe(true);
  });

  test('a Cyrillic search that matches no major name looks in faculty names ("хууль")', async () => {
    expect(oldSearch('majors', 'хууль')).toEqual([]);
    expect(sorted(ids(await searchMajors('хууль')))).toEqual(sorted(ids(await searchMajors('huuli'))));
  });
});

describe('Cyrillic search finds what it found before', () => {
  /** Whether a word of the search is a university's alias (МУИС, Хүрээ): those also find that university. */
  function hasAlias(search: string): boolean {
    const aliases = (sqlite.query('SELECT search_aliases FROM schools').all() as { search_aliases: string }[])
      .map((row) => row.search_aliases)
      .join('');
    return search.split(/\s+/).some((word) => foldSearchText(word) && aliases.includes(`|${foldSearchText(word)}|`));
  }

  /** Every word of every school and major name, plus whole names and some phrases. */
  function cyrillicQueries(): string[] {
    const names = [
      ...CATALOG.schools.map(([, name]) => name),
      ...(sqlite.query('SELECT name FROM majors').all() as { name: string }[]).map((row) => row.name),
    ];
    const words = names.flatMap((name) => name.split(/[^\p{L}]+/u)).filter((word) => /[Ѐ-ӿ]{2,}/.test(word));
    return [
      ...new Set([
        ...words,
        ...words.map((word) => word.toLowerCase()),
        ...names.slice(0, 60),
        'программ хангамж',
        'Хууль',
        'хууль зүй',
        'анагаах',
        'багш',
        'их сургууль',
        'монгол',
        'ПРОГРАММ',
      ]),
    ];
  }

  test('schools: same set as the old name match, except that an alias also finds its university', async () => {
    for (const search of cyrillicQueries()) {
      const before = oldSearch('schools', search);
      const after = ids(await searchSchools(search));
      if (hasAlias(search)) {
        expect([search, before.every((id) => after.includes(id))]).toEqual([search, true]);
      } else {
        expect([search, sorted(after)]).toEqual([search, sorted(before)]);
      }
    }
  });

  test('majors: same set as the old name match, except that an alias also finds its university', async () => {
    let checked = 0;
    for (const search of cyrillicQueries()) {
      const before = oldSearch('majors', search);
      const after = ids(await searchMajors(search));
      if (hasAlias(search)) {
        expect([search, before.every((id) => after.includes(id))]).toEqual([search, true]);
      } else if (before.length > 0) {
        expect([search, sorted(after)]).toEqual([search, sorted(before)]);
        checked += 1;
      }
      // A search that found nothing may now find majors by their faculty's name (tested above).
    }
    expect(checked).toBeGreaterThan(500);
  });
});

describe('School.faculties / School.majors search argument', () => {
  test('filters a university\'s majors the same way as Query.majors', async () => {
    const school = { id: 'sch_shutis' } as dbSchema.School;
    const all = await resolvers.School.majors(school, {}, context);
    const filtered = await resolvers.School.majors(school, { search: 'programm hangamj' }, context);
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.length).toBeLessThan(all.length);
    expect(sorted(ids(filtered))).toEqual(sorted(ids(await searchMajors('programm hangamj', 'sch_shutis'))));
    const cyrillic = await resolvers.School.majors(school, { search: 'Программ хангамж' }, context);
    expect(sorted(ids(cyrillic))).toEqual(sorted(ids(filtered)));

    const muis = { id: 'sch_muis' } as dbSchema.School;
    const law = await resolvers.School.majors(muis, { search: 'huuli' }, context);
    expect(law.length).toBeGreaterThan(0);
    expect(ids(law)).toEqual(ids(await searchMajors('huuli', 'sch_muis')));
    expect(await resolvers.School.majors(muis, { search: '' }, context)).toHaveLength(
      CATALOG.majors.filter(([schoolId]) => schoolId === 'sch_muis').length
    );
  });

  test('filters a university\'s faculties by name', async () => {
    const muis = { id: 'sch_muis' } as dbSchema.School;
    const faculties = await resolvers.School.faculties(muis, { search: 'huuli' }, context);
    expect(faculties.map((faculty) => faculty.name.toLowerCase())).toEqual(['хууль зүйн сургууль']);
    expect(await resolvers.School.faculties(muis, { search: 'ХУУЛЬ' }, context)).toEqual(faculties);
  });
});

describe('admin edits keep the search text up to date', () => {
  test('a new or renamed university, faculty and major are found in Latin letters', async () => {
    const admin = { ...context, user: { clerkUserId: 'user_admin', role: 'admin' } } as GraphQLContext;
    const school = defined(
      await mutations.createSchool(
      null,
        { input: { name: 'Дархан Технологийн Дээд Сургууль', aliases: [' ДТДС ', 'dtds', 'ДТДС'] } },
        admin
      )
    );
    expect(school.aliases).toEqual(['ДТДС', 'dtds']);
    expect((await searchSchools('dtds'))[0]?.id).toBe(school.id);
    expect((await searchSchools('ДТДС'))[0]?.id).toBe(school.id);

    // An older admin page that doesn't send aliases keeps them.
    await mutations.updateSchool(null, { id: school.id, input: { name: 'Дарханы Технологийн Дээд Сургууль' } }, admin);
    expect((await searchSchools('darhanii'))[0]?.id).toBe(school.id);
    expect((await searchSchools('dtds'))[0]?.id).toBe(school.id);

    const faculty = defined(
      await mutations.createFaculty(null, { input: { schoolId: school.id, name: 'Инженерийн сургууль' } }, admin)
    );
    const major = defined(
      await mutations.createMajor(null, { input: { facultyId: faculty.id, name: 'Цахилгаан хангамж' } }, admin)
    );
    expect(ids(await searchMajors('tsahilgaan', school.id))).toEqual([major.id]);
    expect(ids(await searchMajors('injener', school.id))).toEqual([major.id]);

    await mutations.updateMajor(null, { id: major.id, input: { facultyId: faculty.id, name: 'Дулааны инженерчлэл' } }, admin);
    await mutations.updateFaculty(null, { id: faculty.id, input: { schoolId: school.id, name: 'Эрчим хүчний сургууль' } }, admin);
    expect(ids(await searchMajors('dulaan', school.id))).toEqual([major.id]);
    expect(ids(await searchMajors('erchim huch', school.id))).toEqual([major.id]);
    expect(await searchMajors('tsahilgaan', school.id)).toEqual([]);
  });
});
