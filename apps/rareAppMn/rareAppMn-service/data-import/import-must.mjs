// Imports the ШУТИС dataset (data-import/shutis/data) into D1, idempotently.
//
//   node data-import/import-must.mjs --local            # dry run: print what would change
//   node data-import/import-must.mjs --local --apply    # write, then check nothing is left to change
//   node data-import/import-must.mjs --remote --apply   # same against production (--env production)
//
// Run from apps/rareAppMn/rareAppMn-service. Rows are matched by id: faculties and majors through
// data-import/must-map.json (new rows get a UUID derived from the dataset id, so local and main get the
// same id), scholarships / dorms / dates by their dataset id. Every write is an upsert on id; nothing is
// deleted, and ШУТИС rows the dataset no longer has are listed, not touched.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SERVICE = path.join(HERE, '..');
const DATA = path.join(HERE, 'shutis', 'data');
const MAP_FILE = path.join(HERE, 'must-map.json');
const OUT = path.join(HERE, 'shutis', 'out');

const SCHOOL_ID = 'sch_shutis';
const DEGREE_TYPE = 'BACHELOR';
const SWAP_NOTE_START = 'Журмын дагуу эрэлттэй';
const STATUS_PREFIX = { verify: '⚠ Тодруулах: ', conflicting: '⚠ Эх сурвалж зөрүүтэй: ' };
// The faculties for these dataset school types; `unit` records (colleges, graduate school, high school) take no bachelor students.
const FACULTY_TYPES = new Set(['constituent', 'branch']);

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
const map = JSON.parse(readFileSync(MAP_FILE, 'utf8'));

