import type { Major } from '../db/schema';

export interface ScoreMatchOutcome {
  matchScore: number;
  eligible: boolean;
  reason: string;
}

type MatchableMajor = Pick<Major, 'name' | 'requiredSubjects' | 'cutOffScore'>;

const MAX_MATCH_SCORE = 1.5;

function requiredSubjectsOf(major: Pick<Major, 'requiredSubjects'>): string[] {
  const subjects: unknown = major.requiredSubjects;
  if (!Array.isArray(subjects)) return [];
  return subjects.filter((subject): subject is string => typeof subject === 'string');
}

function scoreFor(scores: Record<string, number>, subject: string): number | undefined {
  if (!Object.hasOwn(scores, subject)) return undefined;
  const value: unknown = scores[subject];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

export function hasRelevantScores(
  major: Pick<Major, 'requiredSubjects'>,
  scores: Record<string, number>
): boolean {
  return requiredSubjectsOf(major).some((subject) => scoreFor(scores, subject) !== undefined);
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
  const requiredSubjects = requiredSubjectsOf(major);
  const relevantScores = requiredSubjects
    .map((subject) => scoreFor(scores, subject))
    .filter((value): value is number => value !== undefined);

  if (requiredSubjects.length === 0 || relevantScores.length === 0) {
    return {
      matchScore: 0,
      eligible: false,
      reason: `${major.name} мэргэжлийн шаардлагатай хичээлүүдэд тохирох оноо оруулаагүй байна.`,
    };
  }

  const average = relevantScores.reduce((sum, value) => sum + value, 0) / relevantScores.length;
  const cutOffScore = major.cutOffScore ?? 0;
  const rawMatchScore = cutOffScore > 0 ? average / cutOffScore : average / 100;
  const matchScore = Math.min(Math.max(rawMatchScore, 0), MAX_MATCH_SCORE);
  const eligible = cutOffScore > 0 ? average >= cutOffScore : true;

  const missingSubjects = requiredSubjects.filter((subject) => scoreFor(scores, subject) === undefined);
  const missingNote = missingSubjects.length
    ? ` Дутуу хичээл: ${missingSubjects.join(', ')}.`
    : '';
  const averageText = average.toFixed(1);

  const reason =
    cutOffScore <= 0
      ? `${major.name} мэргэжилд босго оноо тогтоогоогүй. Таны дундаж оноо ${averageText}.${missingNote}`
      : eligible
        ? `Дундаж оноо ${averageText} нь ${major.name} мэргэжлийн ${cutOffScore} босго оноог хангаж байна.${missingNote}`
        : `Дундаж оноо ${averageText} нь ${major.name} мэргэжлийн ${cutOffScore} босго оноонаас доогуур байна.${missingNote}`;

  return { matchScore, eligible, reason };
}
