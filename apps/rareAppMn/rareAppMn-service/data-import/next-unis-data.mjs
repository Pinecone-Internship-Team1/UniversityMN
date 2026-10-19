// Checks the next-universities dataset (data-import/next-unis/unis/<slug>/data), writes exam data in its shape,
// runs its reference score check and rebuilds each university's GUIDE_MN.md.
//
//   node data-import/next-unis-data.mjs check [slug]                     # validate; exit code 1 on problems
//   node data-import/next-unis-data.mjs guide [slug]                     # rebuild unis/<slug>/GUIDE_MN.md
//   node data-import/next-unis-data.mjs eligibility <slug> Математик=620 "Англи хэл"=540
//
// Same rules as the dataset's seed/load-data.mjs, seed/exam-tools.mjs, seed/eligibility.mjs and
// seed/build-guide.mjs, which aren't run here (Claude Code's permission check blocks downloaded scripts).
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const UNIS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'next-unis', 'unis');
export const SKILL_EXAM = 'Ур чадварын шалгалт';

const STATUS_VALUES = new Set([
  'current', 'stale', 'conflicting', 'unverified', 'verify', 'estimate', 'verify_for_2027', 'unknown',
  'reference', 'approximate', 'partial',
]);
const SPLIT_CONFIDENCE = new Set(['confirmed', 'likely', 'unclear', 'unknown']);
const THRESHOLD_TYPES = new Set(['per_exam', 'total']);
const isScored = (exam) => ['confirmed', 'likely'].includes(exam?.split_confidence);
const uniq = (items) => [...new Set(items)];

// -------------------------------------------------------------------------------------------- loading

export function listUnis() {
  return readdirSync(UNIS_DIR)
    .sort()
    .filter((name) => {
      try {
        return statSync(path.join(UNIS_DIR, name, 'data')).isDirectory();
      } catch {
        return false;
      }
    });
}

const dataFiles = (slug) =>
  readdirSync(path.join(UNIS_DIR, slug, 'data'))
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((file) => ({ name: file.replace(/\.json$/, ''), file: path.join(UNIS_DIR, slug, 'data', file) }));

/** `{ programs: [...], schools: [...], ... }` for one university. */
export function loadAll(slug) {
  return Object.fromEntries(dataFiles(slug).map(({ name, file }) => [name, JSON.parse(readFileSync(file, 'utf8')).records]));
}

/** Reads one data file whole (`{ _meta, records }`), so it can be edited and written back. */
export function readFile(slug, name) {
  return JSON.parse(readFileSync(path.join(UNIS_DIR, slug, 'data', `${name}.json`), 'utf8'));
}

export function writeFile(slug, name, json) {
  writeFileSync(path.join(UNIS_DIR, slug, 'data', `${name}.json`), JSON.stringify(json, null, 2) + '\n');
}

// ----------------------------------------------------------------------------------------- validation