/** A stable UUID (v5 layout) for a dataset id, so every database gets the same id for a new row. */
function datasetUuid(datasetId) {
  const hex = createHash('sha1').update(`oyutan.mn/must/${datasetId}`).digest('hex');
  const variant = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${variant}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

const isScored = (program) => ['confirmed', 'likely'].includes(program.exam_2026_2027?.split_confidence);

function examNote(program) {
  const exam = program.exam_2026_2027 ?? {};
  const examExtra = (exam.note_mn ?? '')
    .split(/(?<=\.)\s+/)
    .filter((sentence) => sentence && !sentence.startsWith(SWAP_NOTE_START))
    .join(' ');
  const joint = program.joint_program;
  const foreign = joint && joint.country_mn && joint.country_mn !== 'Монгол';
  const parts = [
    program.required_subjects_display_mn,
    examExtra,
    program.notes_mn,
    foreign ? `Хамтарсан хөтөлбөр: ${joint.format}, ${joint.partner_mn} (${joint.country_mn}).` : null,
  ].filter((part) => part && part.trim());
  return `${STATUS_PREFIX[program.status] ?? ''}${parts.join(' ')}`;
}

// ---------------------------------------------------------------------------------------- DB state

const universityRows = query(
  // instr, not LIKE: D1 rejects LIKE patterns this long in bytes.
  `SELECT id, name, website FROM schools WHERE id = ${lit(SCHOOL_ID)} OR instr(lower(name), 'технологийн их сургууль') > 0 OR instr(website, 'must.edu.mn') > 0`
);
if (universityRows.length !== 1 || universityRows[0].id !== SCHOOL_ID) {
  throw new Error(`expected exactly one ШУТИС row with id ${SCHOOL_ID}, found ${JSON.stringify(universityRows)}`);
}
const [schoolRow] = query(`SELECT * FROM schools WHERE id = ${lit(SCHOOL_ID)}`);
const dbFaculties = query(`SELECT id, school_id, name, location FROM faculties WHERE school_id = ${lit(SCHOOL_ID)}`);
const dbMajors = query(`SELECT * FROM majors WHERE school_id = ${lit(SCHOOL_ID)}`);
const dbScholarships = query(`SELECT * FROM scholarships WHERE school_id = ${lit(SCHOOL_ID)}`);
const dbDorms = query(`SELECT * FROM dormitories WHERE school_id = ${lit(SCHOOL_ID)}`);
const dbDates = query(`SELECT * FROM admission_schedules WHERE school_id = ${lit(SCHOOL_ID)}`);

// ------------------------------------------------------------------------------------ desired rows

const facultyMap = new Map(map.faculties.map((f) => [f.dataset_id, f.db_id]));
const programMap = new Map(map.programs.map((p) => [p.dataset_id, p.db_id]));

const faculties = datasetSchools
  .filter((school) => FACULTY_TYPES.has(school.type))
  .map((school) => {
    const existing = dbFaculties.find((f) => f.name === school.name_mn);
    return {
      dataset: school,
      row: {
        id: facultyMap.get(school.id) ?? existing?.id ?? datasetUuid(school.id),
        school_id: SCHOOL_ID,
        name: school.name_mn,
        location: school.location_mn,
      },
    };
  });
const facultyIdFor = new Map(faculties.map((f) => [f.dataset.id, f.row.id]));

const majors = programs.map((program) => {
  const facultyId = facultyIdFor.get(program.school_id);
  if (!facultyId) throw new Error(`${program.id}: no faculty for ${program.school_id}`);
  const scored = isScored(program);
  const exam = program.exam_2026_2027;
  const tuition = program.tuition_2026_2027?.estimated_per_year?.max ?? null;
  const existing = dbMajors.find((m) => m.faculty_id === facultyId && m.name === program.name_mn);
  return {
    dataset: program,
    row: {
      id: programMap.get(program.id) ?? existing?.id ?? datasetUuid(program.id),
      school_id: SCHOOL_ID,
      faculty_id: facultyId,
      name: program.name_mn,
      // МУИС rows with a суурь/дагалдах split keep required_subjects empty (null).
      required_subjects: scored ? null : [],
      primary_subjects: scored ? exam.suuri_options : [],
      secondary_subjects: scored ? exam.dagaldah_options : [],
      exam_note: examNote(program),
      cut_off_score: program.threshold_score ?? null,
      // 0 = the дагалдах minimum is unknown (only the суурь one is checked).
      secondary_cut_off_score: scored ? (program.secondary_threshold_score ?? 0) : null,
      degree_type: DEGREE_TYPE,
      tuition_fee: tuition,
      tuition_is_estimate: tuition != null,
    },
  };
});

const scholarshipRows = scholarships.map((s) => ({
  id: s.id,
  school_id: SCHOOL_ID,
  name: s.name_mn,
  coverage: s.coverage_mn ?? null,
  requirements: s.requirements_mn ?? null,
  deadline: s.deadline_mn ?? null,
}));

const dormRows = dorms
  .filter((d) => d.record_type === 'building')
  .map((d) => ({
    id: d.id,
    school_id: SCHOOL_ID,
    name: d.name_mn,
    // Only a current price is shown as the fee; older prices stay in the details as history.
    fee_per_month: d.status === 'current' ? (d.price_per_month ?? null) : null,
    fee_per_year: d.status === 'current' ? (d.price_per_year ?? null) : null,
    facilities: [
      d.residents_mn,
      d.location_mn,
      d.status === 'current' && d.price_note_mn ? `${d.price_year}: ${d.price_note_mn}` : null,
    ].filter(Boolean),
  }));

const dateRows = dates.map((d) => ({
  id: d.id,
  school_id: SCHOOL_ID,
  event_name: d.event_mn,
  start_date: d.start ?? null,
  end_date: d.end ?? null,
}));

// The structured dorm guide keeps its steps, documents and links; the note carries the facts and prices.
const dormFacts = dorms.find((d) => d.id === 'must-dorm-facts');
const currentGuide = schoolRow.dorm_guide ? JSON.parse(schoolRow.dorm_guide) : null;
const howTo = dorms.find((d) => d.id === 'must-dorm-how-to-apply');
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
    ...(currentGuide ?? {
      steps: howTo.steps_mn.map((text, index) => ({ title: `${index + 1}-р алхам`, text })),
      documents: howTo.documents_mn,
      links: dormFacts.fee_pdfs.map((url) => ({ title: 'Оюутны байрны төлбөр (PDF)', url })),
    }),
    note: dormFacts.facts_mn.join(' '),
  },
  // Written the way the site shows phone numbers elsewhere ("+976 11-324590", "7711-1757").
  phones: sidebar.phones.map((phone) =>
    phone.replace(/^\(976\)-11-(\d+)$/, '+976 11-$1').replace(/^(\d{4})(\d{4})$/, '$1-$2')
  ),
  email: sidebar.email,
  location: sidebar.location_mn,
};

// --------------------------------------------------------------------------------------- checks

/** Every id we write must be free or already ШУТИС's. */
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
assertOwned('dormitories', dormRows.map((r) => r.id));
assertOwned('admission_schedules', dateRows.map((r) => r.id));

