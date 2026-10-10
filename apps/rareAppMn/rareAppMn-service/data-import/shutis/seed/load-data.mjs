// Loads every data/*.json file and validates it. Database-agnostic.
// Usage:  node seed/load-data.mjs        (prints counts + validation result; exit code 1 on problems)
//         import { loadAll, loadMeta, validate } from './load-data.mjs'
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

export const DATA_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');

export const STATUS_VALUES = new Set([
  'current', 'stale', 'conflicting', 'unverified', 'verify', 'estimate', 'verify_for_2027', 'unknown',
  'reference', 'approximate', 'partial',
]);
export const SPLIT_CONFIDENCE = new Set(['confirmed', 'likely', 'unclear', 'unknown']);

async function readJsonFiles(dir) {
  const files = (await readdir(dir)).filter((f) => f.endsWith('.json')).sort();
  const result = [];
  for (const file of files) {
    const json = JSON.parse(await readFile(path.join(dir, file), 'utf8'));
    result.push({ name: file.replace(/\.json$/, ''), json });
  }
  return result;
}

/** @returns {Promise<Record<string, object[]>>} e.g. { programs: [...], schools: [...] } */
export async function loadAll(dir = DATA_DIR) {
  const out = {};
  for (const { name, json } of await readJsonFiles(dir)) out[name] = json.records;
  return out;
}

/** @returns {Promise<Record<string, object>>} the _meta block of every file */
export async function loadMeta(dir = DATA_DIR) {
  const out = {};
  for (const { name, json } of await readJsonFiles(dir)) out[name] = json._meta;
  return out;
}

const isInt = (v) => Number.isInteger(v);

/** Returns a list of problems (empty array = valid). */
export function validate(data) {
  const problems = [];
  for (const [name, records] of Object.entries(data)) {
    if (!Array.isArray(records)) { problems.push(`${name}: records is not an array`); continue; }
    const seen = new Set();
    records.forEach((r, i) => {
      if (!r.id) problems.push(`${name}[${i}]: missing id`);
      else if (seen.has(r.id)) problems.push(`${name}: duplicate id ${r.id}`);
      seen.add(r.id);
      if (r.status && !STATUS_VALUES.has(r.status)) problems.push(`${name}/${r.id}: unknown status "${r.status}"`);
    });
  }

  const schoolIds = new Set((data.schools ?? []).map((s) => s.id));
  const programIds = new Set((data.programs ?? []).map((p) => p.id));
  const nameKeys = new Set();
  for (const p of data.programs ?? []) {
    const where = `programs/${p.id}`;
    if (!schoolIds.has(p.school_id)) problems.push(`${where}: unknown school_id ${p.school_id}`);
    const key = `${p.school_id}|${p.name_mn}`;
    if (nameKeys.has(key)) problems.push(`${where}: duplicate school + name "${p.name_mn}"`);
    nameKeys.add(key);
    if (!p.required_subjects_display_mn) problems.push(`${where}: missing required_subjects_display_mn`);
    const ex = p.exam_2026_2027;
    if (!ex) { problems.push(`${where}: missing exam_2026_2027`); continue; }
    if (!SPLIT_CONFIDENCE.has(ex.split_confidence)) problems.push(`${where}: bad split_confidence "${ex.split_confidence}"`);
    if (['confirmed', 'likely'].includes(ex.split_confidence)) {
      if (!ex.suuri_options?.length) problems.push(`${where}: confirmed/likely but no suuri_options`);
      if (!ex.dagaldah_options?.length) problems.push(`${where}: confirmed/likely but no dagaldah_options`);
      if (!isInt(ex.suuri_threshold)) problems.push(`${where}: suuri_threshold is not an integer`);
      if (p.threshold_score !== ex.suuri_threshold) problems.push(`${where}: threshold_score ≠ exam suuri_threshold`);
      if ((p.secondary_threshold_score ?? null) !== (ex.dagaldah_threshold ?? null)) {
        problems.push(`${where}: secondary_threshold_score ≠ exam dagaldah_threshold`);
      }
    }
    const est = p.tuition_2026_2027?.estimated_per_year;
    if (est && !(isInt(est.min) && isInt(est.max) && est.min <= est.max)) problems.push(`${where}: bad estimated_per_year`);
  }

  for (const j of data.joint_programs ?? []) {
    if (j.school_id && !schoolIds.has(j.school_id)) problems.push(`joint_programs/${j.id}: unknown school_id ${j.school_id}`);
    for (const pid of j.program_ids ?? []) {
      if (!programIds.has(pid)) problems.push(`joint_programs/${j.id}: unknown program id ${pid}`);
    }
  }
  for (const s of data.scholarships ?? []) {
    if (s.school_id && !schoolIds.has(s.school_id)) problems.push(`scholarships/${s.id}: unknown school_id ${s.school_id}`);
  }
  return problems;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const data = await loadAll();
  for (const [name, records] of Object.entries(data)) console.log(`${name.padEnd(20)} ${records.length} records`);
  const conf = {};
  for (const p of data.programs ?? []) {
    const c = p.exam_2026_2027?.split_confidence ?? 'none';
    conf[c] = (conf[c] ?? 0) + 1;
  }
  console.log('\nprograms by split_confidence:', JSON.stringify(conf));
  const problems = validate(data);
  console.log(problems.length ? `\n${problems.length} problem(s):\n- ${problems.join('\n- ')}` : '\nAll files valid ✔');
  process.exitCode = problems.length ? 1 : 0;
}