/** Problems found in one university's data; an empty list means it is valid. */
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
  for (const required of ['university', 'schools', 'programs']) {
    if (!data[required]?.length) problems.push(`${required}.json missing or empty`);
  }

  const schoolIds = new Set((data.schools ?? []).map((s) => s.id));
  const skippedSchools = new Set((data.schools ?? []).filter((s) => s.status === 'unverified').map((s) => s.id));
  const names = new Set();
  for (const program of data.programs ?? []) {
    const where = `programs/${program.id}`;
    if (!schoolIds.has(program.school_id)) problems.push(`${where}: unknown school_id ${program.school_id}`);
    if (program.status !== 'unverified' && skippedSchools.has(program.school_id)) {
      problems.push(`${where}: imported program in school ${program.school_id}, which is "unverified" and would be skipped`);
    }
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
    const weights = exam.weights;
    if (!weights || !Number.isFinite(weights.suuri) || !Number.isFinite(weights.dagaldah)) problems.push(`${where}: exam weights missing`);
    if (isScored(exam)) {
      if (!exam.suuri_options?.length) problems.push(`${where}: confirmed/likely but no suuri_options`);
      if (!exam.dagaldah_options?.length) problems.push(`${where}: confirmed/likely but no dagaldah_options`);
      if (!Number.isInteger(exam.suuri_threshold)) problems.push(`${where}: suuri_threshold is not an integer`);
      if (program.threshold_score !== exam.suuri_threshold) problems.push(`${where}: threshold_score ≠ exam suuri_threshold`);
      if ((program.secondary_threshold_score ?? null) !== (exam.dagaldah_threshold ?? null)) {
        problems.push(`${where}: secondary_threshold_score ≠ exam dagaldah_threshold`);
      }
      if (!THRESHOLD_TYPES.has(exam.threshold_type)) problems.push(`${where}: threshold_type must be per_exam | total`);
      if (exam.threshold_type === 'total' && exam.dagaldah_threshold != null) {
        problems.push(`${where}: threshold_type total but dagaldah_threshold is set`);
      }
      if (!['list', 'direct'].includes(exam.selection_type)) problems.push(`${where}: selection_type must be list | direct`);
      for (const [subject, minimum] of Object.entries(exam.subject_minimums ?? {})) {
        if (![...exam.suuri_options, ...exam.dagaldah_options].includes(subject)) {
          problems.push(`${where}: subject_minimums names "${subject}", which is not an exam option`);
        }
        if (!Number.isInteger(minimum)) problems.push(`${where}: subject_minimums.${subject} is not an integer`);
      }
      if (exam.formula_known === false && exam.threshold_type === 'total') {
        problems.push(`${where}: one combined minimum with an unknown formula can't be checked — make the row unknown`);
      }
      if (weights && exam.score_formula && exam.formula_known !== false) {
        const expected = formulaKind(weights);
        if (exam.score_formula !== expected) problems.push(`${where}: score_formula "${exam.score_formula}" should be "${expected}" for these weights`);
      }
    }
    const estimate = program.tuition_2026_2027?.estimated_per_year;
    if (estimate && !(Number.isInteger(estimate.min) && Number.isInteger(estimate.max) && estimate.min <= estimate.max)) {
      problems.push(`${where}: bad estimated_per_year`);
    }
  }
  for (const scholarship of data.scholarships ?? []) {
    if (scholarship.school_id && !schoolIds.has(scholarship.school_id)) {
      problems.push(`scholarships/${scholarship.id}: unknown school_id ${scholarship.school_id}`);
    }
  }
  return problems;
}

// ---------------------------------------------------------------------------------------- exam blocks

const weightsOf = (weights) => [weights?.suuri ?? 0.7, weights?.dagaldah ?? 0.3];
const formulaKind = (weights) => {
  const [w1, w2] = weightsOf(weights);
  return w1 === w2 && w1 === 1 ? 'sum' : w1 === w2 && w1 === 0.5 ? 'average' : 'weighted';
};
const joinOr = (items) => (items.length === 1 ? items[0] : `${items.slice(0, -1).join(', ')} эсвэл ${items.at(-1)}`);
const groupText = (group) => (group.length === 1 && group[0] === SKILL_EXAM ? 'Ур чадварын шалгалт (их сургууль өөрөө авна)' : joinOr(group));

/** Exam names: "1-р шалгалт" / "2-р шалгалт" when the exams weigh the same or the formula is unknown. */
export function labels(weights, formulaKnown = true) {
  const [w1, w2] = weightsOf(weights);
  if (!formulaKnown || w1 === w2) return ['1-р шалгалт', '2-р шалгалт'];
  const share = (w) => Math.round((w / (w1 + w2)) * 100);
  return [`Суурь (${share(w1)}%)`, `Дагалдах (${share(w2)}%)`];
}

/** The combined-score formula in plain Mongolian. */
export function formulaMn(weights, formulaKnown = true) {
  if (!formulaKnown) return 'онооны томьёо зарлаагүй';
  const kind = formulaKind(weights);
  if (kind === 'sum') return 'хоёр шалгалтын онооны нийлбэр';
  if (kind === 'average') return 'хоёр шалгалтын онооны дундаж';
  const [w1, w2] = weightsOf(weights);
  const [l1, l2] = labels(weights);
  return `${w1} × ${l1.split(' ')[0].toLowerCase()} + ${w2} × ${l2.split(' ')[0].toLowerCase()}`;
}

