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
  'name' | 'requiredSubjects' | 'primarySubjects' | 'secondarySubjects' | 'examNote' | 'cutOffScore'
>;

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

/** The best 0.7 × суурь + 0.3 × дагалдах total, where the two exams must differ. */
function bestWeightedScore(
  scores: Record<string, number>,
  primarySubjects: string[],
  secondarySubjects: string[]
): { primary: string; secondary: string; total: number } | null {
  let best: { primary: string; secondary: string; total: number } | null = null;
  for (const primary of primarySubjects) {
    const primaryScore = scoreFor(scores, primary);
    if (primaryScore === undefined) continue;
    for (const secondary of secondarySubjects) {
      const secondaryScore = scoreFor(scores, secondary);
      if (secondary === primary || secondaryScore === undefined) continue;
      const total =
        Math.round((PRIMARY_WEIGHT * primaryScore + SECONDARY_WEIGHT * secondaryScore) * 10) / 10;
      if (!best || total > best.total) best = { primary, secondary, total };
    }
  }
  return best;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

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
  const rawMatchScore = cutOffScore > 0 ? score / cutOffScore : score / 100;
  const matchScore = Math.min(Math.max(rawMatchScore, 0), MAX_MATCH_SCORE);
  const eligible = cutOffScore > 0 ? score >= cutOffScore : true;

  const reason =
    cutOffScore <= 0
      ? `${major.name} мэргэжилд босго оноо тогтоогоогүй. Таны ${scoreText}.${note}`
      : eligible
        ? `${capitalize(scoreText)} нь ${major.name} мэргэжлийн ${cutOffScore} босго оноог хангаж байна.${passedNote}${note}`
        : `${capitalize(scoreText)} нь ${major.name} мэргэжлийн ${cutOffScore} босго оноонаас доогуур байна.${note}`;

  return { matchScore, eligible, verdict: eligible ? 'ELIGIBLE' : 'BELOW_CUT_OFF', reason };
}

/** Scores a major admitted on one суурь (70%) and one different дагалдах (30%) exam. */
function scoreWeightedMatch(
  major: MatchableMajor,
  primarySubjects: string[],
  scores: Record<string, number>
): ScoreMatchOutcome {
  const secondarySubjects = subjectList(major.secondarySubjects);
  const scorableSecondary = secondarySubjects.filter((subject) => subject !== SKILL_EXAM);
  const best = bestWeightedScore(scores, primarySubjects, scorableSecondary);

  if (scorableSecondary.length === 0 && secondarySubjects.length > 0) {
    return {
      matchScore: 0,
      eligible: false,
      verdict: 'CHECK_WITH_SCHOOL',
      reason: `${major.name} мэргэжлийн дагалдах шалгалт нь ${SKILL_EXAM} тул сургуулиас тодруулна уу.`,
    };
  }
  if (!best) {
    return {
      matchScore: 0,
      eligible: false,
      verdict: 'MISSING_SCORES',
      reason: `${major.name} мэргэжилд суурь (${primarySubjects.join(', ')}) болон түүнээс өөр дагалдах (${scorableSecondary.join(', ')}) хичээлийн оноо хэрэгтэй.`,
    };
  }

  return outcomeFor(
    major,
    best.total,
    `тооцоолсон оноо ${best.total.toFixed(1)} (0.7 × ${best.primary} + 0.3 × ${best.secondary})`,
    '',
    ' Босго давсан нь элсэх баталгаа биш, эрэлттэй хөтөлбөрт илүү өндөр оноо хэрэгтэй байж болно.'
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
