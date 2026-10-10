// Helpers for writing exam data into data/programs.json in the same shape as the rest of the dataset.
// Use them when you fill a gap (e.g. from the regulation PDF) so every row stays consistent.
//
//   import { buildExam, applyExam } from './exam-tools.mjs';
//   const exam = buildExam({ program, allPrograms, suuri: ['Математик', 'Физик'], dagaldah: ['Англи хэл', 'Нийгэм судлал'],
//                            suuriThreshold: 490, dagaldahThreshold: 450, sourceUrl: 'https://…' });
//   applyExam(program, exam, { today: '2026-10-11' });

export const SKILL_EXAM = 'Ур чадварын шалгалт';
export const SWAP_NOTE =
  'Журмын дагуу эрэлттэй / 05–09 индекстэй хөтөлбөрт суурь хичээлийн нэгийг дагалдах шалгалтаар тооцож болно (босгоор дүйцүүлнэ).';

const uniq = (xs) => [...new Set(xs)];
const joinOr = (xs) => (xs.length === 1 ? xs[0] : `${xs.slice(0, -1).join(', ')} эсвэл ${xs.at(-1)}`);

export function isIndex05to09(code) {
  return Boolean(code) && ['05', '06', '07', '08', '09'].includes(String(code).slice(0, 2));
}

/**
 * ШУТИС rule (admission_2026.json → subject_swap_rule_mn): "Эрэлттэй хөтөлбөр болон 05–09 индекстэй мэргэжилд
 * суурь хичээлийн аль нэгийг дагалдах хичээлээр, босгоор дүйцүүлэн тооцно."
 * → applies to in-demand (Э) programs AND to index 05–09 programs.
 */
export function swapApplies({ code, inDemand = false }) {
  return Boolean(inDemand) || isIndex05to09(code);
}

/**
 * A branch-school row usually has no index code. Borrow the code of the same-named program at a UB school,
 * so the swap rule is decided by the real field (e.g. "Бизнесийн удирдлага" → 041301 → no swap).
 */
export function inferCode(program, allPrograms = []) {
  if (program.code) return program.code;
  const base = program.name_mn.replace(/\s*\(.*\)\s*$/, '').trim();
  const twin = allPrograms.find((p) => p.code && p.name_mn === base);
  return twin?.code ?? null;
}

/** Same wording as required_subjects_display_mn everywhere else in the dataset. */
export function buildDisplay(suuri, dagaldah, t1, t2) {
  const extra = dagaldah.filter((d) => !suuri.includes(d));
  const swap = dagaldah.some((d) => suuri.includes(d));
  let d;
  if (extra.length && swap) d = `${extra.join(', ')} эсвэл суурьт сонгоогүй нөгөө хичээл`;
  else if (extra.length) d = joinOr(extra);
  else d = 'суурьт сонгоогүй нөгөө хичээл';
  let s = `Суурь (70%): ${joinOr(suuri)} — босго ${t1}. Дагалдах (30%): ${d}${t2 ? ` — босго ${t2}.` : '.'}`;
  if (dagaldah.includes(SKILL_EXAM)) s += ' Ур чадварын шалгалтыг ШУТИС өөрөө авна.';
  return s;
}

/**
 * Build an exam_2026_2027 block.
 * @param {object} o
 * @param {object} [o.program]          the programs.json record (gives code + in-demand flag)
 * @param {object[]} [o.allPrograms]    all records (used to infer a missing code)
 * @param {string|null} [o.code]        override the index code
 * @param {boolean} [o.inDemand]        override the in-demand flag
 * @param {string[]} o.suuri            суурь subjects as listed by the source
 * @param {string[]} o.dagaldah         дагалдах subjects as listed by the source (WITHOUT the swap subjects)
 * @param {number} o.suuriThreshold
 * @param {number|null} [o.dagaldahThreshold]
 * @param {string} o.sourceUrl
 * @param {string} [o.note]
 * @param {'confirmed'|'likely'} [o.confidence]
 */
export function buildExam({
  program, allPrograms, code, inDemand, suuri, dagaldah, suuriThreshold, dagaldahThreshold = null,
  sourceUrl, note, confidence = 'confirmed',
}) {
  const c = code !== undefined ? code : program ? inferCode(program, allPrograms) : null;
  const d = inDemand !== undefined ? inDemand : Boolean(program?.priority?.is_in_demand_field);
  const onlyAptitude = dagaldah.length > 0 && dagaldah.every((x) => x === SKILL_EXAM);
  // no index code at all → fall back to the record's is_index_05_09 flag (set from the program's field)
  const flaggedIndex = !c && program?.priority?.is_index_05_09 === true;
  const swap = (swapApplies({ code: c, inDemand: d }) || flaggedIndex) && suuri.length > 1 && !onlyAptitude;
  const dag = uniq([...dagaldah, ...(swap ? suuri : [])]);
  const notes = [swap ? SWAP_NOTE : null, note].filter(Boolean);
  return {
    subjects_to_prepare: uniq([...suuri, ...dagaldah]),
    suuri_options: suuri,
    dagaldah_options: dag,
    suuri_threshold: suuriThreshold,
    dagaldah_threshold: dagaldahThreshold,
    weights: { suuri: 0.7, dagaldah: 0.3 },
    split_confidence: confidence,
    note_mn: notes.join(' ') || null,
    source_url: sourceUrl,
    status: 'current',
  };
}

/**
 * Write the exam block into a programs.json record and keep the derived fields in sync.
 * Keeps special notes from the old exam block (e.g. TOPIK/GPA conditions) and keeps a 'verify'/'conflicting'
 * record status (those need a human look even after filling).
 */
// Sentences in old notes that only describe why the old data was incomplete — drop them once a row is filled.
const STALE_NOTE = /уншигд|OCR|холилд|тодорхойлж чадсангүй|зөвлөх багшийн жагсаалтаас|Босго 430/;

/** Old note minus the swap sentence and minus "couldn't read the scan"-type sentences. */
export function durableNote(note) {
  return (note ?? '')
    .replace(SWAP_NOTE, '')
    .split(/(?<=[.;])\s+/)
    .map((s) => s.trim())
    .filter((s) => s && !STALE_NOTE.test(s))
    .join(' ')
    .replace(/;$/, '.')
    .trim();
}

export function applyExam(record, exam, { today }) {
  const oldExtra = durableNote(record.exam_2026_2027?.note_mn);
  if (oldExtra && !(exam.note_mn ?? '').includes(oldExtra)) {
    exam.note_mn = [exam.note_mn, oldExtra].filter(Boolean).join(' ');
  }
  record.exam_2026_2027 = exam;
  record.threshold_score = exam.suuri_threshold;
  record.secondary_threshold_score = exam.dagaldah_threshold;
  record.required_subjects_display_mn = buildDisplay(
    exam.suuri_options, exam.dagaldah_options, exam.suuri_threshold, exam.dagaldah_threshold,
  );
  record.aptitude_test_required = exam.dagaldah_options.includes(SKILL_EXAM);
  record.source_urls = uniq([...(record.source_urls ?? []), exam.source_url]);
  if (record.priority && isIndex05to09(record.code)) record.priority.is_index_05_09 = true;
  record.verified_at = today;
  if (!['verify', 'conflicting'].includes(record.status)) record.status = 'current';
  return record;
}