/** What the combined score is called: "дундаж" (0.5/0.5), "нийлбэр" (1/1) or "тооцсон". */
export function scoreKind(weights) {
  const kind = formulaKind(weights);
  return kind === 'average' ? 'дундаж' : kind === 'sum' ? 'нийлбэр' : 'тооцсон';
}

/** "дундаж ≥ 580" for one combined minimum, "490 / 450" for a minimum per exam. */
export function thresholdText({ threshold1, threshold2, weights, thresholdType }) {
  if (thresholdType !== 'total') return `${threshold1 ?? '—'} / ${threshold2 ?? '—'}`;
  return `${scoreKind(weights)} ≥ ${threshold1 ?? '—'}`;
}

/** One plain sentence a student understands. */
export function buildDisplay({ group1, group2, threshold1, threshold2, weights, thresholdType, selection, subjectMinimums, formulaKnown = true }) {
  const [l1, l2] = labels(weights, formulaKnown);
  let text;
  if (thresholdType === 'total') {
    text = `${l1}: ${groupText(group1)}. ${l2}: ${groupText(group2)}. Тооцсон оноо (${formulaMn(weights, formulaKnown)}) — босго ${threshold1}.`;
  } else {
    text = `${l1}: ${groupText(group1)} — босго ${threshold1}. ${l2}: ${groupText(group2)}${threshold2 ? ` — босго ${threshold2}` : ''}.`;
    if (!formulaKnown) text += ' Хоёр шалгалтын оноог хэрхэн нийлүүлэхийг (онооны томьёо) сургууль зарлаагүй.';
  }
  for (const [subject, minimum] of Object.entries(subjectMinimums ?? {})) text += ` Үүнээс гадна ${subject} дор хаяж ${minimum}.`;
  if (selection === 'direct') text += ' Босгыг хангавал шууд элсэх эрхтэй.';
  return text;
}

/** An exam_2026_2027 block (see seed/exam-tools.mjs for the fields). */
export function buildExam({
  group1, group2, threshold1, threshold2 = null, weights, thresholdType, selection = 'list', swapSubjects = [],
  subjectMinimums = null, formulaKnown = true, sourceUrl, note, confidence = 'confirmed',
}) {
  if (!formulaKnown && thresholdType === 'total') throw new Error("one combined minimum without a formula can't be checked — leave the row unknown");
  return {
    subjects_to_prepare: uniq([...group1, ...group2]),
    suuri_options: group1,
    dagaldah_options: uniq([...group2, ...swapSubjects]),
    swap_subjects: swapSubjects.length ? swapSubjects : null,
    suuri_threshold: threshold1,
    dagaldah_threshold: thresholdType === 'total' ? null : threshold2,
    threshold_type: thresholdType,
    subject_minimums: subjectMinimums,
    weights,
    formula_known: formulaKnown,
    score_formula: formulaKnown ? formulaKind(weights) : null,
    selection_type: selection,
    split_confidence: confidence,
    note_mn: note ?? null,
    source_url: sourceUrl,
    status: 'current',
  };
}

// Sentences that only describe what was missing before a gap was filled; dropped when real values are written.
const STALE_NOTE = new RegExp(
  [
    'зөвхөн зураг', 'уншигд', 'OCR', 'тодорхойгүй', 'олдсонгүй', 'баталгаажаагүй', 'импортлохгүй', 'нийтлээгүй',
    'нийтлэгдээгүй', 'заагаагүй', 'хуучирсан', 'хуудаснаас авав', 'placeholder', 'орлуулагч', 'validator',
  ].join('|'),
  'iu'
);

/** The sentences of an old note that are still true once the exam data is filled. */
export function durableNote(note) {
  return (note ?? '')
    .split(/(?<=[.!?])\s+(?=\S)/u)
    .map((s) => s.trim())
    .filter((s) => s && !STALE_NOTE.test(s))
    .join(' ')
    .trim();
}

