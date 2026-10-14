// Checks the АШУҮИС dataset (data-import/ashuuis/data) and rebuilds its guide's program appendix.
//
//   node data-import/ashuuis-data.mjs check   # validate every data file; exit code 1 on problems
//   node data-import/ashuuis-data.mjs guide   # rebuild "Хавсралт: Бүх хөтөлбөр" in ashuuis/GUIDE_MN.md
//
// Same rules as the dataset's seed/load-data.mjs and seed/guide-appendix.mjs, which aren't run here.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'ashuuis');
const DATA = path.join(ROOT, 'data');
const SKILL_EXAM = 'Ур чадварын шалгалт';

const STATUS_VALUES = new Set([
  'current', 'stale', 'conflicting', 'unverified', 'verify', 'estimate', 'verify_for_2027', 'unknown',
  'reference', 'approximate', 'partial',
]);
const SPLIT_CONFIDENCE = new Set(['confirmed', 'likely', 'unclear', 'unknown']);
const isScored = (exam) => ['confirmed', 'likely'].includes(exam?.split_confidence);

export function loadAll() {
  const data = {};
  for (const file of readdirSync(DATA).filter((f) => f.endsWith('.json')).sort()) {
    data[file.replace(/\.json$/, '')] = JSON.parse(readFileSync(path.join(DATA, file), 'utf8')).records;
  }
  return data;
}

/** Problems found in the dataset; an empty list means it is valid. */
export function validate(data) {
  const problems = [];
  for (const [name, records] of Object.entries(data)) {
    if (!Array.isArray(records)) {
      problems.push(`${name}: records is not an array`);
      continue;
    }
    const seen = new Set();
    records.forEach((record, index) => {
      if (!record.id) problems.push(`${name}[${index}]: missing id`);
      else if (seen.has(record.id)) problems.push(`${name}: duplicate id ${record.id}`);
      seen.add(record.id);
      if (record.status && !STATUS_VALUES.has(record.status)) problems.push(`${name}/${record.id}: unknown status "${record.status}"`);
    });
  }

  const schoolIds = new Set((data.schools ?? []).map((s) => s.id));
  const programIds = new Set((data.programs ?? []).map((p) => p.id));
  const names = new Set();
  for (const program of data.programs ?? []) {
    const where = `programs/${program.id}`;
    if (!schoolIds.has(program.school_id)) problems.push(`${where}: unknown school_id ${program.school_id}`);
    const key = `${program.school_id}|${program.name_mn}`;
    if (names.has(key)) problems.push(`${where}: duplicate school + name "${program.name_mn}"`);
    names.add(key);
    if (!program.required_subjects_display_mn) problems.push(`${where}: missing required_subjects_display_mn`);
    const exam = program.exam_2026_2027;
    if (!exam) {
      problems.push(`${where}: missing exam_2026_2027`);
      continue;
    }
    if (!SPLIT_CONFIDENCE.has(exam.split_confidence)) problems.push(`${where}: bad split_confidence "${exam.split_confidence}"`);
    if (isScored(exam)) {
      if (!exam.suuri_options?.length) problems.push(`${where}: confirmed/likely but no suuri_options`);
      if (!exam.dagaldah_options?.length) problems.push(`${where}: confirmed/likely but no dagaldah_options`);
      if (!Number.isInteger(exam.suuri_threshold)) problems.push(`${where}: suuri_threshold is not an integer`);
      if (program.threshold_score !== exam.suuri_threshold) problems.push(`${where}: threshold_score ≠ exam suuri_threshold`);
      if ((program.secondary_threshold_score ?? null) !== (exam.dagaldah_threshold ?? null)) {
        problems.push(`${where}: secondary_threshold_score ≠ exam dagaldah_threshold`);
      }
      if (!['list', 'direct'].includes(exam.selection_type)) problems.push(`${where}: confirmed/likely but selection_type is not list|direct`);
    }
    const weights = exam.weights;
    if (!weights || !Number.isFinite(weights.suuri) || !Number.isFinite(weights.dagaldah)) problems.push(`${where}: exam weights missing`);
    const estimate = program.tuition_2026_2027?.estimated_per_year;
    if (estimate && !(Number.isInteger(estimate.min) && Number.isInteger(estimate.max) && estimate.min <= estimate.max)) {
      problems.push(`${where}: bad estimated_per_year`);
    }
  }

  for (const joint of data.joint_programs ?? []) {
    if (joint.school_id && !schoolIds.has(joint.school_id)) problems.push(`joint_programs/${joint.id}: unknown school_id ${joint.school_id}`);
    for (const id of joint.program_ids ?? []) {
      if (!programIds.has(id)) problems.push(`joint_programs/${joint.id}: unknown program id ${id}`);
    }
  }
  for (const scholarship of data.scholarships ?? []) {
    if (scholarship.school_id && !schoolIds.has(scholarship.school_id)) {
      problems.push(`scholarships/${scholarship.id}: unknown school_id ${scholarship.school_id}`);
    }
  }
  return problems;
}

const GUIDE_HEAD = '## Хавсралт: Бүх хөтөлбөр';
const SCHOOL_ORDER = [
  'mnums-med', 'mnums-traditional', 'mnums-dental', 'mnums-pharmacy', 'mnums-bio', 'mnums-public-health',
  'mnums-nursing', 'mnums-darkhan', 'mnums-govi-altai', 'mnums-dornogovi', 'mnums-arkhangai',
];
const CONFIDENCE_MARK = { confirmed: '✓', likely: '≈', unclear: '?', unknown: '?' };

