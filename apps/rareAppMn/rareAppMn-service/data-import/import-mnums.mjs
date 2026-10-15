// Imports the АШУҮИС dataset (data-import/ashuuis/data) into D1, idempotently.
//
//   node data-import/import-mnums.mjs --local            # dry run: print what would change
//   node data-import/import-mnums.mjs --local --apply    # write, then re-run to check nothing is left to change
//   node data-import/import-mnums.mjs --remote --apply   # same against production (--env production)
//
// Run from apps/rareAppMn/rareAppMn-service. The university row is found by name / website on each
// database. Faculties, majors, scholarships, dorms and dates are matched by natural key there (name within
// the university or faculty, event name for dates), then by data-import/mnums-map.json; new rows get a UUID
// derived from the dataset id, so every database gets the same id. Every write is an upsert on id in one SQL
// file run by one `wrangler d1 execute`; nothing is deleted, and АШУҮИС rows the dataset doesn't have are
// listed, not touched. Programs still `unverified` or with an unknown exam split are skipped.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SERVICE = path.join(HERE, '..');
const DATA = path.join(HERE, 'ashuuis', 'data');
const MAP_FILE = path.join(HERE, 'mnums-map.json');
const OUT = path.join(HERE, 'ashuuis', 'out');

const UNIVERSITY_KEYS = ['анагаахын шинжлэх ухааны', 'ашуүис', 'mnums'];
const STATUS_PREFIX = { verify: '⚠ Тодруулах: ', conflicting: '⚠ Эх сурвалж зөрүүтэй: ' };
const TUITION_CONFLICT = '⚠ Төлбөр эх сурвалжаар зөрүүтэй.';
// Faculties for these dataset school types; `unit` (the graduate school) takes no bachelor students.
const FACULTY_TYPES = new Set(['constituent', 'branch']);
const DEGREE_TYPES = { Бакалавр: 'BACHELOR', 'Дэд бакалавр': 'ASSOCIATE' };
const DORM_STEP_TITLES = ['Оюутны код авах', 'Байранд бүртгүүлэх', 'Төлбөрөө төлөх', 'Бичиг баримт бүрдүүлж нүүх'];

const args = new Set(process.argv.slice(2));
const target = args.has('--remote') ? 'remote' : args.has('--local') ? 'local' : null;
if (!target) throw new Error('pass --local or --remote');
const apply = args.has('--apply');
const targetFlags = target === 'remote' ? ['--remote', '--env', 'production'] : ['--local'];

// ---------------------------------------------------------------------------------------------- D1

function wrangler(extra) {
  const out = execFileSync('npx', ['wrangler', 'd1', 'execute', 'rareapp-db', ...targetFlags, '--json', ...extra], {
    cwd: SERVICE,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return JSON.parse(out.slice(out.indexOf('[')));
}

function query(sql) {
  const [result] = wrangler(['--command', sql]);
  if (!result?.success) throw new Error(`query failed: ${sql}`);
  return result.results;
}

const lit = (value) => {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'boolean') return value ? '1' : '0';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error(`bad number ${value}`);
    return String(value);
  }
  if (typeof value === 'object') return lit(JSON.stringify(value));
  return `'${String(value).replaceAll("'", "''")}'`;
};
const idList = (ids) => ids.map(lit).join(', ');

// --------------------------------------------------------------------------------------------- data

const readRecords = (name) => JSON.parse(readFileSync(path.join(DATA, `${name}.json`), 'utf8')).records;
const programs = readRecords('programs');
const datasetSchools = readRecords('schools');
const university = readRecords('university')[0];
const scholarships = readRecords('scholarships');
const dorms = readRecords('dorms');
const dates = readRecords('admission_dates');
const map = existsSync(MAP_FILE) ? JSON.parse(readFileSync(MAP_FILE, 'utf8')) : null;