/** Writes an exam block into a programs.json record and keeps the derived fields in sync. */
export function applyExam(record, exam, { today }) {
  const oldExtra = durableNote(record.exam_2026_2027?.note_mn);
  if (oldExtra && !(exam.note_mn ?? '').includes(oldExtra)) exam.note_mn = [exam.note_mn, oldExtra].filter(Boolean).join(' ');
  record.exam_2026_2027 = exam;
  record.notes_mn = durableNote(record.notes_mn) || null;
  record.threshold_score = exam.suuri_threshold;
  record.secondary_threshold_score = exam.dagaldah_threshold;
  record.selection_type = exam.selection_type;
  const swap = exam.swap_subjects ?? [];
  record.required_subjects_display_mn = buildDisplay({
    group1: exam.suuri_options,
    group2: exam.dagaldah_options.filter((d) => !swap.includes(d)),
    threshold1: exam.suuri_threshold,
    threshold2: exam.dagaldah_threshold,
    weights: exam.weights,
    thresholdType: exam.threshold_type,
    selection: exam.selection_type,
    subjectMinimums: exam.subject_minimums,
    formulaKnown: exam.formula_known !== false,
  });
  record.aptitude_test_required = exam.dagaldah_options.includes(SKILL_EXAM);
  record.source_urls = uniq([...(record.source_urls ?? []), exam.source_url]);
  record.verified_at = today;
  // A row filled from a clearly read 2026-27 table no longer needs the "verify" warning.
  if (exam.split_confidence === 'confirmed' || !['verify', 'conflicting'].includes(record.status)) record.status = 'current';
  return record;
}

// ------------------------------------------------------------------------------- reference score check

export const VERDICT = { ELIGIBLE: 'eligible', BELOW: 'below_threshold', MISSING: 'missing_scores', NEUTRAL: 'neutral' };

/** The dataset's reference verdict for one program and a student's scores. */
export function checkProgram(program, scores) {
  const exam = program.exam_2026_2027;
  if (!exam || !isScored(exam) || !exam.suuri_options?.length || !exam.dagaldah_options?.length) {
    return { verdict: VERDICT.NEUTRAL, message: 'Сургуулиас тодруулна уу' };
  }
  const [w1, w2] = weightsOf(exam.weights);
  const total = exam.threshold_type === 'total';
  const t1 = exam.suuri_threshold;
  const t2 = exam.dagaldah_threshold ?? 0;
  const minimums = Object.entries(exam.subject_minimums ?? {});
  const has = (subject) => Number.isFinite(scores[subject]);
  const missedMinimums = (s, d) =>
    minimums.filter(([subject, min]) => (subject === s || subject === d) && scores[subject] < min).map(([subject, min]) => `${subject} ${min}`);
  const passText = exam.selection_type === 'direct' ? 'Босго давсан — шууд элсэх боломжтой' : 'Босго давсан — өрсөлдөх эрхтэй';

  const second = exam.dagaldah_options.filter((d) => d !== SKILL_EXAM);
  if (second.length === 0) {
    const entered = exam.suuri_options.filter(has).map((s) => scores[s]);
    if (!total && entered.length && Math.max(...entered) < t1) return { verdict: VERDICT.BELOW, message: `1-р шалгалт ${t1}-аас доош` };
    return { verdict: VERDICT.NEUTRAL, message: 'Ур чадварын шалгалтыг их сургууль өөрөө авна — сургуулиас тодруулна уу' };
  }

  let best = null;
  let bestFailing = null;
  for (const s of exam.suuri_options) {
    for (const d of second) {
      if (s === d || !has(s) || !has(d)) continue;
      const score = Math.round((w1 * scores[s] + w2 * scores[d]) * 10) / 10;
      const pair = { suuri: s, dagaldah: d, score, normalized: Math.round((score / (w1 + w2)) * 10) / 10 };
      const extra = missedMinimums(s, d);
      const passes = (total ? score >= t1 : scores[s] >= t1 && scores[d] >= t2) && extra.length === 0;
      if (passes) {
        if (!best || score > best.score) best = pair;
      } else if (!bestFailing || score > bestFailing.score) {
        const short = total
          ? [score < t1 ? `${scoreKind(exam.weights)} оноо ${t1}` : null, ...extra].filter(Boolean)
          : [scores[s] < t1 ? `${s} ${t1}` : null, scores[d] < t2 ? `${d} ${t2}` : null, ...extra].filter(Boolean);
        bestFailing = { ...pair, short };
      }
    }
  }
  if (best) return { verdict: VERDICT.ELIGIBLE, message: passText, ...best };
  if (bestFailing) {
    const firstPasses = total || exam.suuri_options.some((s) => has(s) && scores[s] >= t1);
    const secondPasses = total || second.some((d) => has(d) && scores[d] >= t2);
    const untried = uniq([
      ...(firstPasses ? [] : exam.suuri_options.filter((s) => !has(s))),
      ...(secondPasses ? [] : second.filter((d) => !has(d))),
    ]);
    return {
      verdict: VERDICT.BELOW,
      message: `Босго хүрэхгүй: ${bestFailing.short.join(', ')}`,
      ...bestFailing,
      ...(untried.length ? { couldPassWith: untried } : {}),
    };
  }
  return { verdict: VERDICT.MISSING, message: `Оноо оруулна уу: 1-р (${exam.suuri_options.join(' / ')}), 2-р (${second.join(' / ')})` };
}

