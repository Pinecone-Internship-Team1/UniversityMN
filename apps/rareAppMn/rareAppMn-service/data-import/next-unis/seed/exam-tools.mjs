// Helpers for writing exam data into unis/<slug>/data/programs.json in the same shape as the rest of the dataset.
// Use them when you fill a gap (e.g. a table read from a scan) so every row stays consistent.
//
//   import { buildExam, applyExam } from './seed/exam-tools.mjs';
//   const exam = buildExam({ group1: ['Математик'], group2: ['Англи хэл', 'Нийгэм судлал'], threshold1: 490, threshold2: 450,
//                            weights: { suuri: 0.7, dagaldah: 0.3 }, thresholdType: 'per_exam', selection: 'list',
//                            sourceUrl: 'https://…' });
//   applyExam(program, exam, { today: '2026-10-16' });
//
// thresholdType:
//   'per_exam' — each exam has its own minimum (threshold1, threshold2)
//   'total'    — one minimum on the combined score w1·exam1 + w2·exam2 (threshold1 = that minimum, threshold2 = null)
// formulaKnown: false when the university gives a minimum per exam but publishes no formula. Then pass weights 1/1:
//   the verdict doesn't depend on the weights, the app shows a plain sum, and no text claims a 70/30 or average formula.

export const SKILL_EXAM = 'Ур чадварын шалгалт';

const uniq = (xs) => [...new Set(xs)];
const joinOr = (xs) => (xs.length === 1 ? xs[0] : `${xs.slice(0, -1).join(', ')} эсвэл ${xs.at(-1)}`);
const pct = (w1, w2) => [Math.round((w1 / (w1 + w2)) * 100), Math.round((w2 / (w1 + w2)) * 100)];

export function labels(weights, formulaKnown = true) {
  const w1 = weights?.suuri ?? 0.7;
  const w2 = weights?.dagaldah ?? 0.3;
  if (!formulaKnown || w1 === w2) return ['1-р шалгалт', '2-р шалгалт'];
  const [p1, p2] = pct(w1, w2);
  return [`Суурь (${p1}%)`, `Дагалдах (${p2}%)`];
}

const groupText = (g) => (g.length === 1 && g[0] === SKILL_EXAM ? 'Ур чадварын шалгалт (их сургууль өөрөө авна)' : joinOr(g));

/** The combined-score formula in plain Mongolian: sum (1/1), average (0.5/0.5), weighted, or "not published". */
export function formulaMn(weights, formulaKnown = true) {
  if (!formulaKnown) return 'онооны томьёо зарлаагүй';
  const w1 = weights?.suuri ?? 0.7;
  const w2 = weights?.dagaldah ?? 0.3;
  if (w1 === w2 && w1 === 1) return 'хоёр шалгалтын онооны нийлбэр';
  if (w1 === w2 && w1 === 0.5) return 'хоёр шалгалтын онооны дундаж';
  const [l1, l2] = labels(weights);
  return `${w1} × ${l1.split(' ')[0].toLowerCase()} + ${w2} × ${l2.split(' ')[0].toLowerCase()}`;
}

/** What the combined score is called: "дундаж" (0.5/0.5), "нийлбэр" (1/1) or "тооцсон" (weighted). */
export function scoreKind(weights) {
  const w1 = weights?.suuri ?? 0.7;
  const w2 = weights?.dagaldah ?? 0.3;
  return w1 === w2 && w1 === 0.5 ? 'дундаж' : w1 === w2 && w1 === 1 ? 'нийлбэр' : 'тооцсон';
}

/** Short threshold text for tables: "дундаж ≥ 580", "нийлбэр ≥ 1100", "тооцсон ≥ 650" or "490 / 450". */
export function thresholdText({ threshold1, threshold2, weights, thresholdType }) {
  if (thresholdType !== 'total') return `${threshold1 ?? '—'} / ${threshold2 ?? '—'}`;
  return `${scoreKind(weights)} ≥ ${threshold1 ?? '—'}`;
}

/** One plain sentence a student understands. */
export function buildDisplay({
  group1, group2, threshold1, threshold2, weights, thresholdType, selection, subjectMinimums, formulaKnown = true,
}) {
  const [l1, l2] = labels(weights, formulaKnown);
  let s;
  if (thresholdType === 'total') {
    s = `${l1}: ${groupText(group1)}. ${l2}: ${groupText(group2)}. Тооцсон оноо (${formulaMn(weights, formulaKnown)}) — босго ${threshold1}.`;
  } else {
    s = `${l1}: ${groupText(group1)} — босго ${threshold1}. ${l2}: ${groupText(group2)}${threshold2 ? ` — босго ${threshold2}` : ''}.`;
    if (!formulaKnown) s += ' Хоёр шалгалтын оноог хэрхэн нийлүүлэхийг (онооны томьёо) сургууль зарлаагүй.';
  }
  for (const [subj, min] of Object.entries(subjectMinimums ?? {})) s += ` Үүнээс гадна ${subj} дор хаяж ${min}.`;
  if (selection === 'direct') s += ' Босгыг хангавал шууд элсэх эрхтэй.';
  return s;
}