function guideAppendix(data) {
  const schools = new Map(data.schools.map((s) => [s.id, s]));
  const money = (value) => (value == null ? '—' : `${(value / 1e6).toFixed(2)} сая`);
  const group = (subjects, threshold) => {
    if (!subjects?.length) return 'тодорхойгүй';
    const names = subjects.map((s) => (s === SKILL_EXAM ? 'Ур чадварын шалгалт†' : s)).join(' / ');
    return threshold ? `**${names}** (${threshold})` : names;
  };
  const STATUS_TAG = { verify: ' *(тодруулах)*', conflicting: ' *(эх сурвалж зөрүүтэй)*', unverified: ' *(баталгаажаагүй)*' };
  const marks = (p) => [p.priority?.is_priority_field ? 'Т' : null, p.priority?.is_in_demand_field ? 'Э' : null].filter(Boolean).join(', ');
  const selection = (p) => ({ list: 'Жагсаалт', direct: 'Шууд' })[p.exam_2026_2027?.selection_type] ?? '—';

  const counts = { confirmed: 0, likely: 0, unclear: 0, unknown: 0 };
  let total = 0;
  const lines = [
    GUIDE_HEAD, '',
    'Эх сурвалж: mnums.edu.mn/admission/requirements ба 2026-2027 оны элсэлтийн журам А/136 (босго, сонголтын төрөл), сургууль тус бүрийн хуудас (хугацаа, төлбөр), салбар сургуулиудын сайт.', '',
    '- **1-р, 2-р шалгалт:** бүлэг бүрээс хамгийн өндөр оноотой НЭГ хичээл тооцогдоно; хаалтанд тухайн бүлгийн босго. Оноо = хоёр шалгалтын нийлбэр.',
    '- **†** Ур чадварын шалгалтыг АШУҮИС өөрөө авна (биологийн 100 онооны тест, 60+ тэнцэнэ).',
    '- **Сонголт:** Жагсаалт = 8 хүртэл хөтөлбөр сонгож, нийлбэр оноогоор өрсөлдөнө; Шууд = хоёр босгыг хангавал шууд элсэнэ.',
    '- **Тэмдэг:** Т — тэргүүлэх, Э — эрэлттэй. **Жилд:** 2026-2027 оны 1 жилийн албан ёсны төлбөр. **Итгэл:** ✓ албан ёсны хүснэгтээс, ? тодорхойгүй.', '',
  ];
  for (const schoolId of SCHOOL_ORDER) {
    const school = schools.get(schoolId);
    const rows = data.programs.filter((p) => p.school_id === schoolId);
    if (!school || rows.length === 0) continue;
    lines.push('', `### ${school.name_mn}${school.type === 'branch' ? ` — ${school.location_mn}` : ''}`, '',
      '| Хөтөлбөр | Түвшин | 1-р шалгалт | 2-р шалгалт | Сонголт | Тэмдэг | Жил | Жилд | Итгэл |',
      '|---|---|---|---|---|---|---|---|---|');
    for (const p of rows) {
      const exam = p.exam_2026_2027 ?? {};
      const confidence = exam.split_confidence ?? 'unknown';
      counts[confidence] = (counts[confidence] ?? 0) + 1;
      total += 1;
      lines.push(
        `| ${p.name_mn}${STATUS_TAG[p.status] ?? ''} | ${p.degree === 'Дэд бакалавр' ? 'Дэд бакалавр' : 'Бакалавр'} | ` +
          `${group(exam.suuri_options, exam.suuri_threshold)} | ${group(exam.dagaldah_options, exam.dagaldah_threshold)} | ` +
          `${selection(p)} | ${marks(p)} | ${p.duration_years ?? '—'} | ${money(p.tuition_2026_2027?.per_year)} | ${CONFIDENCE_MARK[confidence] ?? '?'} |`
      );
    }
  }
  lines.push('', `Нийт: ${total} хөтөлбөр. Салбар сургуулиудын хичээл, босгыг 2026-2027 оны элсэлтийн журам (А/136)-аас авав; салбарын төлбөр нийтлэгдээгүй.`, '');
  return { text: lines.join('\n'), total, counts };
}

function rebuildGuide(data) {
  const file = path.join(ROOT, 'GUIDE_MN.md');
  const { text: appendix, total, counts } = guideAppendix(data);
  let guide = readFileSync(file, 'utf8');
  const at = guide.indexOf(GUIDE_HEAD);
  if (at < 0) throw new Error('appendix heading not found in GUIDE_MN.md');
  guide = guide.slice(0, at) + appendix;
  guide = guide.replace(
    /^- Нийт \d+ хөтөлбөрөөс .*$/m,
    `- Нийт ${total} хөтөлбөрөөс **${counts.confirmed}** нь албан ёсны хүснэгтээс (✓), **${counts.likely}** магадлалтай (≈), **${counts.unclear + counts.unknown}** нь тодорхойгүй (?).`
  );
  writeFileSync(file, guide);
  console.log(`GUIDE_MN.md appendix rebuilt: ${total} programs`, counts);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const command = process.argv[2];
  const data = loadAll();
  if (command === 'check') {
    for (const [name, records] of Object.entries(data)) console.log(`${name.padEnd(20)} ${records.length} records`);
    const confidence = {};
    for (const p of data.programs ?? []) {
      const c = p.exam_2026_2027?.split_confidence ?? 'none';
      confidence[c] = (confidence[c] ?? 0) + 1;
    }
    console.log('\nprograms by split_confidence:', JSON.stringify(confidence));
    const problems = validate(data);
    console.log(problems.length ? `\n${problems.length} problem(s):\n- ${problems.join('\n- ')}` : '\nAll files valid ✔');
    process.exitCode = problems.length ? 1 : 0;
  } else if (command === 'guide') {
    rebuildGuide(data);
  } else {
    throw new Error('usage: node data-import/ashuuis-data.mjs check|guide');
  }
}