/** A stable UUID (v5 layout) for a dataset id, so every database gets the same id for a new row. */
function datasetUuid(datasetId) {
  const hex = createHash('sha1').update(`oyutan.mn/mnums/${datasetId}`).digest('hex');
  const variant = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${variant}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

const mappedIds = new Map(
  ['faculties', 'programs', 'scholarships', 'dorms', 'admission_dates'].flatMap((section) =>
    (map?.[section] ?? []).map((entry) => [`${section}/${entry.dataset_id}`, entry.db_id])
  )
);

const isScored = (program) => ['confirmed', 'likely'].includes(program.exam_2026_2027?.split_confidence);
const isImported = (program) => program.status !== 'unverified' && program.exam_2026_2027?.split_confidence !== 'unknown';

function examNote(program) {
  const exam = program.exam_2026_2027 ?? {};
  const parts = [
    program.required_subjects_display_mn,
    exam.note_mn,
    program.notes_mn,
    program.joint_program?.label_mn,
    program.tuition_2026_2027?.status === 'conflicting' ? TUITION_CONFLICT : null,
  ].filter((part) => part && part.trim());
  return `${STATUS_PREFIX[program.status] ?? ''}${parts.join(' ')}`;
}

// ---------------------------------------------------------------------------------------- DB state

// Matched in JavaScript: SQLite's lower() and LIKE only fold Latin letters.
const universityRows = query('SELECT id, name, website FROM schools').filter((row) =>
  UNIVERSITY_KEYS.some((key) => `${row.name} ${row.website ?? ''}`.toLowerCase().includes(key))
);
if (universityRows.length !== 1) {
  throw new Error(`expected exactly one АШУҮИС row, found ${JSON.stringify(universityRows)}`);
}
const SCHOOL_ID = universityRows[0].id;
const [schoolRow] = query(`SELECT * FROM schools WHERE id = ${lit(SCHOOL_ID)}`);
const dbFaculties = query(`SELECT id, school_id, name, location FROM faculties WHERE school_id = ${lit(SCHOOL_ID)}`);
const dbMajors = query(`SELECT * FROM majors WHERE school_id = ${lit(SCHOOL_ID)}`);
const dbScholarships = query(`SELECT * FROM scholarships WHERE school_id = ${lit(SCHOOL_ID)}`);
const dbDorms = query(`SELECT * FROM dormitories WHERE school_id = ${lit(SCHOOL_ID)}`);
const dbDates = query(`SELECT * FROM admission_schedules WHERE school_id = ${lit(SCHOOL_ID)}`);

/** The id for a dataset record: the row with the same natural key here, else the mapped id, else a derived one. */
const idFor = (section, datasetId, existing) =>
  existing?.id ?? mappedIds.get(`${section}/${datasetId}`) ?? datasetUuid(datasetId);

// ------------------------------------------------------------------------------------ desired rows

const importedPrograms = programs.filter(isImported);
const facultySchoolIds = new Set(importedPrograms.map((p) => p.school_id));

// A branch becomes a faculty only once it has an imported program.
const faculties = datasetSchools
  .filter((school) => FACULTY_TYPES.has(school.type))
  .filter((school) => school.type === 'constituent' || facultySchoolIds.has(school.id))
  .map((school) => ({
    dataset: school,
    row: {
      id: idFor('faculties', school.id, dbFaculties.find((f) => f.name === school.name_mn)),
      school_id: SCHOOL_ID,
      name: school.name_mn,
      location: school.location_mn,
    },
  }));
const facultyIdFor = new Map(faculties.map((f) => [f.dataset.id, f.row.id]));

const majors = importedPrograms.map((program) => {
  const facultyId = facultyIdFor.get(program.school_id);
  if (!facultyId) throw new Error(`${program.id}: no faculty for ${program.school_id}`);
  const degreeType = DEGREE_TYPES[program.degree];
  if (!degreeType) throw new Error(`${program.id}: unknown degree "${program.degree}"`);
  const scored = isScored(program);
  const exam = program.exam_2026_2027;
  const tuition = program.tuition_2026_2027;
  const fee = tuition?.per_year ?? null;
  return {
    dataset: program,
    row: {
      id: idFor('programs', program.id, dbMajors.find((m) => m.faculty_id === facultyId && m.name === program.name_mn)),
      school_id: SCHOOL_ID,
      faculty_id: facultyId,
      name: program.name_mn,
      // МУИС/ШУТИС convention: rows with a two-exam split keep required_subjects empty (null).
      required_subjects: scored ? null : [],
      primary_subjects: scored ? exam.suuri_options : [],
      secondary_subjects: scored ? exam.dagaldah_options : [],
      exam_note: examNote(program),
      cut_off_score: program.threshold_score ?? null,
      secondary_cut_off_score: scored ? (program.secondary_threshold_score ?? 0) : null,
      primary_weight: exam?.weights?.suuri ?? null,
      secondary_weight: exam?.weights?.dagaldah ?? null,
      selection_type: exam?.selection_type ?? null,
      degree_type: degreeType,
      tuition_fee: fee,
      // Official 2026-2027 fees are not estimates; a missing fee has nothing to flag.
      tuition_is_estimate: fee != null && !tuition.is_official,
    },
  };
});

const scholarshipRows = scholarships.map((s) => ({
  id: idFor('scholarships', s.id, dbScholarships.find((r) => r.name === s.name_mn)),
  school_id: SCHOOL_ID,
  name: s.name_mn,
  coverage: s.coverage_mn ?? null,
  requirements: s.requirements_mn ?? null,
  deadline: s.deadline_mn ?? null,
}));

const dormRows = dorms
  .filter((d) => d.record_type === 'building')
  .map((d) => ({
    dataset: d,
    row: {
      id: idFor('dorms', d.id, dbDorms.find((r) => r.name === d.name_mn)),
      school_id: SCHOOL_ID,
      name: d.name_mn,
      capacity: d.capacity ?? null,
      // A fee only when Step 2 found a current one; its year goes in the details.
      fee_per_year: d.status === 'current' ? (d.price_per_year ?? null) : null,
      facilities: [
        d.location_mn,
        d.rooms ? `${d.rooms} өрөө${d.rooms_female_male ? ` (эмэгтэй / эрэгтэй: ${d.rooms_female_male})` : ''}` : null,
        d.room_size_mn,
        d.status === 'current' && d.price_per_year != null && d.price_year ? `Төлбөр ${d.price_year} оны` : null,
        d.note_mn,
      ].filter(Boolean),
    },
  }));

const dateRows = dates.map((d) => ({
  id: idFor('admission_dates', d.id, dbDates.find((r) => r.event_name === d.event_mn)),
  school_id: SCHOOL_ID,
  event_name: d.event_mn,
  start_date: d.start ?? null,
  end_date: d.end ?? null,
}));

const howTo = dorms.find((d) => d.record_type === 'process');
const sidebar = university.sidebar_suggestion;
const flag = (value) => (value === 'Боломжтой' ? true : value === 'Боломжгүй' ? false : null);
const schoolUpdate = {
  overview: university.overview_mn,
  tuition_fee: sidebar.tuition_number,
  tuition_text: sidebar.tuition_text_mn,
  has_dormitory: flag(sidebar.dorm_flag),
  has_scholarships: flag(sidebar.scholarship_flag),
  dorm_available: flag(sidebar.dorm_flag) === true,
  scholarship_available: flag(sidebar.scholarship_flag) === true,
  dorm_guide: {
    note: sidebar.dorm_howto_mn,
    steps: howTo.steps_mn.map((text, index) => ({ title: DORM_STEP_TITLES[index] ?? `${index + 1}-р алхам`, text })),
    documents: howTo.health_check_mn ?? [],
  },
  phones: sidebar.phones,
  email: sidebar.email,
  location: sidebar.location_mn,
  website: sidebar.website,
};

// --------------------------------------------------------------------------------------- checks

/** Every id we write must be free or already АШУҮИС's. */
function assertOwned(table, ids) {
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const foreign = query(
      `SELECT id, school_id FROM ${table} WHERE id IN (${idList(chunk)}) AND school_id <> ${lit(SCHOOL_ID)}`
    );
    if (foreign.length) throw new Error(`${table}: ids belong to another university: ${JSON.stringify(foreign)}`);
  }
}
assertOwned('faculties', faculties.map((f) => f.row.id));
assertOwned('majors', majors.map((m) => m.row.id));
assertOwned('scholarships', scholarshipRows.map((r) => r.id));
assertOwned('dormitories', dormRows.map((d) => d.row.id));
assertOwned('admission_schedules', dateRows.map((r) => r.id));

