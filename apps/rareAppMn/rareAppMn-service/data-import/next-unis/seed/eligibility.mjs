// Reference score check for every university in this package — the spec for scoreMatch and for tests.
//
// CLI:  node seed/eligibility.mjs <slug> Математик=620 "Англи хэл"=540 ...
//
// Rules (per program, from exam_2026_2027):
//  - Two groups: suuri_options (first exam) and dagaldah_options (second exam). The student's best subject in each
//    counts; the two subjects must differ; "Ур чадварын шалгалт" (university's own test) never forms a pair.
//  - weights {suuri, dagaldah}: score = w1·first + w2·second (0.7/0.3, a sum 1/1, or whatever the university uses).
//  - threshold_type 'per_exam': first ≥ threshold_score AND second ≥ secondary_threshold_score (null → no second minimum).
//    threshold_type 'total':    w1·first + w2·second ≥ threshold_score (one minimum on the combined score, like МУИС;
//                               weights 0.5/0.5 = the average of the two exams, like СЭЗИС).
//  - subject_minimums {subject: min}: an extra minimum for that subject when it is in the pair (e.g. СЭЗИС Эдийн засаг:
//    Математик ≥ 600 on top of the average). The app can't store this, so such rows are imported neutral (see runbook).
//  - Only the university's own skills test as the second exam → neutral verdict (or "below" if every entered first-exam
//    score misses a per-exam minimum).
//  - unclear/unknown rows → neutral ("Сургуулиас тодруулна уу").
//  - Mixed lists sort by score ÷ (w1 + w2) so every formula sits on the same 200–800 scale.
import { pathToFileURL } from 'node:url';
import { loadAll } from './load-data.mjs';
import { SKILL_EXAM, scoreKind } from './exam-tools.mjs';

const uniqList = (xs) => [...new Set(xs)];

export const VERDICT = { ELIGIBLE: 'eligible', BELOW: 'below_threshold', MISSING: 'missing_scores', NEUTRAL: 'neutral' };

export function checkProgram(program, scores) {
  const ex = program.exam_2026_2027;
  if (!ex || !['confirmed', 'likely'].includes(ex.split_confidence) || !ex.suuri_options?.length || !ex.dagaldah_options?.length) {
    return { verdict: VERDICT.NEUTRAL, message: 'Сургуулиас тодруулна уу' };
  }
  const w1 = ex.weights?.suuri ?? 0.7;
  const w2 = ex.weights?.dagaldah ?? 0.3;
  const total = ex.threshold_type === 'total';
  const t1 = ex.suuri_threshold;
  const t2 = ex.dagaldah_threshold ?? 0;
  const mins = Object.entries(ex.subject_minimums ?? {});
  const has = (s) => Number.isFinite(scores[s]);
  const minMisses = (s, d) => mins.filter(([subj, min]) => (subj === s || subj === d) && scores[subj] < min).map(([subj, min]) => `${subj} ${min}`);
  const passText = ex.selection_type === 'direct' ? 'Босго давсан — шууд элсэх боломжтой' : 'Босго давсан — өрсөлдөх эрхтэй';

  const examDag = ex.dagaldah_options.filter((d) => d !== SKILL_EXAM);
  if (examDag.length === 0) {
    const entered = ex.suuri_options.filter(has).map((s) => scores[s]);
    if (!total && entered.length && Math.max(...entered) < t1) return { verdict: VERDICT.BELOW, message: `1-р шалгалт ${t1}-аас доош` };
    return { verdict: VERDICT.NEUTRAL, message: 'Ур чадварын шалгалтыг их сургууль өөрөө авна — сургуулиас тодруулна уу' };
  }

  let best = null;
  let bestFailing = null;
  for (const s of ex.suuri_options) {
    for (const d of examDag) {
      if (s === d || !has(s) || !has(d)) continue;
      const score = Math.round((w1 * scores[s] + w2 * scores[d]) * 10) / 10;
      const normalized = Math.round((score / (w1 + w2)) * 10) / 10;
      const pair = { suuri: s, dagaldah: d, score, normalized };
      const extra = minMisses(s, d);
      const passes = (total ? score >= t1 : scores[s] >= t1 && scores[d] >= t2) && extra.length === 0;
      if (passes) {
        if (!best || score > best.score) best = pair;
      } else if (!bestFailing || score > bestFailing.score) {
        const short = total
          ? [score < t1 ? `${scoreKind(ex.weights)} оноо ${t1}` : null, ...extra].filter(Boolean)
          : [scores[s] < t1 ? `${s} ${t1}` : null, scores[d] < t2 ? `${d} ${t2}` : null, ...extra].filter(Boolean);
        bestFailing = { ...pair, short };
      }
    }
  }
  if (best) return { verdict: VERDICT.ELIGIBLE, message: passText, ...best };
  if (bestFailing) {
    const g1 = total || ex.suuri_options.some((s) => has(s) && scores[s] >= t1);
    const g2 = total || examDag.some((d) => has(d) && scores[d] >= t2);
    const untried = uniqList([...(g1 ? [] : ex.suuri_options.filter((s) => !has(s))), ...(g2 ? [] : examDag.filter((d) => !has(d)))]);
    return { verdict: VERDICT.BELOW, message: `Босго хүрэхгүй: ${bestFailing.short.join(', ')}`, ...bestFailing, ...(untried.length ? { couldPassWith: untried } : {}) };
  }
  return { verdict: VERDICT.MISSING, message: `Оноо оруулна уу: 1-р (${ex.suuri_options.join(' / ')}), 2-р (${examDag.join(' / ')})` };
}

export function rankPrograms(programs, scores) {
  return programs
    .map((p) => ({ program: p, result: checkProgram(p, scores) }))
    .filter((x) => x.result.verdict === VERDICT.ELIGIBLE)
    .sort((a, b) => b.result.normalized - a.result.normalized);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const [slug, ...args] = process.argv.slice(2);
  if (!slug) {
    console.log('usage: node seed/eligibility.mjs <slug> Математик=620 "Англи хэл"=540');
    process.exit(1);
  }
  const scores = Object.fromEntries(args.map((a) => a.split('=')).map(([k, v]) => [k.trim(), Number(v)]));
  const { programs } = await loadAll(slug);
  const counts = {};
  for (const p of programs) {
    const v = checkProgram(p, scores).verdict;
    counts[v] = (counts[v] ?? 0) + 1;
  }
  console.log(`[${slug}] Оноо:`, scores, '→', counts);
  for (const { program, result } of rankPrograms(programs, scores).slice(0, 12)) {
    console.log(`${String(result.score).padStart(7)}  ${program.name_mn}  [${program.school_id}]  (${result.suuri} + ${result.dagaldah})  ${result.message}`);
  }
}
