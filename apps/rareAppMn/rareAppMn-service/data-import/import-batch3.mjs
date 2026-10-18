// Imports one university of the batch-3 dataset (data-import/batch3/unis/<slug>/data) into D1, idempotently.
//
//   node data-import/import-batch3.mjs etugen --local            # dry run: print what would change
//   node data-import/import-batch3.mjs etugen --local --apply    # write, then re-run to check nothing is left to change
//   node data-import/import-batch3.mjs etugen --remote --apply   # same against production (--env production)
//
// <slug> is etugen, otgontenger, huree, iuu or suis. Run from apps/rareAppMn/rareAppMn-service. A copy of
// import-next-unis.mjs: these universities already exist as placeholder rows, found by the site's id (sch_<slug>) and
// confirmed by name on each database; the website is never overwritten, and the location changes only where the
// placeholder names the wrong district (Этүгэн, Отгонтэнгэр, ОУУБИС, СУИС). Faculties, majors, scholarships,
// dorms and dates are matched by natural key there (name within the university or faculty, event name for dates),
// then by data-import/<slug>-map.json; new rows get a UUID derived from the dataset id, so every database gets the
// same id. Every write is an upsert on id in one SQL file run by one `wrangler d1 execute`; nothing is deleted, and
// rows of this university the dataset doesn't have are listed, not touched. Records still `unverified` are skipped.
// Programs the score check can't judge (unclear / unknown split, or an extra subject minimum) are imported with no
// exam subjects or cut-offs, so students get "Сургуулиас тодруулна уу" and read the rule in exam_note.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SERVICE = path.join(HERE, '..');

// `district`: the right district, for placeholders that name the wrong one (written the way the row already writes it).
const UNIVERSITIES = {
  etugen: { label: 'Этүгэн', names: ['этүгэн их сургууль', 'этүгэн', 'etugen university'], district: 'Сүхбаатар' },
  otgontenger: { label: 'ОТИС', names: ['отгонтэнгэр их сургууль', 'отис', 'otgontenger university'], district: 'Баянзүрх' },
  huree: {
    label: 'Хүрээ МХТДС',
    names: ['хүрээ мэдээлэл холбоо технологийн дээд сургууль', 'хүрээ мхтдс', 'huree university of ict'],
    district: null,
  },
  iuu: {
    label: 'ОУУБИС',
    names: ['олон улсын улаанбаатарын их сургууль', 'оуубис', 'international university of ulaanbaatar'],
    district: 'Баянзүрх',
  },
  // СУИС: its admission system says "Улаанбаатар хот, Баянгол дүүрэг" (owner's decision, 2026-10-18).
  suis: { label: 'СУИС', names: ['монгол улсын соёл урлагийн их сургууль', 'суис', 'mnuac'], district: 'Баянгол' },
};

const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith('--'));
const config = UNIVERSITIES[slug];
if (!config) throw new Error(`pass a university: ${Object.keys(UNIVERSITIES).join(' | ')}`);
const target = args.includes('--remote') ? 'remote' : args.includes('--local') ? 'local' : null;
if (!target) throw new Error('pass --local or --remote');
const apply = args.includes('--apply');
const targetFlags = target === 'remote' ? ['--remote', '--env', 'production'] : ['--local'];

const DATA = path.join(HERE, 'batch3', 'unis', slug, 'data');
const MAP_FILE = path.join(HERE, `${slug}-map.json`);
const OUT = path.join(HERE, 'batch3', 'out', slug);

const STATUS_PREFIX = { verify: '⚠ Тодруулах: ', conflicting: '⚠ Эх сурвалж зөрүүтэй: ' };
const TUITION_CONFLICT = '⚠ Төлбөр эх сурвалжаар зөрүүтэй.';
// Faculties for these dataset school types; a `unit` (graduate school, attached school) takes no bachelor students.
const FACULTY_TYPES = new Set(['constituent', 'branch']);
const SKILL_EXAM = 'Ур чадварын шалгалт';

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

const imported = (record) => record.status !== 'unverified';
const readRecords = (name) => JSON.parse(readFileSync(path.join(DATA, `${name}.json`), 'utf8')).records.filter(imported);
const allPrograms = JSON.parse(readFileSync(path.join(DATA, 'programs.json'), 'utf8')).records;
const programs = allPrograms.filter(imported);
const datasetSchools = readRecords('schools');
const university = readRecords('university')[0];
const scholarships = readRecords('scholarships');
const dorms = readRecords('dorms');
const dates = readRecords('admission_dates');
const map = existsSync(MAP_FILE) ? JSON.parse(readFileSync(MAP_FILE, 'utf8')) : null;

