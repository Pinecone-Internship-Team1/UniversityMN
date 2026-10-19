// Reference implementation of the score check for АШУҮИС — the spec for scoreMatch and for tests.
// It also handles МУИС/ШУТИС-style rows (weights 0.7/0.3), so one function covers every university.
//
// CLI:  node seed/eligibility.mjs Хими=620 Биологи=580 Математик=500 "Англи хэл"=520
//
// Rules:
//  - primary group (suuri_options) and secondary group (dagaldah_options); the student's best subject in each counts,
//    and the two subjects must differ.
//  - Each group has its own minimum: primary ≥ threshold_score AND secondary ≥ secondary_threshold_score.
//  - Score = weights.suuri × primary + weights.dagaldah × secondary.
//      АШУҮИС: weights 1/1 → the plain sum (max 1600), as АШУҮИС ranks it.
//      МУИС, ШУТИС: weights 0.7/0.3.
//    When a list mixes universities, sort by score ÷ (sum of weights) so both formulas sit on the same 200–800 scale.
//  - "Ур чадварын шалгалт" is taken by the university itself; students don't have a ЭШ score for it → neutral verdict
//    (or "below" if every entered primary score misses the minimum).
//  - unclear/unknown rows → neutral verdict ("Сургуулиас тодруулна уу").
//  - Passing the minimums: 'list' programs → "Босго давсан — өрсөлдөх эрхтэй"; 'direct' programs → "Босго давсан — шууд элсэх боломжтой".
import { pathToFileURL } from 'node:url';
import { loadAll } from './load-data.mjs';
import { SKILL_EXAM } from './exam-tools.mjs';

const uniqList = (xs) => [...new Set(xs)];

export const VERDICT = {
  ELIGIBLE: 'eligible',
  BELOW: 'below_threshold',
  MISSING: 'missing_scores',
  NEUTRAL: 'neutral',
};

export function weightsOf(program) {
  const w = program.exam_2026_2027?.weights;
  return { w1: w?.suuri ?? 0.7, w2: w?.dagaldah ?? 0.3 };
}

/**
 * @param {object} program  a programs.json record
 * @param {Record<string, number>} scores  ЭШ scaled scores by subject name, e.g. { 'Хими': 620 }
 */
export function checkProgram(program, scores) {
  const ex = program.exam_2026_2027;
  if (!ex || !['confirmed', 'likely'].includes(ex.split_confidence) || !ex.suuri_options?.length || !ex.dagaldah_options?.length) {
    return { verdict: VERDICT.NEUTRAL, message: 'Сургуулиас тодруулна уу' };
  }
  const { w1, w2 } = weightsOf(program);
  const t1 = ex.suuri_threshold;
  const t2 = ex.dagaldah_threshold ?? 0;
  const has = (s) => Number.isFinite(scores[s]);
  const passText = ex.selection_type === 'direct' ? 'Босго давсан — шууд элсэх боломжтой' : 'Босго давсан — өрсөлдөх эрхтэй';

  const examDag = ex.dagaldah_options.filter((d) => d !== SKILL_EXAM);
  if (examDag.length === 0) {
    const entered = ex.suuri_options.filter(has).map((s) => scores[s]);
    if (entered.length && Math.max(...entered) < t1) return { verdict: VERDICT.BELOW, message: `1-р шалгалт ${t1}-аас доош` };
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
      if (scores[s] >= t1 && scores[d] >= t2) {
        if (!best || score > best.score) best = pair;
      } else if (!bestFailing || score > bestFailing.score) {
        bestFailing = { ...pair, short: [scores[s] < t1 ? `${s} ${t1}` : null, scores[d] < t2 ? `${d} ${t2}` : null].filter(Boolean) };
      }
    }
  }
  if (best) return { verdict: VERDICT.ELIGIBLE, message: passText, ...best };
  if (bestFailing) {
    // suggest a group's empty subjects only while that group is the one failing
    const group1Passes = ex.suuri_options.some((s) => has(s) && scores[s] >= t1);
    const group2Passes = examDag.some((d) => has(d) && scores[d] >= t2);
    const untried = uniqList([
      ...(group1Passes ? [] : ex.suuri_options.filter((s) => !has(s))),
      ...(group2Passes ? [] : examDag.filter((d) => !has(d))),
    ]);
    return {
      verdict: VERDICT.BELOW,
      message: `Босго хүрэхгүй: ${bestFailing.short.join(', ')}`,
      ...bestFailing,
      ...(untried.length ? { couldPassWith: untried } : {}),
    };
  }
  return {
    verdict: VERDICT.MISSING,
    message: `Оноо оруулна уу: 1-р (${ex.suuri_options.join(' / ')}), 2-р (${examDag.join(' / ')})`,
  };
}

/** Programs the student can enter or compete for, best (normalized) score first. */
export function rankPrograms(programs, scores) {
  return programs
    .map((p) => ({ program: p, result: checkProgram(p, scores) }))
    .filter((x) => x.result.verdict === VERDICT.ELIGIBLE)
    .sort((a, b) => b.result.normalized - a.result.normalized);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const args = process.argv.slice(2);
  const scores = Object.fromEntries(
    (args.length ? args : ['Хими=620', 'Биологи=580', 'Математик=500', 'Англи хэл=520'])
      .map((a) => a.split('='))
      .map(([k, v]) => [k.trim(), Number(v)]),
  );
  const { programs } = await loadAll();
  const counts = {};
  for (const p of programs) {
    const v = checkProgram(p, scores).verdict;
    counts[v] = (counts[v] ?? 0) + 1;
  }
  console.log('Оноо:', scores);
  console.log('Дүн:', counts);
  for (const { program, result } of rankPrograms(programs, scores).slice(0, 15)) {
    console.log(`${String(result.score).padStart(6)}  ${program.name_mn}  [${program.school_id}]  (${result.suuri} + ${result.dagaldah})  ${result.message}`);
  }
}