for (const { row } of faculties) {
  const clash = dbFaculties.find((f) => f.name === row.name && f.id !== row.id);
  if (clash) throw new Error(`faculty name "${row.name}" already used by ${clash.id}`);
}
for (const list of [faculties.map((f) => f.row.id), majors.map((m) => m.row.id), majors.map((m) => `${m.row.faculty_id}|${m.row.name}`)]) {
  if (new Set(list).size !== list.length) throw new Error('duplicate target ids or faculty + name');
}

// ---------------------------------------------------------------------------------------- diff

const JSON_COLUMNS = new Set(['required_subjects', 'primary_subjects', 'secondary_subjects', 'facilities', 'dorm_guide', 'phones']);
const BOOL_COLUMNS = new Set(['tuition_is_estimate', 'has_dormitory', 'has_scholarships', 'dorm_available', 'scholarship_available']);

function sameValue(column, dbValue, wanted) {
  if (JSON_COLUMNS.has(column)) {
    const parsed = dbValue == null ? null : JSON.parse(dbValue);
    return JSON.stringify(parsed) === JSON.stringify(wanted ?? null);
  }
  if (BOOL_COLUMNS.has(column)) {
    return (dbValue == null ? null : Boolean(dbValue)) === (wanted == null ? null : Boolean(wanted));
  }
  return (dbValue ?? null) === (wanted ?? null);
}