for (const { row } of faculties) {
  const clash = dbFaculties.find((f) => f.name === row.name && f.id !== row.id);
  if (clash) throw new Error(`faculty name "${row.name}" already used by ${clash.id}`);
}
for (const list of [faculties.map((f) => f.row.id), majors.map((m) => m.row.id)]) {
  if (new Set(list).size !== list.length) throw new Error('duplicate target ids');
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

function diffRows(table, wantedRows, dbRows, insertOnlyColumns = []) {
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
  const updatable = columns.filter((c) => c !== 'id' && !insertOnlyColumns.includes(c));
  const sql = [...inserts, ...updates.map((u) => u.row)].map(
    (row) =>
      `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map((c) => lit(row[c])).join(', ')}) ` +
      `ON CONFLICT(id) DO UPDATE SET ${updatable.map((c) => `${c} = excluded.${c}`).join(', ')};`
  );
  return { table, inserts, updates, unmatched, sql };
}

const diffs = [
  diffRows('faculties', faculties.map((f) => f.row), dbFaculties),
  diffRows('majors', majors.map((m) => m.row), dbMajors),
  diffRows('scholarships', scholarshipRows, dbScholarships),
  diffRows('dormitories', dormRows, dbDorms),
  diffRows('admission_schedules', dateRows, dbDates),
];

const schoolChanged = Object.keys(schoolUpdate).filter((c) => !sameValue(c, schoolRow[c], schoolUpdate[c]));
const schoolSql = schoolChanged.length
  ? [`UPDATE schools SET ${schoolChanged.map((c) => `${c} = ${lit(schoolUpdate[c])}`).join(', ')} WHERE id = ${lit(SCHOOL_ID)};`]
  : [];

// --------------------------------------------------------------------------------------- report

console.log(`target: ${target}${apply ? ' (apply)' : ' (dry run)'}`);
console.log(`schools/${SCHOOL_ID}: ${schoolChanged.length ? `update ${schoolChanged.join(', ')}` : 'unchanged'}`);
for (const d of diffs) {
  const same = d.sql.length === 0 ? 'unchanged' : '';
  console.log(`${d.table}: ${d.inserts.length} insert, ${d.updates.length} update, ${d.unmatched.length} unmatched ${same}`);
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
writeFileSync(
  changesFile,
  JSON.stringify(
    {
      school: schoolChanged.map((c) => ({ column: c, before: schoolRow[c], after: schoolUpdate[c] })),
      ...Object.fromEntries(diffs.map((d) => [d.table, { inserts: d.inserts.map((r) => r.id), updates: d.updates, unmatched: d.unmatched.map((r) => r.id) }])),
    },
    null,
    1
  )
);
console.log(`${statements.length} statement(s) → ${path.relative(SERVICE, sqlFile)}`);

// ---------------------------------------------------------------------------------- map file

function writeMap() {
  const conf = {};
  const check = {};
  const programsOut = majors.map(({ dataset, row }) => {
    const c = dataset.exam_2026_2027?.split_confidence ?? 'unknown';
    conf[c] = (conf[c] ?? 0) + 1;
    const scoreCheck = !isScored(dataset)
      ? 'none'
      : row.secondary_cut_off_score > 0
        ? 'per_exam'
        : 'per_exam_secondary_unknown';
    check[scoreCheck] = (check[scoreCheck] ?? 0) + 1;
    return {
      dataset_id: dataset.id,
      dataset_school: dataset.school_id,
      faculty: faculties.find((f) => f.row.id === row.faculty_id).row.name,
      name: row.name,
      split_confidence: c,
      score_check: scoreCheck,
      db_id: row.id,
    };
  });
  const next = {
    _meta: {
      ...map._meta,
      description:
        'Maps each program and school in the ШУТИС dataset (shutis-oyutan-mn v2, data/programs.json and data/schools.json) to our majors / faculties rows, so a yearly refresh can update by id instead of by name.',
      dataset_verified_at: '2026-10-10',
      mapped_at: '2026-10-10',
      how_to_use:
        'Run data-import/import-must.mjs (--local / --remote, then --apply): it reads data-import/shutis/data and this file, upserts by db_id and never deletes. Rows missing here get a UUID derived from the dataset id, so every database gets the same id.',
      score_check_values: {
        per_exam: 'суурь/дагалдах split filled; cut_off_score is the суурь minimum and secondary_cut_off_score the дагалдах minimum, each checked on its own',
        per_exam_secondary_unknown: 'split filled but the дагалдах minimum is unknown: secondary_cut_off_score = 0, so only the суурь minimum is checked and the verdict says the дагалдах minimum is unknown',
        none: 'split_confidence unclear or unknown: subjects left empty ([]), so the score check shows "Сургуулиас тодруулна уу"; exam_note says what is known',
      },
      ids_note: 'The same ids are used on local and main. Rows from the v1 import (2026-10-09) keep their ids; rows added in v2 have ids derived from the dataset id.',
      counts: {
        dataset_programs: programs.length,
        faculties: faculties.length,
        by_split_confidence: conf,
        by_score_check: check,
        scholarships: scholarshipRows.length,
        dorms: dormRows.length,
        admission_dates: dateRows.length,
      },
    },
    faculties: faculties.map(({ dataset, row }) => ({
      dataset_id: dataset.id,
      abbr: dataset.abbr_mn,
      type: dataset.type,
      name: row.name,
      location: row.location,
      db_id: row.id,
    })),
    programs: programsOut,
  };
  delete next._meta.score_check_note;
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
  writeMap();
  console.log('re-run without --apply to confirm it now reports no changes');
}