// ---------------------------------------------------------------------------------------------- guide

const CONFIDENCE_MARK = { confirmed: '✓', likely: '≈', unclear: '?', unknown: '?' };
const money = (value) => (Number.isFinite(value) ? `${(value / 1e6).toFixed(2)} сая ₮` : '—');
const cell = (value) => String(value ?? '—').replace(/\|/g, '/').replace(/\n/g, ' ');
const subjectList = (subjects) =>
  subjects?.length ? subjects.map((s) => (s === SKILL_EXAM ? 'Ур чадварын шалгалт†' : s)).join(' / ') : 'тодорхойгүй';

/** One line per kind of score rule in use, e.g. "- **43 хөтөлбөр:** оноо = …; дундаж онооны НЭГ босготой …". */
function formulaLines(programs) {
  const kinds = new Map();
  for (const program of programs) {
    const exam = program.exam_2026_2027;
    if (!isScored(exam)) continue;
    const weights = exam.weights ?? { suuri: 0.7, dagaldah: 0.3 };
    const key = `${weights.suuri}/${weights.dagaldah}/${exam.threshold_type}/${exam.formula_known !== false}`;
    const kind = kinds.get(key) ?? { n: 0, likely: 0 };
    kind.n += 1;
    if (exam.split_confidence === 'likely') kind.likely += 1;
    kinds.set(key, kind);
  }
  return [...kinds.entries()]
    .sort((a, b) => b[1].n - a[1].n)
    .map(([key, { n, likely }]) => {
      const [w1, w2, type, known] = key.split('/');
      const weights = { suuri: Number(w1), dagaldah: Number(w2) };
      const kind = scoreKind(weights);
      const rule =
        type === 'total'
          ? `${kind} онооны НЭГ босготой (${kind} оноо ≥ босго)`
          : 'шалгалт тус бүр өөрийн босготой (аль нэг нь доош бол элсэх эрхгүй)';
      const note = likely ? ` (${likely} нь албан ёсны хүснэгтээс биш — магадлалтай)` : '';
      const formula = known === 'true' ? `оноо = ${formulaMn(weights)}` : 'онооны томьёог сургууль зарлаагүй';
      return `- **${n} хөтөлбөр${note}:** ${formula}; ${rule}.`;
    })
    .join('\n');
}