/**
 * Build an exam_2026_2027 block.
 * @param {object} o
 * @param {string[]} o.group1        first exam subjects as listed by the source (best one counts)
 * @param {string[]} o.group2        second exam subjects as listed by the source (WITHOUT swap subjects — pass those in swapSubjects)
 * @param {number} o.threshold1
 * @param {number|null} [o.threshold2]
 * @param {{suuri:number,dagaldah:number}} o.weights   the published formula; 1/1 when formulaKnown is false
 * @param {'per_exam'|'total'} o.thresholdType
 * @param {'list'|'direct'} [o.selection]
 * @param {string[]} [o.swapSubjects]   суурь subjects the rules allow as the second exam
 * @param {Record<string, number>} [o.subjectMinimums]  extra minimum for one subject on top of the threshold
 * @param {boolean} [o.formulaKnown]   false = the source gives no formula (only per-exam minimums)
 * @param {string} o.sourceUrl
 * @param {string} [o.note]
 * @param {'confirmed'|'likely'} [o.confidence]
 */
export function buildExam({
  group1, group2, threshold1, threshold2 = null, weights, thresholdType, selection = 'list', swapSubjects = [],
  subjectMinimums = null, formulaKnown = true, sourceUrl, note, confidence = 'confirmed',
}) {
  if (!formulaKnown && thresholdType === 'total') throw new Error('one combined minimum without a formula can\'t be checked — leave the row unknown');
  const dag = uniq([...group2, ...swapSubjects]);
  const formula = weights.suuri === weights.dagaldah && weights.suuri === 1 ? 'sum'
    : weights.suuri === weights.dagaldah && weights.suuri === 0.5 ? 'average' : 'weighted';
  return {
    subjects_to_prepare: uniq([...group1, ...group2]),
    suuri_options: group1,
    dagaldah_options: dag,
    swap_subjects: swapSubjects.length ? swapSubjects : null,
    suuri_threshold: threshold1,
    dagaldah_threshold: thresholdType === 'total' ? null : threshold2,
    threshold_type: thresholdType,
    subject_minimums: subjectMinimums,
    weights,
    formula_known: formulaKnown,
    score_formula: formulaKnown ? formula : null,
    selection_type: selection,
    split_confidence: confidence,
    note_mn: note ?? null,
    source_url: sourceUrl,
    status: 'current',
  };
}

// Sentences that only describe what was missing before the gap was filled — dropped when real values are written.
const STALE_NOTE = new RegExp([
  'зөвхөн зураг', 'уншигд', 'OCR', 'тодорхойгүй', 'олдсонгүй', 'баталгаажаагүй', 'импортлохгүй', 'нийтлээгүй',
  'нийтлэгдээгүй', 'заагаагүй', 'хуучирсан', 'хуудаснаас авав', 'placeholder', 'орлуулагч', 'validator',
].join('|'), 'iu');

/** Keep only the sentences of an old note that are still true once the exam data is filled. */
export function durableNote(note) {
  return (note ?? '')
    .split(/(?<=[.!?])\s+(?=\S)/u)
    .map((s) => s.trim())
    .filter((s) => s && !STALE_NOTE.test(s))
    .join(' ')
    .trim();
}

/** Write the exam block into a programs.json record and keep the derived fields in sync. */
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
    group1: exam.suuri_options, group2: exam.dagaldah_options.filter((d) => !swap.includes(d)),
    threshold1: exam.suuri_threshold, threshold2: exam.dagaldah_threshold, weights: exam.weights,
    thresholdType: exam.threshold_type, selection: exam.selection_type, subjectMinimums: exam.subject_minimums,
    formulaKnown: exam.formula_known !== false,
  });
  record.aptitude_test_required = exam.dagaldah_options.includes(SKILL_EXAM);
  record.source_urls = uniq([...(record.source_urls ?? []), exam.source_url]);
  record.verified_at = today;
  // A row filled from a clearly read 2026-27 table no longer needs the "verify" warning.
  if (exam.split_confidence === 'confirmed' || !['verify', 'conflicting'].includes(record.status)) record.status = 'current';
  return record;
}
