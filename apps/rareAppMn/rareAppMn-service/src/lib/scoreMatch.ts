import type { Major } from '../db/schema';

/** `CHECK_WITH_SCHOOL`: the scores can't decide it, so it is neither eligible nor below the cut-off. */
export type ScoreMatchVerdict = 'ELIGIBLE' | 'BELOW_CUT_OFF' | 'MISSING_SCORES' | 'CHECK_WITH_SCHOOL';

export interface ScoreMatchOutcome {
  matchScore: number;
  eligible: boolean;
  verdict: ScoreMatchVerdict;
  reason: string;
}

type MatchableMajor = Pick<
  Major,
  | 'name'
  | 'requiredSubjects'
  | 'primarySubjects'
  | 'secondarySubjects'
  | 'examNote'
  | 'cutOffScore'
  | 'secondaryCutOffScore'
>;

interface ExamPair {
  primary: string;
  primaryScore: number;
  secondary: string;
  secondaryScore: number;
  /** 0.7 × суурь + 0.3 × дагалдах, rounded to one decimal. */
  total: number;
}

const MAX_MATCH_SCORE = 1.5;
const PRIMARY_WEIGHT = 0.7;
const SECONDARY_WEIGHT = 0.3;
/** Run by the school itself, so it has no ЭЕШ score to weigh. */
const SKILL_EXAM = 'Ур чадварын шалгалт';

function subjectList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((subject): subject is string => typeof subject === 'string');
}

/** Every subject that counts towards the major's admission, without duplicates. */
function examSubjectsOf(
  major: Pick<Major, 'requiredSubjects' | 'primarySubjects' | 'secondarySubjects'>
): string[] {
  return [
    ...new Set([
      ...subjectList(major.requiredSubjects),
      ...subjectList(major.primarySubjects),
      ...subjectList(major.secondarySubjects),
    ]),
  ];
}

