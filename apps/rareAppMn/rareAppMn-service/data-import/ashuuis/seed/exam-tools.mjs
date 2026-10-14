// Helpers for writing АШУҮИС exam data into data/programs.json in the same shape as the rest of the dataset.
// Use them when you fill a gap (e.g. a branch school's table read from an image) so every row stays consistent.
//
//   import { buildExam, applyExam } from './exam-tools.mjs';
//   const exam = buildExam({ group1: ['Хими', 'Биологи'], group2: ['Ур чадварын шалгалт'],
//                            threshold1: 430, threshold2: 450, selection: 'direct', sourceUrl: 'https://…' });
//   applyExam(program, exam, { today: '2026-10-12' });
//
// АШУҮИС rules (mnums.edu.mn/admission, /admission/requirements):
//  - Two exam groups. From each group the student's best subject counts. Each group has its own minimum.
//  - Score = group-1 score + group-2 score (a plain sum, max 1600). NOT the 0.7/0.3 weights МУИС and ШУТИС use.
//  - 'list' programs (up to 8 choices) are ranked by that sum; 'direct' programs admit anyone who meets both minimums.
//  - "Ур чадварын шалгалт" is АШУҮИС's own biology skills test (100 points, 60+ passes, converted to 200–800).
//  - There is no subject-swap rule at АШУҮИС.

export const SKILL_EXAM = 'Ур чадварын шалгалт';
export const SKILL_NOTE =
  "2-р шалгалт нь АШУҮИС-ийн өөрийн авдаг Ур чадварын шалгалт: биологийн агуулгаар 100 онооны тест, 60+ оноо авбал тэнцэнэ, admission.mnums.edu.mn-ээр өгнө; оноог ЭЕШ-ийн 200–800 хуваарьт хөрвүүлнэ (60 → 480).";
export const GROUP_NOTE = 'Бүлэг бүрээс хамгийн өндөр оноотой нэг хичээлийг тооцно.';

const uniq = (xs) => [...new Set(xs)];
const joinOr = (xs) => (xs.length === 1 ? xs[0] : `${xs.slice(0, -1).join(', ')} эсвэл ${xs.at(-1)}`);

/** Same wording as required_subjects_display_mn everywhere else in the dataset. */
export function buildDisplay(group1, threshold1, group2, threshold2, selection) {
  const s1 = `1-р шалгалт: ${joinOr(group1)} — босго ${threshold1}.`;
  const s2 = group2.length === 1 && group2[0] === SKILL_EXAM
    ? ` 2-р шалгалт: Ур чадварын шалгалт (АШУҮИС өөрөө авна) — босго ${threshold2}.`
    : ` 2-р шалгалт: ${joinOr(group2)} — босго ${threshold2}.`;
  const s3 = selection === 'list'
    ? ' Хоёр шалгалтын онооны нийлбэрээр жагсаана (8 хүртэл хөтөлбөр сонгоно).'
    : ' Шууд сонгох хөтөлбөр: хоёр босгыг хангавал элсэх эрхтэй.';
  return s1 + s2 + s3;
}

/**
 * Build an exam_2026_2027 block.
 * @param {object} o
 * @param {string[]} o.group1        ЭЕШ-1 subjects as listed by the source (best one counts)
 * @param {string[]} o.group2        ЭЕШ-2 subjects as listed by the source, or ['Ур чадварын шалгалт']
 * @param {number} o.threshold1
 * @param {number} o.threshold2
 * @param {'list'|'direct'} o.selection
 * @param {string} o.sourceUrl
 * @param {string} [o.note]
 * @param {'confirmed'|'likely'} [o.confidence]
 */
export function buildExam({ group1, group2, threshold1, threshold2, selection, sourceUrl, note, confidence = 'confirmed' }) {
  const isSkill = group2.length === 1 && group2[0] === SKILL_EXAM;
  return {
    subjects_to_prepare: uniq([...group1, ...group2]),
    suuri_options: group1,
    dagaldah_options: group2,
    suuri_threshold: threshold1,
    dagaldah_threshold: threshold2,
    weights: { suuri: 1, dagaldah: 1 },
    score_formula: 'sum',
    score_formula_mn: '1-р шалгалт + 2-р шалгалт (онооны нийлбэр, дээд тал нь 1600)',
    selection_type: selection,
    split_confidence: confidence,
    note_mn: [isSkill ? SKILL_NOTE : null, GROUP_NOTE, note].filter(Boolean).join(' '),
    source_url: sourceUrl,
    status: 'current',
  };
}

// Sentences in old notes that only describe why the old data was missing — drop them once a row is filled.
const STALE_NOTE = /зөвхөн зураг|уншигд|OCR|тодорхойгүй|олдсонгүй|зургийн нэрээс|Step 2|импортлохгүй/;

export function durableNote(note) {
  return (note ?? '')
    .replace(SKILL_NOTE, '')
    .replace(GROUP_NOTE, '')
    .split(/(?<=[.;])\s+/)
    .map((s) => s.trim())
    .filter((s) => s && !STALE_NOTE.test(s))
    .join(' ')
    .trim();
}

/**
 * Write the exam block into a programs.json record and keep the derived fields in sync.
 * Keeps durable notes from the old exam block and keeps a 'verify'/'conflicting' record status.
 */
export function applyExam(record, exam, { today }) {
  const oldExtra = durableNote(record.exam_2026_2027?.note_mn);
  if (oldExtra && !(exam.note_mn ?? '').includes(oldExtra)) {
    exam.note_mn = [exam.note_mn, oldExtra].filter(Boolean).join(' ');
  }
  record.exam_2026_2027 = exam;
  // the record-level note may only say why the row was unconfirmed — keep just the durable part
  record.notes_mn = durableNote(record.notes_mn) || null;
  record.threshold_score = exam.suuri_threshold;
  record.secondary_threshold_score = exam.dagaldah_threshold;
  record.selection_type = exam.selection_type;
  record.selection_type_mn = exam.selection_type === 'list' ? 'Жагсаалтаар сонгох (8 хүртэл)' : 'Шууд сонгох (1)';
  record.required_subjects_display_mn = buildDisplay(
    exam.suuri_options, exam.suuri_threshold, exam.dagaldah_options, exam.dagaldah_threshold, exam.selection_type,
  );
  record.aptitude_test_required = exam.dagaldah_options.includes(SKILL_EXAM);
  record.source_urls = uniq([...(record.source_urls ?? []), exam.source_url]);
  record.verified_at = today;
  if (!['verify', 'conflicting'].includes(record.status)) record.status = 'current';
  return record;
}
