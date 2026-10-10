// Reference implementation of the ШУТИС score check (per-exam thresholds).
// Use it as the spec for scoreMatch and for tests.
//
// CLI:  node seed/eligibility.mjs Математик=620 Физик=540 "Англи хэл"=500 "Нийгэм судлал"=480
//
// Rules (ШУТИС 2026-2027 admission regulation, elselt.edu.mn/page/14):
//  - Ranking score = 0.7 × суурь + 0.3 × дагалдах. One суурь subject and one DIFFERENT дагалдах subject.
//  - Each exam has its own minimum: суурь ≥ threshold_score AND дагалдах ≥ secondary_threshold_score.
//  - dagaldah_options already contain the суурь subjects where the swap rule allows it (in-demand or index 05–09).
//  - "Ур чадварын шалгалт" is taken by ШУТИС itself; students don't have a ЭШ score for it → neutral verdict.
//  - Rows whose split_confidence is unclear/unknown → neutral verdict ("Сургуулиас тодруулна уу").
//  - dagaldah_threshold = null (9 rows: the scan was unreadable) → only the суурь minimum is checked, with a caveat.
//  - Passing the minimums means "allowed to compete", not "admitted": seats are filled by rank.
import { pathToFileURL } from 'node:url';
import { loadAll } from './load-data.mjs';
import { SKILL_EXAM } from './exam-tools.mjs';

const uniqList = (xs) => [...new Set(xs)];

export const VERDICT = {
  ELIGIBLE: 'eligible',         // Босго давсан — өрсөлдөх эрхтэй
  BELOW: 'below_threshold',     // Босго хүрэхгүй
  MISSING: 'missing_scores',    // Хэрэгтэй хичээлийн оноо оруулаагүй
  NEUTRAL: 'neutral',           // Сургуулиас тодруулна уу
};

/**
 * @param {object} program  a programs.json record
 * @param {Record<string, number>} scores  ЭШ scaled scores by subject name, e.g. { 'Математик': 620 }
 */
export function checkProgram(program, scores) {
  const ex = program.exam_2026_2027;
  if (!ex || !['confirmed', 'likely'].includes(ex.split_confidence) || !ex.suuri_options?.length || !ex.dagaldah_options?.length) {
    return { verdict: VERDICT.NEUTRAL, message: 'Сургуулиас тодруулна уу' };
  }
  const t1 = ex.suuri_threshold;
  const t2 = ex.dagaldah_threshold ?? 0;
  const has = (s) => Number.isFinite(scores[s]);

  const examDag = ex.dagaldah_options.filter((d) => d !== SKILL_EXAM);
  if (examDag.length === 0) {
    // only the aptitude test as дагалдах: we can still tell if the суурь minimum is missed
    const best = Math.max(...ex.suuri_options.filter(has).map((s) => scores[s]), -Infinity);
    if (best !== -Infinity && best < t1) return { verdict: VERDICT.BELOW, message: `Суурь хичээл ${t1}-аас доош` };
    return { verdict: VERDICT.NEUTRAL, message: 'Ур чадварын шалгалтыг ШУТИС өөрөө авна — сургуулиас тодруулна уу' };
  }

  let best = null;
  let bestFailing = null;
  for (const s of ex.suuri_options) {
    for (const d of examDag) {
      if (s === d || !has(s) || !has(d)) continue;
      const weighted = Math.round((0.7 * scores[s] + 0.3 * scores[d]) * 10) / 10;
      const pair = { suuri: s, dagaldah: d, weighted };
      if (scores[s] >= t1 && scores[d] >= t2) {
        if (!best || weighted > best.weighted) best = pair;
      } else if (!bestFailing || weighted > bestFailing.weighted) {
        bestFailing = { ...pair, short: [scores[s] < t1 ? `суурь (${s}) ${t1}` : null, scores[d] < t2 ? `дагалдах (${d}) ${t2}` : null].filter(Boolean) };
      }
    }
  }
  if (best) {
    const caveat = ex.dagaldah_threshold == null ? 'Дагалдах хичээлийн босго тодорхойгүй — сургуулиас тодруулна уу' : undefined;
    return { verdict: VERDICT.ELIGIBLE, message: 'Босго давсан — өрсөлдөх эрхтэй', ...best, ...(caveat ? { caveat } : {}) };
  }
  if (bestFailing) {
    // a subject the student left empty could still make a passing pair → say so instead of a flat "no"
    const passingSuuri = ex.suuri_options.filter((s) => has(s) && scores[s] >= t1);
    const untried = uniqList([
      ...examDag.filter((d) => !has(d) && passingSuuri.some((s) => s !== d)),
      ...ex.suuri_options.filter((s) => !has(s)),
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
    message: `Оноо оруулна уу: суурь (${ex.suuri_options.join(' / ')}), дагалдах (${examDag.join(' / ')})`,
  };
}

/** Programs the student can compete for, best weighted score first. */
export function rankPrograms(programs, scores) {
  return programs
    .map((p) => ({ program: p, result: checkProgram(p, scores) }))
    .filter((x) => x.result.verdict === VERDICT.ELIGIBLE)
    .sort((a, b) => b.result.weighted - a.result.weighted);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const args = process.argv.slice(2);
  const scores = Object.fromEntries(
    (args.length ? args : ['Математик=620', 'Физик=540', 'Англи хэл=500', 'Нийгэм судлал=480'])
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
    console.log(`${String(result.weighted).padStart(6)}  ${program.name_mn}  [${program.school_id}]  (${result.suuri} + ${result.dagaldah})`);
  }
}