function diffRows(table, wantedRows, dbRows) {
  const byId = new Map(dbRows.map((r) => [r.id, r]));
  const inserts = [];
  const updates = [];
  for (const row of wantedRows) {
    const current = byId.get(row.id);
    if (!current) {
      inserts.push(row);
      continue;
    }
    const changed = Object.keys(row).filter((c) => c !== 'id' && !sameValue(c, current[c], row[c]));
    if (changed.length) updates.push({ row, changed, before: Object.fromEntries(changed.map((c) => [c, current[c]])) });
  }
  const wantedIds = new Set(wantedRows.map((r) => r.id));
  const unmatched = dbRows.filter((r) => !wantedIds.has(r.id));
  const columns = Object.keys(wantedRows[0]);
  const updatable = columns.filter((c) => c !== 'id');
  const sql = [...inserts, ...updates.map((u) => u.row)].map(
    (row) =>
      `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map((c) => lit(row[c])).join(', ')}) ` +
      `ON CONFLICT(id) DO UPDATE SET ${updatable.map((c) => `${c} = excluded.${c}`).join(', ')};`
  );
  return { table, inserts, updates, unmatched, sql };
}

// Faculties first: majors reference them.
const diffs = [
  diffRows('faculties', faculties.map((f) => f.row), dbFaculties),
  diffRows('majors', majors.map((m) => m.row), dbMajors),
  diffRows('scholarships', scholarshipRows, dbScholarships),
  diffRows('dormitories', dormRows.map((d) => d.row), dbDorms),
  diffRows('admission_schedules', dateRows, dbDates),
];

const schoolChanged = Object.keys(schoolUpdate).filter((c) => !sameValue(c, schoolRow[c], schoolUpdate[c]));
const schoolSql = schoolChanged.length
  ? [`UPDATE schools SET ${schoolChanged.map((c) => `${c} = ${lit(schoolUpdate[c])}`).join(', ')} WHERE id = ${lit(SCHOOL_ID)};`]
  : [];

// --------------------------------------------------------------------------------------- report

console.log(`target: ${target}${apply ? ' (apply)' : ' (dry run)'}; university ${SCHOOL_ID}`);
console.log(`programs: ${importedPrograms.length} imported, ${programs.length - importedPrograms.length} skipped (unverified or unknown split)`);
for (const p of programs.filter((p) => !isImported(p))) console.log(`  skipped: ${p.id}`);
console.log(`schools/${SCHOOL_ID}: ${schoolChanged.length ? `update ${schoolChanged.join(', ')}` : 'unchanged'}`);
for (const d of diffs) {
  console.log(`${d.table}: ${d.inserts.length} insert, ${d.updates.length} update, ${d.unmatched.length} unmatched${d.sql.length === 0 ? ' — unchanged' : ''}`);
  const columnCounts = {};
  for (const u of d.updates) for (const c of u.changed) columnCounts[c] = (columnCounts[c] ?? 0) + 1;
  if (d.updates.length) console.log(`  changed columns: ${JSON.stringify(columnCounts)}`);
  for (const r of d.unmatched) console.log(`  unmatched (left alone): ${r.id} ${r.name ?? r.event_name ?? ''}`);
}

