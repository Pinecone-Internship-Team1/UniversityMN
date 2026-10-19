// Loads and validates every university package in ../unis/<slug>/data/*.json. Database-agnostic.
// Usage:  node seed/load-data.mjs            (all universities; exit code 1 on problems)
//         node seed/load-data.mjs ufe        (one university)
//         import { listUnis, loadAll, validate } from './load-data.mjs'
import { readFile, readdir, stat } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

export const UNIS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'unis');

export const STATUS_VALUES = new Set([
  'current', 'stale', 'conflicting', 'unverified', 'verify', 'estimate', 'verify_for_2027', 'unknown',
  'reference', 'approximate', 'partial',
]);
export const SPLIT_CONFIDENCE = new Set(['confirmed', 'likely', 'unclear', 'unknown']);
export const THRESHOLD_TYPES = new Set(['per_exam', 'total']);

export async function listUnis() {
  const out = [];
  for (const name of (await readdir(UNIS_DIR)).sort()) {
    try {
      if ((await stat(path.join(UNIS_DIR, name, 'data'))).isDirectory()) out.push(name);
    } catch { /* not a package */ }
  }
  return out;
}

async function readJsonFiles(dir) {
  const files = (await readdir(dir)).filter((f) => f.endsWith('.json')).sort();
  const result = [];
  for (const file of files) {
    const json = JSON.parse(await readFile(path.join(dir, file), 'utf8'));
    result.push({ name: file.replace(/\.json$/, ''), json });
  }
  return result;
}

/** @returns {Promise<Record<string, object[]>>} e.g. { programs: [...], schools: [...] } for one university */
export async function loadAll(slug) {
  const out = {};
  for (const { name, json } of await readJsonFiles(path.join(UNIS_DIR, slug, 'data'))) out[name] = json.records;
  return out;
}

export async function loadMeta(slug) {
  const out = {};
  for (const { name, json } of await readJsonFiles(path.join(UNIS_DIR, slug, 'data'))) out[name] = json._meta;
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
  for (const required of ['university', 'schools', 'programs']) {
    if (!data[required]?.length) problems.push(`${required}.json missing or empty`);
  }

  const schoolIds = new Set((data.schools ?? []).map((s) => s.id));
  const skippedSchools = new Set((data.schools ?? []).filter((s) => s.status === 'unverified').map((s) => s.id));
  const nameKeys = new Set();
  for (const p of data.programs ?? []) {
    const where = `programs/${p.id}`;
    if (!schoolIds.has(p.school_id)) problems.push(`${where}: unknown school_id ${p.school_id}`);
    if (p.status !== 'unverified' && skippedSchools.has(p.school_id)) {
      problems.push(`${where}: imported program in school ${p.school_id}, which is "unverified" and would be skipped`);
    }
    const key = `${p.school_id}|${p.name_mn}`;
    if (nameKeys.has(key)) problems.push(`${where}: duplicate school + name "${p.name_mn}"`);
    nameKeys.add(key);
    if (!p.required_subjects_display_mn) problems.push(`${where}: missing required_subjects_display_mn`);
    const ex = p.exam_2026_2027;
    if (!ex) { problems.push(`${where}: missing exam_2026_2027`); continue; }
    if (!SPLIT_CONFIDENCE.has(ex.split_confidence)) problems.push(`${where}: bad split_confidence "${ex.split_confidence}"`);
    const w = ex.weights;
    if (!w || !Number.isFinite(w.suuri) || !Number.isFinite(w.dagaldah)) problems.push(`${where}: exam weights missing`);
    if (['confirmed', 'likely'].includes(ex.split_confidence)) {
      if (!ex.suuri_options?.length) problems.push(`${where}: confirmed/likely but no suuri_options`);
      if (!ex.dagaldah_options?.length) problems.push(`${where}: confirmed/likely but no dagaldah_options`);
      if (!isInt(ex.suuri_threshold)) problems.push(`${where}: suuri_threshold is not an integer`);
      if (p.threshold_score !== ex.suuri_threshold) problems.push(`${where}: threshold_score ≠ exam suuri_threshold`);
      if ((p.secondary_threshold_score ?? null) !== (ex.dagaldah_threshold ?? null)) {
        problems.push(`${where}: secondary_threshold_score ≠ exam dagaldah_threshold`);
      }
      if (!THRESHOLD_TYPES.has(ex.threshold_type)) problems.push(`${where}: threshold_type must be per_exam | total`);
      if (ex.threshold_type === 'total' && ex.dagaldah_threshold != null) {
        problems.push(`${where}: threshold_type total but dagaldah_threshold is set`);
      }
      if (!['list', 'direct'].includes(ex.selection_type)) problems.push(`${where}: selection_type must be list | direct`);
      for (const [subj, min] of Object.entries(ex.subject_minimums ?? {})) {
        if (![...ex.suuri_options, ...ex.dagaldah_options].includes(subj)) problems.push(`${where}: subject_minimums names "${subj}", which is not an exam option`);
        if (!isInt(min)) problems.push(`${where}: subject_minimums.${subj} is not an integer`);
      }
      if (ex.formula_known === false && ex.threshold_type === 'total') {
        problems.push(`${where}: one combined minimum with an unknown formula can't be checked — make the row unknown`);
      }
      if (w && ex.score_formula && ex.formula_known !== false) {
        const expected = w.suuri === w.dagaldah && w.suuri === 1 ? 'sum' : w.suuri === w.dagaldah && w.suuri === 0.5 ? 'average' : 'weighted';
        if (ex.score_formula !== expected) problems.push(`${where}: score_formula "${ex.score_formula}" should be "${expected}" for these weights`);
      }
    }
    const est = p.tuition_2026_2027?.estimated_per_year;
    if (est && !(isInt(est.min) && isInt(est.max) && est.min <= est.max)) problems.push(`${where}: bad estimated_per_year`);
  }
  for (const s of data.scholarships ?? []) {
    if (s.school_id && !schoolIds.has(s.school_id)) problems.push(`scholarships/${s.id}: unknown school_id ${s.school_id}`);
  }
  return problems;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const only = process.argv[2];
  let total = 0;
  for (const slug of only ? [only] : await listUnis()) {
    const data = await loadAll(slug);
    const conf = {};
    for (const p of data.programs ?? []) {
      const c = p.exam_2026_2027?.split_confidence ?? 'none';
      conf[c] = (conf[c] ?? 0) + 1;
    }
    const counts = Object.entries(data).map(([n, r]) => `${n} ${r.length}`).join(', ');
    console.log(`\n[${slug}] ${counts}\n  programs by split_confidence: ${JSON.stringify(conf)}`);
    const problems = validate(data);
    total += problems.length;
    console.log(problems.length ? `  ${problems.length} problem(s):\n  - ${problems.join('\n  - ')}` : '  valid ✔');
  }
  console.log(total ? `\n${total} problem(s) in total` : '\nAll files valid ✔');
  process.exitCode = total ? 1 : 0;
}