export function buildGuide(slug, d) {
  const u = d.university?.[0] ?? {};
  const sidebar = u.sidebar_suggestion ?? {};
  const schools = new Map((d.schools ?? []).map((s) => [s.id, s]));
  const programs = d.programs ?? [];
  const admission = (d.admission_2026 ?? [])[0] ?? {};
  const short = u.short_name_mn ?? slug;
  const out = [];

  out.push(`# ${short}-д элсэх гарын авлага — 12-р анги төгсөгчдөд`, '');
  out.push(`> ${u.name_mn ?? short}${u.name_en ? ` (${u.name_en})` : ''}.`);
  out.push(`> Мэдээллийг ${u.verified_at ?? ''}-нд албан ёсны сайт болон мэдээний сайтаас цуглуулав.`);
  out.push(
    `> **Анхаар:** 2027 оны элсэлтийн огноо, босго хараахан зарлагдаагүй — доорх нь 2026-2027 оны элсэлтийн мэдээлэл. Бүртгүүлэхээсээ өмнө ${u.admission_website ?? u.website ?? 'их сургуулийн сайт'}-аас шалгаарай.`,
    '',
    '---',
    ''
  );

  out.push('## 1. Товчхондоо', '', u.overview_mn ?? '—', '');
  out.push('## 2. Оноо хэрхэн тооцдог вэ', '');
  // The university-level sentence is skipped when it only says "unknown" but some programs are now filled.
  const knownRows = programs.some((p) => isScored(p.exam_2026_2027));
  const saysUnknown = /тодорхойгүй|чадаагүй|олдсонгүй/iu.test(admission.score_formula_mn ?? '');
  if (admission.score_formula_mn && !(knownRows && saysUnknown)) out.push(admission.score_formula_mn, '');
  const someSubjects = programs.some((p) => p.exam_2026_2027?.suuri_options?.length);
  out.push(
    formulaLines(programs) ||
      (someSubjects
        ? '- Хөтөлбөр бүрийн шалгалтын хичээл Хавсралтад бий; 2026-2027 оны босгыг сургуулиас тодруулна уу.'
        : '- Шалгалтын хичээл, босгыг сургуулиас тодруулна уу.'),
    ''
  );
  out.push('- Бүлэг бүрээс хамгийн өндөр оноотой НЭГ хичээл тооцогдоно. **Босго давсан нь элссэн гэсэн үг биш** — суудлыг онооны дарааллаар дүүргэнэ.', '');

  const steps = admission.steps ?? [];
  if (steps.length || admission.steps_mn?.length) {
    out.push('## 3. Элсэх алхам', '');
    if (steps.length) steps.forEach((step, i) => out.push(`${i + 1}. **${step.title_mn ?? ''}** — ${step.detail_mn ?? ''}`));
    else admission.steps_mn.forEach((step, i) => out.push(`${i + 1}. ${step}`));
    if (admission.system_url) out.push('', `Бүртгэлийн систем: ${admission.system_url}`);
    out.push('');
  }

  const dates = (d.admission_dates ?? []).filter((r) => (r.start || r.end) && !['stale', 'unverified'].includes(r.status));
  if (dates.length) {
    out.push('## 4. Он сарын хуваарь', '', '| Юу | Эхлэх | Дуусах |', '|---|---|---|');
    for (const r of dates) out.push(`| ${cell(r.event_mn)} | ${cell(r.start)} | ${cell(r.end)} |`);
    out.push('');
  }

  out.push('## 5. Сургалтын төлбөр', '');
  if (sidebar.tuition_text_mn) out.push(`- **Жилд ойролцоогоор:** ${sidebar.tuition_text_mn}`);
  for (const t of d.tuition_2026_2027 ?? []) {
    const bits = [
      t.label_mn,
      t.price_per_credit ? `1 кредит ${t.price_per_credit.toLocaleString('en-US')}₮` : null,
      t.price_per_year ? `жилд ${t.price_per_year.toLocaleString('en-US')}₮` : null,
      t.note_mn,
    ].filter(Boolean);
    if (bits.length) out.push(`- ${bits.join(' — ')}`);
  }
  out.push('- Хөтөлбөр тус бүрийн жилийн төлбөр Хавсралтад бий.', '');

  if (d.scholarships?.length) {
    out.push('## 6. Тэтгэлэг, хөнгөлөлт', '', '| Нэр | Хэмжээ | Хэнд | Хугацаа |', '|---|---|---|---|');
    for (const r of d.scholarships) out.push(`| ${cell(r.name_mn)} | ${cell(r.coverage_mn)} | ${cell(r.requirements_mn)} | ${cell(r.deadline_mn)} |`);
    out.push('');
  }

  out.push('## 7. Оюутны байр', '');
  if (sidebar.dorm_howto_mn) out.push(sidebar.dorm_howto_mn, '');
  const buildings = (d.dorms ?? []).filter((r) => r.record_type === 'building');
  if (buildings.length) {
    out.push('| Байр | Байршил | Ор | Үнэ |', '|---|---|---|---|');
    for (const b of buildings) {
      const when = [b.price_year, b.status === 'stale' ? 'хуучин мэдээлэл' : null].filter(Boolean).join(', ');
      const price = b.price_per_year
        ? `${b.price_per_year.toLocaleString('en-US')}₮${when ? ` (${when})` : ''}`
        : (b.price_per_year_note_mn ?? '—');
      out.push(`| ${cell(b.name_mn)} | ${cell(b.location_mn)} | ${cell(b.capacity)} | ${cell(price)} |`);
    }
    out.push('');
  }

  out.push('## 8. Холбоо барих', '');
  const contacts = u.contacts ?? {};
  if (contacts.address_mn) out.push(`- **Хаяг:** ${contacts.address_mn}`);
  if (contacts.phones?.length) out.push(`- **Утас:** ${contacts.phones.join(', ')}`);
  const emails = contacts.emails ? Object.values(contacts.emails).filter(Boolean) : [];
  if (emails.length) out.push(`- **И-мэйл:** ${emails.join(', ')}`);
  if (u.website) out.push(`- **Сайт:** ${u.website}`);
  const branches = (d.schools ?? []).filter((s) => s.type === 'branch');
  if (branches.length) {
    out.push('', '| Салбар | Байршил | Утас |', '|---|---|---|');
    for (const b of branches) out.push(`| ${cell(b.name_mn)} | ${cell(b.location_mn)} | ${cell(b.contacts?.phone)} |`);
  }
  out.push('');

  const counts = { confirmed: 0, likely: 0, unclear: 0, unknown: 0 };
  for (const p of programs) counts[p.exam_2026_2027?.split_confidence ?? 'unknown'] += 1;
  const noFee = programs.filter((p) => !p.tuition_2026_2027?.per_year && !p.tuition_2026_2027?.estimated_per_year).length;
  const estimatedFee = programs.filter((p) => !p.tuition_2026_2027?.per_year && p.tuition_2026_2027?.estimated_per_year).length;
  out.push('## 9. Анхааруулга', '');
  out.push(
    `- Нийт ${programs.length} хөтөлбөрөөс **${counts.confirmed}** нь албан ёсны хүснэгтээс (✓), **${counts.likely}** магадлалтай (≈), **${counts.unclear + counts.unknown}** нь шалгалтын хичээл эсвэл босго тодорхойгүй (?) — эдгээрийг сургуулиас тодруулна уу.`
  );
  if (estimatedFee) out.push(`- ${estimatedFee} хөтөлбөрийн жилийн төлбөр нь албан ёсны дүн биш, тооцоо (≈).`);
  if (noFee) out.push(`- ${noFee} хөтөлбөрийн төлбөр тодорхойгүй.`);
  out.push('- 2027 оны огноо, босго өөрчлөгдөж болно.', '');

  out.push('## Хавсралт: Бүх хөтөлбөр', '');
  out.push('- **Босго:** «520 / 500» — 1-р / 2-р шалгалт тус бүрийн доод оноо; «дундаж ≥ 580», «нийлбэр ≥ 1100», «тооцсон ≥ 650» — хоёр шалгалтыг нийлүүлсэн онооны НЭГ доод оноо.');
  out.push('- † Ур чадварын шалгалтыг их сургууль өөрөө авна. **Жилд:** ≈ тэмдэгтэй нь тооцоо. **Итгэл:** ✓ албан ёсны хүснэгтээс, ≈ магадлалтай, ? тодорхойгүй.', '');
  const bySchool = new Map();
  for (const p of programs) bySchool.set(p.school_id, [...(bySchool.get(p.school_id) ?? []), p]);
  for (const [schoolId, rows] of bySchool) {
    const school = schools.get(schoolId) ?? {};
    out.push(`### ${school.name_mn ?? schoolId}${school.type === 'branch' ? ` — ${school.location_mn ?? ''}` : ''}`, '');
    out.push('| Хөтөлбөр | Түвшин | 1-р / суурь | 2-р / дагалдах | Босго | Жил | Жилд | Итгэл |', '|---|---|---|---|---|---|---|---|');
    for (const p of rows) {
      const exam = p.exam_2026_2027 ?? {};
      const extra = Object.entries(exam.subject_minimums ?? {}).map(([s, m]) => ` + ${s} ≥ ${m}`).join('');
      const threshold =
        thresholdText({ threshold1: exam.suuri_threshold, threshold2: exam.dagaldah_threshold, weights: exam.weights, thresholdType: exam.threshold_type }) + extra;
      const tuition = p.tuition_2026_2027 ?? {};
      const estimate = tuition.estimated_per_year;
      const fee = tuition.per_year ?? (estimate ? `≈ ${money(estimate.typical ?? estimate.max)}` : null);
      const flag = { verify: ' *(тодруулах)*', conflicting: ' *(зөрүүтэй)*', unverified: ' *(баталгаажаагүй)*' }[p.status] ?? '';
      const second = exam.dagaldah_options?.filter((s) => !(exam.swap_subjects ?? []).includes(s));
      out.push(
        `| ${cell(p.name_mn)}${flag} | ${cell(p.degree)} | ${subjectList(exam.suuri_options)} | ${subjectList(second)} | ${threshold} | ` +
          `${cell(p.duration_years)} | ${typeof fee === 'number' ? money(fee) : cell(fee)} | ${CONFIDENCE_MARK[exam.split_confidence] ?? '?'} |`
      );
    }
    out.push('');
  }
  return out.join('\n');
}

