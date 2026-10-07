import type { Major } from '../db/schema';

export interface ScoreMatchOutcome {
  matchScore: number;
  eligible: boolean;
  reason: string;
}

type MatchableMajor = Pick<Major, 'name' | 'requiredSubjects' | 'cutOffScore'>;

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
  const requiredSubjects = major.requiredSubjects ?? [];
  const relevantScores = requiredSubjects
    .map((subject) => scores[subject])
    .filter((value): value is number => typeof value === 'number');

  if (requiredSubjects.length === 0 || relevantScores.length === 0) {
    return {
      matchScore: 0,
      eligible: false,
      reason: `No matching scores were provided for ${major.name}'s required subjects.`,
    };
  }

  const average = relevantScores.reduce((sum, value) => sum + value, 0) / relevantScores.length;
  const cutOffScore = major.cutOffScore ?? 0;
  const matchScore = cutOffScore > 0 ? Math.min(average / cutOffScore, 1.5) : average / 100;
  const eligible = cutOffScore > 0 ? average >= cutOffScore : true;

  const missingSubjects = requiredSubjects.filter((subject) => typeof scores[subject] !== 'number');
  const missingNote = missingSubjects.length
    ? ` Missing scores for: ${missingSubjects.join(', ')}.`
    : '';

  const reason = eligible
    ? `Average score ${average.toFixed(1)} meets the ${cutOffScore || 'unspecified'} cut-off for ${major.name}.${missingNote}`
    : `Average score ${average.toFixed(1)} is below the ${cutOffScore} cut-off for ${major.name}.${missingNote}`;

  return { matchScore, eligible, reason };
}