function scoreFor(scores: Record<string, number>, subject: string): number | undefined {
  if (!Object.hasOwn(scores, subject)) return undefined;
  const value: unknown = scores[subject];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export function hasRelevantScores(
  major: Pick<Major, 'requiredSubjects' | 'primarySubjects' | 'secondarySubjects'>,
  scores: Record<string, number>
): boolean {
  return examSubjectsOf(major).some((subject) => scoreFor(scores, subject) !== undefined);
}

/** Every суурь/дагалдах pair the student has both scores for, where the two exams differ. */
function examPairs(
  scores: Record<string, number>,
  primarySubjects: string[],
  secondarySubjects: string[]
): ExamPair[] {
  const pairs: ExamPair[] = [];
  for (const primary of primarySubjects) {
    const primaryScore = scoreFor(scores, primary);
    if (primaryScore === undefined) continue;
    for (const secondary of secondarySubjects) {
      const secondaryScore = scoreFor(scores, secondary);
      if (secondary === primary || secondaryScore === undefined) continue;
      const total =
        Math.round((PRIMARY_WEIGHT * primaryScore + SECONDARY_WEIGHT * secondaryScore) * 10) / 10;
      pairs.push({ primary, primaryScore, secondary, secondaryScore, total });
    }
  }
  return pairs;
}

/** The pair with the highest weighted total; `pairs` must not be empty. */
function bestPair(pairs: ExamPair[]): ExamPair {
  return pairs.reduce((best, pair) => (pair.total > best.total ? pair : best));
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function clampMatchScore(value: number): number {
  return Math.min(Math.max(value, 0), MAX_MATCH_SCORE);
}

const PASSED_NOTE =
  ' Босго давсан нь элсэх баталгаа биш, эрэлттэй хөтөлбөрт илүү өндөр оноо хэрэгтэй байж болно.';

/**
 * `scoreText` names the score mid-sentence, e.g. "дундаж оноо 612.5";
 * `passedNote` is added only when the score clears the cut-off.
 */
function outcomeFor(
  major: MatchableMajor,
  score: number,
  scoreText: string,
  note: string,
  passedNote = ''
): ScoreMatchOutcome {
  const cutOffScore = major.cutOffScore ?? 0;
  const matchScore = clampMatchScore(cutOffScore > 0 ? score / cutOffScore : score / 100);
  const eligible = cutOffScore > 0 ? score >= cutOffScore : true;

  const reason =
    cutOffScore <= 0
      ? `${major.name} мэргэжилд босго оноо тогтоогоогүй. Таны ${scoreText}.${note}`
      : eligible
        ? `${capitalize(scoreText)} нь ${major.name} мэргэжлийн ${cutOffScore} босго оноог хангаж байна.${passedNote}${note}`
        : `${capitalize(scoreText)} нь ${major.name} мэргэжлийн ${cutOffScore} босго оноонаас доогуур байна.${note}`;

  return { matchScore, eligible, verdict: eligible ? 'ELIGIBLE' : 'BELOW_CUT_OFF', reason };
}

const UNKNOWN_SECONDARY_CUT_OFF = 'Дагалдах хичээлийн босго тодорхойгүй — сургуулиас тодруулна уу.';

/**
 * For a university that sets a minimum for each exam (e.g. ШУТИС: суурь 490,
 * дагалдах 450): only pairs meeting both minimums count, ranked by their
 * weighted total. A pair short on either exam is below the cut-off however
 * high the other one is, so its match score always stays under 1. A дагалдах
 * minimum of 0 means it is unknown: only the суурь minimum is checked.
 * Mirrors `checkProgram` in the dataset's `seed/eligibility.mjs`.
 */
function perExamOutcome(
  major: MatchableMajor,
  pairs: ExamPair[],
  primarySubjects: string[],
  secondarySubjects: string[],
  scores: Record<string, number>
): ScoreMatchOutcome {
  const primaryMinimum = major.cutOffScore ?? 0;
  const secondaryMinimum = major.secondaryCutOffScore ?? 0;
  const secondaryKnown = secondaryMinimum > 0;
  // An unknown дагалдах minimum is ranked as if it equalled the суурь one, so it isn't favoured.
  const weightedMinimum =
    PRIMARY_WEIGHT * primaryMinimum +
    SECONDARY_WEIGHT * (secondaryKnown ? secondaryMinimum : primaryMinimum);
  const ratioTo = (score: number, minimum: number) => (minimum > 0 ? score / minimum : score / 100);
  const minimums = secondaryKnown
    ? `суурь ${primaryMinimum}, дагалдах ${secondaryMinimum}`
    : `суурь ${primaryMinimum}`;
  const passing = pairs.filter(
    (pair) => pair.primaryScore >= primaryMinimum && pair.secondaryScore >= secondaryMinimum
  );

  if (passing.length > 0) {
    const best = bestPair(passing);
    return {
      matchScore: clampMatchScore(ratioTo(best.total, weightedMinimum)),
      eligible: true,
      verdict: 'ELIGIBLE',
      reason:
        `Босго давсан — өрсөлдөх эрхтэй. Суурь ${best.primary} ${best.primaryScore}, ` +
        `дагалдах ${best.secondary} ${best.secondaryScore} оноо нь ${major.name} мэргэжлийн ` +
        `${secondaryKnown ? 'шалгалт тус бүрийн босгыг' : 'суурь шалгалтын босгыг'} (${minimums}) хангаж байна. ` +
        `Тооцоолсон оноо ${best.total.toFixed(1)} (0.7 × ${best.primary} + 0.3 × ${best.secondary}).${PASSED_NOTE}` +
        (secondaryKnown ? '' : ` ${UNKNOWN_SECONDARY_CUT_OFF}`),
    };
  }

  const best = bestPair(pairs);
  const shortfalls = [
    best.primaryScore < primaryMinimum
      ? `суурь ${best.primary} ${best.primaryScore} (босго ${primaryMinimum})`
      : null,
    best.secondaryScore < secondaryMinimum
      ? `дагалдах ${best.secondary} ${best.secondaryScore} (босго ${secondaryMinimum})`
      : null,
  ].filter((text): text is string => text !== null);
  // A subject the student left empty could still make a passing pair, so name it instead of a flat no.
  const passingPrimary = primarySubjects.filter(
    (subject) => (scoreFor(scores, subject) ?? -Infinity) >= primaryMinimum
  );
  const untried = [
    ...new Set([
      ...secondarySubjects.filter(
        (subject) =>
          scoreFor(scores, subject) === undefined &&
          passingPrimary.some((primary) => primary !== subject)
      ),
      ...primarySubjects.filter((subject) => scoreFor(scores, subject) === undefined),
    ]),
  ];
  const shortBy = (score: number, minimum: number) => (score < minimum ? score / minimum : 1);
  return {
    matchScore: clampMatchScore(
      Math.min(
        ratioTo(best.total, weightedMinimum),
        shortBy(best.primaryScore, primaryMinimum),
        shortBy(best.secondaryScore, secondaryMinimum)
      )
    ),
    eligible: false,
    verdict: 'BELOW_CUT_OFF',
    reason:
      `Босго хүрэхгүй: ${shortfalls.join(', ')}. ${major.name} мэргэжилд шалгалт тус бүр өөрийн босгыг ` +
      `хангах ёстой (${minimums}).` +
      (untried.length
        ? ` Оноо оруулаагүй ${untried.join(', ')} хичээлээр босго хангах боломжтой эсэхийг шалгана уу.`
        : '') +
      (secondaryKnown ? '' : ` ${UNKNOWN_SECONDARY_CUT_OFF}`),
  };
}

/** Scores a major admitted on one суурь (70%) and one different дагалдах (30%) exam. */
function scoreWeightedMatch(
  major: MatchableMajor,
  primarySubjects: string[],
  scores: Record<string, number>
): ScoreMatchOutcome {
  const secondarySubjects = subjectList(major.secondarySubjects);
  const scorableSecondary = secondarySubjects.filter((subject) => subject !== SKILL_EXAM);
  const pairs = examPairs(scores, primarySubjects, scorableSecondary);

  if (scorableSecondary.length === 0 && secondarySubjects.length > 0) {
    // With a per-exam minimum, a суурь score below it already decides the verdict.
    const primaryMinimum = major.cutOffScore ?? 0;
    const enteredPrimary = primarySubjects
      .map((subject) => scoreFor(scores, subject))
      .filter((value): value is number => value !== undefined);
    if (
      major.secondaryCutOffScore != null &&
      enteredPrimary.length > 0 &&
      Math.max(...enteredPrimary) < primaryMinimum
    ) {
      const bestPrimary = Math.max(...enteredPrimary);
      return {
        matchScore: clampMatchScore(bestPrimary / primaryMinimum),
        eligible: false,
        verdict: 'BELOW_CUT_OFF',
        reason: `Босго хүрэхгүй: суурь хичээлийн оноо ${bestPrimary} нь ${major.name} мэргэжлийн ${primaryMinimum} босгоос доогуур байна.`,
      };
    }
    return {
      matchScore: 0,
      eligible: false,
      verdict: 'CHECK_WITH_SCHOOL',
      reason: `${major.name} мэргэжлийн дагалдах шалгалт нь ${SKILL_EXAM} тул сургуулиас тодруулна уу.`,
    };
  }
  if (pairs.length === 0) {
    return {
      matchScore: 0,
      eligible: false,
      verdict: 'MISSING_SCORES',
      reason: `${major.name} мэргэжилд суурь (${primarySubjects.join(', ')}) болон түүнээс өөр дагалдах (${scorableSecondary.join(', ')}) хичээлийн оноо хэрэгтэй.`,
    };
  }
  if (major.secondaryCutOffScore != null) {
    return perExamOutcome(major, pairs, primarySubjects, scorableSecondary, scores);
  }

  const best = bestPair(pairs);
  return outcomeFor(
    major,
    best.total,
    `тооцоолсон оноо ${best.total.toFixed(1)} (0.7 × ${best.primary} + 0.3 × ${best.secondary})`,
    '',
    PASSED_NOTE
  );
}

/**
 * Compares a student's subject scores against a major's required subjects
 * and cut-off score. `matchScore` is normalized to roughly `0..1` (capped at
 * `1.5` to still rank well-above-cutoff candidates higher) so results can be
 * sorted consistently regardless of whether a cut-off score is set.
 */
export function scoreMajorMatch(
  major: MatchableMajor,
  scores: Record<string, number>
): ScoreMatchOutcome {
  const primarySubjects = subjectList(major.primarySubjects);
  if (primarySubjects.length > 0) return scoreWeightedMatch(major, primarySubjects, scores);

  const requiredSubjects = subjectList(major.requiredSubjects);
  if (requiredSubjects.length === 0 && major.examNote) {
    // e.g. the суурь/дагалдах split is unknown: averaging the subjects would mislead.
    return {
      matchScore: 0,
      eligible: false,
      verdict: 'CHECK_WITH_SCHOOL',
      reason: `${major.name} мэргэжлийн оноог тооцох боломжгүй тул сургуулиас тодруулна уу. ${major.examNote}`,
    };
  }

  const relevantScores = requiredSubjects
    .map((subject) => scoreFor(scores, subject))
    .filter((value): value is number => value !== undefined);

  if (requiredSubjects.length === 0 || relevantScores.length === 0) {
    return {
      matchScore: 0,
      eligible: false,
      verdict: 'MISSING_SCORES',
      reason: `${major.name} мэргэжлийн шаардлагатай хичээлүүдэд тохирох оноо оруулаагүй байна.`,
    };
  }

  const average = relevantScores.reduce((sum, value) => sum + value, 0) / relevantScores.length;
  const missingSubjects = requiredSubjects.filter((subject) => scoreFor(scores, subject) === undefined);
  const missingNote = missingSubjects.length
    ? ` Дутуу хичээл: ${missingSubjects.join(', ')}.`
    : '';

  return outcomeFor(major, average, `дундаж оноо ${average.toFixed(1)}`, missingNote);
}