/** A stable UUID (v5 layout) for a dataset id, so every database gets the same id for a new row. */
function datasetUuid(datasetId) {
  const hex = createHash('sha1').update(`oyutan.mn/${slug}/${datasetId}`).digest('hex');
  const variant = ((parseInt(hex[16], 16) & 0x3) | 0x8).toString(16);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${variant}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

const SECTIONS = ['faculties', 'programs', 'scholarships', 'dorms', 'admission_dates'];
const mappedIds = new Map(
  SECTIONS.flatMap((section) => (map?.[section] ?? []).map((entry) => [`${section}/${entry.dataset_id}`, entry.db_id]))
);

/**
 * Programs the score check can judge: a known exam split and no extra subject minimum (e.g. СЭЗИС Эдийн засаг:
 * Математик ≥ 600 on top of the average), which the app can't store.
 */
const isScored = (program) =>
  ['confirmed', 'likely'].includes(program.exam_2026_2027?.split_confidence) &&
  Object.keys(program.exam_2026_2027?.subject_minimums ?? {}).length === 0;

/** "Бакалавр" and its variants ("Бакалавр (хос диплом)", "Бакалавр + магистр (BBA + MBA)", …) or "Дэд бакалавр". */
function degreeType(program) {
  if (program.degree === 'Дэд бакалавр') return 'ASSOCIATE';
  if (program.degree?.startsWith('Бакалавр')) return 'BACHELOR';
  throw new Error(`${program.id}: unknown degree "${program.degree}"`);
}

function examNote(program) {
  const exam = program.exam_2026_2027 ?? {};
  const parts = [
    program.required_subjects_display_mn,
    exam.note_mn,
    program.notes_mn,
    program.tuition_2026_2027?.status === 'conflicting' ? TUITION_CONFLICT : null,
  ].filter((part) => part && part.trim());
  return `${STATUS_PREFIX[program.status] ?? ''}${parts.join(' ')}`;
}

/** The yearly fee: the official one, else the estimate for the normal study length, else its upper end. */
function tuitionOf(program) {
  const tuition = program.tuition_2026_2027 ?? {};
  const fee = tuition.per_year ?? tuition.estimated_per_year?.typical ?? tuition.estimated_per_year?.max ?? null;
  return { fee, estimate: fee != null && !(tuition.is_official && tuition.per_year != null) };
}

// ---------------------------------------------------------------------------------------- DB state

// The site's slug is the id without "sch_"; the name confirms it (in JavaScript: SQLite's lower() only folds Latin letters).
const allSchools = query('SELECT id, name, website FROM schools');
const bySlug = allSchools.filter((row) => row.id === `sch_${university.db_slug}`);
const byName = allSchools.filter((row) => config.names.includes(row.name.trim().toLowerCase()));
if (bySlug.length !== 1 || byName.length !== 1 || bySlug[0].id !== byName[0].id) {
  throw new Error(`${config.label}: slug and name don't agree on one row: ${JSON.stringify({ bySlug, byName })}`);
}
const SCHOOL_ID = bySlug[0].id;
const [schoolRow] = query(`SELECT * FROM schools WHERE id = ${lit(SCHOOL_ID)}`);
const dbFaculties = query(`SELECT id, school_id, name, location FROM faculties WHERE school_id = ${lit(SCHOOL_ID)}`);
const dbMajors = query(`SELECT * FROM majors WHERE school_id = ${lit(SCHOOL_ID)}`);
const dbScholarships = query(`SELECT * FROM scholarships WHERE school_id = ${lit(SCHOOL_ID)}`);
const dbDorms = query(`SELECT * FROM dormitories WHERE school_id = ${lit(SCHOOL_ID)}`);
const dbDates = query(`SELECT * FROM admission_schedules WHERE school_id = ${lit(SCHOOL_ID)}`);

/** The id for a dataset record: the row with the same natural key here, else the mapped id, else a derived one. */
const idFor = (section, datasetId, existing) => existing?.id ?? mappedIds.get(`${section}/${datasetId}`) ?? datasetUuid(datasetId);

// ------------------------------------------------------------------------------------ desired rows

const programSchools = new Set(programs.map((p) => p.school_id));

// A faculty for every constituent school or branch with at least one imported program.
const faculties = datasetSchools
  .filter((school) => FACULTY_TYPES.has(school.type) && programSchools.has(school.id))
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

const majors = programs.map((program) => {
  const facultyId = facultyIdFor.get(program.school_id);
  if (!facultyId) throw new Error(`${program.id}: no faculty for ${program.school_id}`);
  const scored = isScored(program);
  const exam = program.exam_2026_2027;
  const weights = scored ? exam.weights : null;
  // 0.7 / 0.3 stays null, so those rows run the МУИС/ШУТИС code path.
  const usual = weights?.suuri === 0.7 && weights?.dagaldah === 0.3;
  const { fee, estimate } = tuitionOf(program);
  return {
    dataset: program,
    scored,
    row: {
      id: idFor('programs', program.id, dbMajors.find((m) => m.faculty_id === facultyId && m.name === program.name_mn)),
      school_id: SCHOOL_ID,
      faculty_id: facultyId,
      name: program.name_mn,
      // МУИС/ШУТИС/АШУҮИС convention: rows with a two-exam split keep required_subjects empty (null).
      required_subjects: scored ? null : [],
      primary_subjects: scored ? exam.suuri_options : [],
      secondary_subjects: scored ? exam.dagaldah_options : [],
      exam_note: examNote(program),
      cut_off_score: scored ? (program.threshold_score ?? null) : null,
      secondary_cut_off_score: scored && exam.threshold_type === 'per_exam' ? (program.secondary_threshold_score ?? 0) : null,
      primary_weight: weights && !usual ? weights.suuri : null,
      secondary_weight: weights && !usual ? weights.dagaldah : null,
      selection_type: scored ? (exam.selection_type ?? null) : null,
      degree_type: degreeType(program),
      tuition_fee: fee,
      tuition_is_estimate: estimate,
    },
  };
});

const scholarshipRows = scholarships.map((s) => ({
  dataset: s,
  row: {
    id: idFor('scholarships', s.id, dbScholarships.find((r) => r.name === s.name_mn)),
    school_id: SCHOOL_ID,
    name: s.name_mn,
    coverage: s.coverage_mn ?? null,
    requirements: s.requirements_mn ?? null,
    deadline: s.deadline_mn ?? null,
  },
}));

const dormRows = dorms
  .filter((d) => d.record_type === 'building')
  .map((d) => {
    // A fee only when the dataset has one that isn't stale; its year goes in the details.
    const fee = d.status !== 'stale' ? (d.price_per_year ?? null) : null;
    return {
      dataset: d,
      row: {
        id: idFor('dorms', d.id, dbDorms.find((r) => r.name === d.name_mn)),
        school_id: SCHOOL_ID,
        name: d.name_mn,
        capacity: d.capacity ?? null,
        fee_per_year: fee,
        facilities: [
          d.location_mn,
          d.rooms ? `${d.rooms} өрөө` : null,
          fee != null && d.price_year ? `Төлбөр: ${d.price_year}` : null,
          d.price_per_year_note_mn,
          d.note_mn,
        ].filter(Boolean),
      },
    };
  });

const dateRows = dates
  .filter((d) => (d.start || d.end) && d.status !== 'stale')
  .map((d) => ({
    dataset: d,
    row: {
      id: idFor('admission_dates', d.id, dbDates.find((r) => r.event_name === d.event_mn)),
      school_id: SCHOOL_ID,
      event_name: d.event_mn,
      start_date: d.start ?? null,
      end_date: d.end ?? null,
    },
  }));

const sidebar = university.sidebar_suggestion;
const flag = (value) => (value === 'Боломжтой' ? true : value === 'Боломжгүй' ? false : null);
const process_ = dorms.filter((d) => d.record_type === 'process');
const howTo = process_.find((d) => /how-to/.test(d.id) && d.steps_mn?.length);
const rules = process_.filter((d) => d !== howTo).flatMap((d) => d.steps_mn ?? []);
const schoolUpdate = {
  overview: university.overview_mn,
  tuition_fee: sidebar.tuition_number,
  tuition_text: sidebar.tuition_text_mn,
  has_dormitory: flag(sidebar.dorm_flag),
  has_scholarships: flag(sidebar.scholarship_flag),
  // The deprecated NOT NULL flags change only when the data knows the answer (an unknown keeps what the row has).
  dorm_available: flag(sidebar.dorm_flag) ?? Boolean(schoolRow.dorm_available),
  scholarship_available: flag(sidebar.scholarship_flag) ?? Boolean(schoolRow.scholarship_available),
  dorm_guide: {
    note: sidebar.dorm_howto_mn,
    steps: (howTo?.steps_mn ?? []).map((text, index) => ({ title: `${index + 1}-р алхам`, text })),
    documents: [],
    rules,
  },
  phones: sidebar.phones,
  email: sidebar.email,
  // Only the district changes, in the row's own format ("Баянгол дүүрэг, Улаанбаатар" → "Сүхбаатар дүүрэг, Улаанбаатар").
  location: config.district ? withDistrict(schoolRow.location, config.district) : schoolRow.location,
  // The website is never overwritten; a different one in the data is only reported.
};
if (sidebar.website && sidebar.website.replace(/\/$/, '') !== (schoolRow.website ?? '').replace(/\/$/, '')) {
  console.log(`website kept: ${schoolRow.website} (data says ${sidebar.website})`);
}

function withDistrict(location, district) {
  const pattern = /[А-ЯЁӨҮа-яёөү-]+ дүүрэг/u;
  if (!pattern.test(location ?? '')) throw new Error(`${config.label}: location "${location}" names no district`);
  return location.replace(pattern, `${district} дүүрэг`);
}

// --------------------------------------------------------------------------------------- checks

/** Every id we write must be free or already this university's. */
function assertOwned(table, ids) {
  for (let i = 0; i < ids.length; i += 100) {
    const chunk = ids.slice(i, i + 100);
    const foreign = query(`SELECT id, school_id FROM ${table} WHERE id IN (${idList(chunk)}) AND school_id <> ${lit(SCHOOL_ID)}`);
    if (foreign.length) throw new Error(`${table}: ids belong to another university: ${JSON.stringify(foreign)}`);
  }
}
assertOwned('faculties', faculties.map((f) => f.row.id));
assertOwned('majors', majors.map((m) => m.row.id));
assertOwned('scholarships', scholarshipRows.map((s) => s.row.id));
assertOwned('dormitories', dormRows.map((d) => d.row.id));
assertOwned('admission_schedules', dateRows.map((d) => d.row.id));

for (const { row } of faculties) {
  const clash = dbFaculties.find((f) => f.name === row.name && f.id !== row.id);
  if (clash) throw new Error(`faculty name "${row.name}" already used by ${clash.id}`);
}
for (const list of [
  faculties.map((f) => f.row.id),
  majors.map((m) => m.row.id),
  majors.map((m) => `${m.row.faculty_id}|${m.row.name}`),
  scholarshipRows.map((s) => s.row.id),
  dormRows.map((d) => d.row.id),
  dateRows.map((d) => d.row.id),
]) {
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
  const columns = wantedRows.length ? Object.keys(wantedRows[0]) : [];
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
  diffRows('scholarships', scholarshipRows.map((s) => s.row), dbScholarships),
  diffRows('dormitories', dormRows.map((d) => d.row), dbDorms),
  diffRows('admission_schedules', dateRows.map((d) => d.row), dbDates),
];

// Never replace a value the database already has with nothing (e.g. ХААИС has no email in the data).
const isEmpty = (value) => value == null || (Array.isArray(value) && value.length === 0) || value === '';
const schoolChanged = Object.keys(schoolUpdate).filter(
  (c) => !sameValue(c, schoolRow[c], schoolUpdate[c]) && !(isEmpty(schoolUpdate[c]) && !isEmpty(schoolRow[c]))
);
const schoolSql = schoolChanged.length
  ? [`UPDATE schools SET ${schoolChanged.map((c) => `${c} = ${lit(schoolUpdate[c])}`).join(', ')} WHERE id = ${lit(SCHOOL_ID)};`]
  : [];

// --------------------------------------------------------------------------------------- report

const skipped = allPrograms.filter((p) => !imported(p));
console.log(`${config.label} (${slug}) → ${target}${apply ? ' (apply)' : ' (dry run)'}; university ${SCHOOL_ID}`);
console.log(
  `programs: ${majors.length} imported (${majors.filter((m) => m.scored).length} with exam subjects, ` +
    `${majors.filter((m) => !m.scored).length} neutral), ${skipped.length} skipped (unverified)`
);
for (const p of skipped) console.log(`  skipped: ${p.id}`);
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
    SECTIONS.flatMap((section) => (map?.[section] ?? []).map((entry) => [`${section}/${entry.dataset_id}`, entry]))
  );
  // The first database written sets db_id; another database with a different id is noted next to it.
  const entry = (section, datasetId, id, extra) => {
    const before = previous.get(`${section}/${datasetId}`);
    const dbId = before?.db_id ?? id;
    const other = target === 'local' ? 'remote_id' : 'local_id';
    return {
      dataset_id: datasetId,
      ...extra,
      db_id: dbId,
      ...(dbId !== id ? { [`${target}_id`]: id } : before?.[other] ? { [other]: before[other] } : {}),
    };
  };
  const scoreCheck = {};
  const checkOf = ({ scored, row }) => {
    if (!scored) return 'neutral';
    if (row.secondary_subjects.length === 1 && row.secondary_subjects[0] === SKILL_EXAM) return 'skills_test';
    return row.secondary_cut_off_score == null ? 'one_minimum' : 'per_exam';
  };
  const next = {
    _meta: {
      description: `Maps each program, school, scholarship, dorm and date in the ${config.label} part of the batch-3 dataset (oyutan-batch3, unis/${slug}/data/*.json, after the 2026-10-18 gap fill) to our rows, so a yearly refresh can update by id instead of by name.`,
      dataset_verified_at: '2026-10-18',
      mapped_at: new Date().toISOString().slice(0, 10),
      university_id: SCHOOL_ID,
      how_to_use: `Run data-import/import-batch3.mjs ${slug} (--local / --remote, then --apply): it reads data-import/batch3/unis/${slug}/data and this file, matches rows by natural key first, upserts by id and never deletes. Rows missing here get a UUID derived from the dataset id, so every database gets the same id.`,
      score_check_values: {
        one_minimum: 'one minimum on the combined score (secondary_cut_off_score null): w1·exam1 + w2·exam2 ≥ cut_off_score',
        per_exam: 'each exam has its own minimum (cut_off_score, secondary_cut_off_score; 0 = unknown); weights 1/1 when the formula is not published (a plain sum), 0.5/0.5 for an average (ОТИС, СУИС ЭШ-only majors)',
        skills_test: "group 2 is the university's own skills test: only the group 1 minimum can be checked, otherwise \"Сургуулиас тодруулна уу\" (СУИС: weights 0.5/1 = ЭШ ÷ 2 + skills test)",
        neutral: 'no exam subjects or cut-offs (unclear / unknown split, three exams, or not in the 2026-27 table): "Сургуулиас тодруулна уу", rule in exam_note',
      },
      skipped_programs: skipped.map((p) => p.id),
      counts: {},
    },
    faculties: faculties.map(({ dataset, row }) => entry('faculties', dataset.id, row.id, { type: dataset.type, name: row.name, location: row.location })),
    programs: majors.map((major) => {
      const check = checkOf(major);
      scoreCheck[check] = (scoreCheck[check] ?? 0) + 1;
      return entry('programs', major.dataset.id, major.row.id, {
        dataset_school: major.dataset.school_id,
        faculty: faculties.find((f) => f.row.id === major.row.faculty_id).row.name,
        name: major.row.name,
        degree_type: major.row.degree_type,
        selection_type: major.row.selection_type,
        score_check: check,
      });
    }),
    scholarships: scholarshipRows.map(({ dataset, row }) => entry('scholarships', dataset.id, row.id, { name: row.name })),
    dorms: dormRows.map(({ dataset, row }) => entry('dorms', dataset.id, row.id, { name: row.name })),
    admission_dates: dateRows.map(({ dataset, row }) => entry('admission_dates', dataset.id, row.id, { event: row.event_name })),
  };
  next._meta.counts = {
    dataset_programs: allPrograms.length,
    imported_programs: majors.length,
    by_degree: Object.fromEntries(['BACHELOR', 'ASSOCIATE'].map((t) => [t, majors.filter((m) => m.row.degree_type === t).length])),
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