const statements = [...schoolSql, ...diffs.flatMap((d) => d.sql)];
mkdirSync(OUT, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const sqlFile = path.join(OUT, `${target}-${stamp}.sql`);
const changesFile = path.join(OUT, `${target}-${stamp}-changes.json`);
writeFileSync(sqlFile, statements.join('\n') + '\n');
const inserted = Object.fromEntries(diffs.map((d) => [d.table, d.inserts.map((r) => r.id)]));
writeFileSync(
  changesFile,
  JSON.stringify(
    {
      university: SCHOOL_ID,
      school: schoolChanged.map((c) => ({ column: c, before: schoolRow[c], after: schoolUpdate[c] })),
      inserted,
      ...Object.fromEntries(diffs.map((d) => [d.table, { updates: d.updates, unmatched: d.unmatched.map((r) => r.id) }])),
    },
    null,
    1
  )
);
console.log(`${statements.length} statement(s) → ${path.relative(SERVICE, sqlFile)}`);

// ---------------------------------------------------------------------------------- map file

function writeMap() {
  const previous = new Map(
    ['faculties', 'programs', 'scholarships', 'dorms', 'admission_dates'].flatMap((section) =>
      (map?.[section] ?? []).map((entry) => [`${section}/${entry.dataset_id}`, entry])
    )
  );
  // The first database written sets db_id; another database with a different id is noted next to it.
  const entry = (section, datasetId, id, extra) => {
    const before = previous.get(`${section}/${datasetId}`);
    const dbId = before?.db_id ?? id;
    return { dataset_id: datasetId, ...extra, db_id: dbId, ...(dbId !== id ? { [`${target}_id`]: id } : {}) };
  };
  const scoreCheck = {};
  const next = {
    _meta: {
      description:
        'Maps each program, school, scholarship, dorm and date in the АШУҮИС dataset (ashuuis-oyutan-mn, data/*.json, after the 2026-10-14 gap fill) to our rows, so a yearly refresh can update by id instead of by name.',
      dataset_verified_at: '2026-10-14',
      mapped_at: new Date().toISOString().slice(0, 10),
      university_id: SCHOOL_ID,
      how_to_use:
        'Run data-import/import-mnums.mjs (--local / --remote, then --apply): it reads data-import/ashuuis/data and this file, matches rows by natural key first, upserts by id and never deletes. Rows missing here get a UUID derived from the dataset id, so every database gets the same id.',
      score_check_values: {
        sum: 'two exam groups, each with its own minimum (cut_off_score, secondary_cut_off_score); score = group 1 + group 2 (primary_weight = secondary_weight = 1); selection_type list / direct',
        skills_test: 'group 2 is АШУҮИС\'s own skills test: only the group 1 minimum can be checked, otherwise "Сургуулиас тодруулна уу"',
      },
      degree_types: { BACHELOR: 'Бакалавр', ASSOCIATE: 'Дэд бакалавр' },
      skipped_programs: programs.filter((p) => !isImported(p)).map((p) => p.id),
      counts: {},
    },
    faculties: faculties.map(({ dataset, row }) =>
      entry('faculties', dataset.id, row.id, { type: dataset.type, name: row.name, location: row.location })
    ),
    programs: majors.map(({ dataset, row }) => {
      const check = row.secondary_subjects?.includes('Ур чадварын шалгалт') && row.secondary_subjects.length === 1 ? 'skills_test' : 'sum';
      scoreCheck[check] = (scoreCheck[check] ?? 0) + 1;
      return entry('programs', dataset.id, row.id, {
        dataset_school: dataset.school_id,
        faculty: faculties.find((f) => f.row.id === row.faculty_id).row.name,
        name: row.name,
        degree_type: row.degree_type,
        selection_type: row.selection_type,
        score_check: check,
      });
    }),
    scholarships: scholarships.map((s, i) => entry('scholarships', s.id, scholarshipRows[i].id, { name: s.name_mn })),
    dorms: dormRows.map(({ dataset, row }) => entry('dorms', dataset.id, row.id, { name: row.name })),
    admission_dates: dates.map((d, i) => entry('admission_dates', d.id, dateRows[i].id, { event: d.event_mn })),
  };
  next._meta.counts = {
    dataset_programs: programs.length,
    imported_programs: majors.length,
    by_degree: Object.fromEntries(
      Object.values(DEGREE_TYPES).map((t) => [t, majors.filter((m) => m.row.degree_type === t).length])
    ),
    by_score_check: scoreCheck,
    faculties: faculties.length,
    scholarships: scholarshipRows.length,
    dorms: dormRows.length,
    admission_dates: dateRows.length,
  };
  writeFileSync(MAP_FILE, JSON.stringify(next, null, 2) + '\n');
}

if (!apply) {
  console.log('dry run: nothing written to the database');
} else if (statements.length === 0) {
  console.log('nothing to change');
  writeMap();
} else {
  wrangler(['--yes', '--file', sqlFile]);
  console.log('applied');
  for (const [table, ids] of Object.entries(inserted)) if (ids.length) console.log(`  inserted ${table}: ${ids.join(', ')}`);
  writeMap();
  console.log('re-run without --apply to confirm it now reports no changes');
}