// -------------------------------------------------------------------------------------------------- CLI

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const [command, ...rest] = process.argv.slice(2);
  if (command === 'check') {
    let total = 0;
    for (const slug of rest[0] ? [rest[0]] : listUnis()) {
      const data = loadAll(slug);
      const confidence = {};
      for (const p of data.programs ?? []) {
        const c = p.exam_2026_2027?.split_confidence ?? 'none';
        confidence[c] = (confidence[c] ?? 0) + 1;
      }
      const counts = Object.entries(data).map(([name, records]) => `${name} ${records.length}`).join(', ');
      console.log(`\n[${slug}] ${counts}\n  programs by split_confidence: ${JSON.stringify(confidence)}`);
      const problems = validate(data);
      total += problems.length;
      console.log(problems.length ? `  ${problems.length} problem(s):\n  - ${problems.join('\n  - ')}` : '  valid ✔');
    }
    console.log(total ? `\n${total} problem(s) in total` : '\nAll files valid ✔');
    process.exitCode = total ? 1 : 0;
  } else if (command === 'guide') {
    for (const slug of rest[0] ? [rest[0]] : listUnis()) {
      const data = loadAll(slug);
      writeFileSync(path.join(UNIS_DIR, slug, 'GUIDE_MN.md'), buildGuide(slug, data));
      console.log(`wrote next-unis/unis/${slug}/GUIDE_MN.md (${data.programs?.length ?? 0} programs)`);
    }
  } else if (command === 'eligibility') {
    const [slug, ...pairs] = rest;
    if (!slug) throw new Error('usage: node data-import/next-unis-data.mjs eligibility <slug> Математик=620 "Англи хэл"=540');
    const scores = Object.fromEntries(pairs.map((pair) => pair.split('=')).map(([k, v]) => [k.trim(), Number(v)]));
    const { programs } = loadAll(slug);
    const counts = {};
    for (const p of programs) {
      const { verdict } = checkProgram(p, scores);
      counts[verdict] = (counts[verdict] ?? 0) + 1;
    }
    console.log(`[${slug}] Оноо:`, scores, '→', counts);
    const ranked = programs
      .map((program) => ({ program, result: checkProgram(program, scores) }))
      .filter((x) => x.result.verdict === VERDICT.ELIGIBLE)
      .sort((a, b) => b.result.normalized - a.result.normalized);
    for (const { program, result } of ranked.slice(0, 12)) {
      console.log(`${String(result.score).padStart(7)}  ${program.name_mn}  [${program.school_id}]  (${result.suuri} + ${result.dagaldah})  ${result.message}`);
    }
  } else {
    throw new Error('usage: node data-import/next-unis-data.mjs check|guide|eligibility …');
  }
}
