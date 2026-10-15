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
> &
  Partial<Pick<Major, 'primaryWeight' | 'secondaryWeight' | 'selectionType'>>;

interface ExamPair {
  primary: string;
  primaryScore: number;
  secondary: string;
  secondaryScore: number;
  /** The weighted total (0.7 × суурь + 0.3 × дагалдах by default), rounded to one decimal. */
  total: number;
}

const MAX_MATCH_SCORE = 1.5;
const PRIMARY_WEIGHT = 0.7;
const SECONDARY_WEIGHT = 0.3;
/** Run by the school itself, so it has no ЭЕШ score to weigh. */
const SKILL_EXAM = 'Ур чадварын шалгалт';

/** How a major's two exams are weighed and worded. */
interface ExamRules {
  primaryWeight: number;
  secondaryWeight: number;
  /**
   * True when the major sets its own weights or selection type (e.g. АШУҮИС). Such
   * majors follow the dataset's reference check (`seed/eligibility.mjs`); the rest
   * keep the МУИС/ШУТИС wording unchanged.
   */
  ownRules: boolean;
  direct: boolean;
  /** Both exams weigh the same, so they are "1-р шалгалт" / "2-р шалгалт", not "суурь" / "дагалдах". */
  numbered: boolean;
  primaryLabel: string;
  secondaryLabel: string;
  /** "Тооцоолсон оноо", or "Нийлбэр оноо" for a plain sum. */
  scoreLabel: string;
}

function examRulesOf(major: MatchableMajor): ExamRules {
  const primaryWeight = major.primaryWeight ?? PRIMARY_WEIGHT;
  const secondaryWeight = major.secondaryWeight ?? SECONDARY_WEIGHT;
  const numbered = primaryWeight === secondaryWeight;
  return {
    primaryWeight,
    secondaryWeight,
    ownRules: major.primaryWeight != null || major.secondaryWeight != null || major.selectionType != null,
    direct: major.selectionType === 'direct',
    numbered,
    primaryLabel: numbered ? '1-р шалгалт' : 'суурь',
    secondaryLabel: numbered ? '2-р шалгалт' : 'дагалдах',
    scoreLabel: primaryWeight === 1 && secondaryWeight === 1 ? 'Нийлбэр оноо' : 'Тооцоолсон оноо',
  };
}

/** "0.7 × Математик + 0.3 × Физик", or "Хими + Биологи" for a plain sum. */
function formulaText(rules: ExamRules, pair: ExamPair): string {
  if (rules.primaryWeight === 1 && rules.secondaryWeight === 1) return `${pair.primary} + ${pair.secondary}`;
  return `${rules.primaryWeight} × ${pair.primary} + ${rules.secondaryWeight} × ${pair.secondary}`;
}

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
  rules: ExamRules,
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
        Math.round((rules.primaryWeight * primaryScore + rules.secondaryWeight * secondaryScore) * 10) / 10;
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
/** A direct-selection program admits whoever meets the minimums, in the order they pay. */
const DIRECT_NOTE =
  ' Шууд сонгох хөтөлбөрт зөвхөн 1 хөтөлбөр сонгох бөгөөд сургалтын төлбөрөө төлсөн дарааллаар баталгаажна.';
const SKILL_EXAM_NOTE = 'Ур чадварын шалгалтыг их сургууль өөрөө авна — сургуулиас тодруулна уу.';

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

const unknownSecondaryCutOff = (rules: ExamRules) =>
  `${rules.numbered ? '2-р шалгалтын' : 'Дагалдах хичээлийн'} босго тодорхойгүй — сургуулиас тодруулна уу.`;

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
  rules: ExamRules,
  pairs: ExamPair[],
  primarySubjects: string[],
  secondarySubjects: string[],
  scores: Record<string, number>
): ScoreMatchOutcome {
  const primaryMinimum = major.cutOffScore ?? 0;
  const secondaryMinimum = major.secondaryCutOffScore ?? 0;
  const secondaryKnown = secondaryMinimum > 0;
  // An unknown дагалдах minimum is ranked as if it equalled the суурь one, so it isn't favoured.
  // The match score is the total over the weighted minimum, so a sum (АШУҮИС) and a 0.7/0.3
  // total land on the same scale and rank together.
  const weightedMinimum =
    rules.primaryWeight * primaryMinimum +
    rules.secondaryWeight * (secondaryKnown ? secondaryMinimum : primaryMinimum);
  const ratioTo = (score: number, minimum: number) => (minimum > 0 ? score / minimum : score / 100);
  const minimums = secondaryKnown
    ? `${rules.primaryLabel} ${primaryMinimum}, ${rules.secondaryLabel} ${secondaryMinimum}`
    : `${rules.primaryLabel} ${primaryMinimum}`;
  const passing = pairs.filter(
    (pair) => pair.primaryScore >= primaryMinimum && pair.secondaryScore >= secondaryMinimum
  );

  if (passing.length > 0) {
    const best = bestPair(passing);
    const primaryOnly = rules.numbered ? '1-р шалгалтын' : 'суурь шалгалтын';
    return {
      matchScore: clampMatchScore(ratioTo(best.total, weightedMinimum)),
      eligible: true,
      verdict: 'ELIGIBLE',
      reason:
        `${rules.direct ? 'Босго давсан — шууд элсэх боломжтой' : 'Босго давсан — өрсөлдөх эрхтэй'}. ` +
        `${capitalize(rules.primaryLabel)} ${best.primary} ${best.primaryScore}, ` +
        `${rules.secondaryLabel} ${best.secondary} ${best.secondaryScore} оноо нь ${major.name} мэргэжлийн ` +
        `${secondaryKnown ? 'шалгалт тус бүрийн босгыг' : `${primaryOnly} босгыг`} (${minimums}) хангаж байна. ` +
        `${rules.scoreLabel} ${best.total.toFixed(1)} (${formulaText(rules, best)}).${rules.direct ? DIRECT_NOTE : PASSED_NOTE}` +
        (secondaryKnown ? '' : ` ${unknownSecondaryCutOff(rules)}`),
    };
  }

  const best = bestPair(pairs);
  const shortfalls = [
    best.primaryScore < primaryMinimum
      ? `${rules.primaryLabel} ${best.primary} ${best.primaryScore} (босго ${primaryMinimum})`
      : null,
    best.secondaryScore < secondaryMinimum
      ? `${rules.secondaryLabel} ${best.secondary} ${best.secondaryScore} (босго ${secondaryMinimum})`
      : null,
  ].filter((text): text is string => text !== null);
  // A subject the student left empty could still make a passing pair, so name it instead of a flat no.
  const untried = rules.ownRules
    ? untriedForFailingGroups(primarySubjects, primaryMinimum, secondarySubjects, secondaryMinimum, scores)
    : untriedSubjects(primarySubjects, primaryMinimum, secondarySubjects, scores);
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
      (secondaryKnown ? '' : ` ${unknownSecondaryCutOff(rules)}`),
  };
}

/** Empty subjects that could still pass: дагалдах ones next to a passing суурь, and every empty суурь. */
function untriedSubjects(
  primarySubjects: string[],
  primaryMinimum: number,
  secondarySubjects: string[],
  scores: Record<string, number>
): string[] {
  const passingPrimary = primarySubjects.filter(
    (subject) => (scoreFor(scores, subject) ?? -Infinity) >= primaryMinimum
  );
  return [
    ...new Set([
      ...secondarySubjects.filter(
        (subject) =>
          scoreFor(scores, subject) === undefined &&
          passingPrimary.some((primary) => primary !== subject)
      ),
      ...primarySubjects.filter((subject) => scoreFor(scores, subject) === undefined),
    ]),
  ];
}

/** The reference check's rule: suggest a group's empty subjects only while that group is failing. */
function untriedForFailingGroups(
  primarySubjects: string[],
  primaryMinimum: number,
  secondarySubjects: string[],
  secondaryMinimum: number,
  scores: Record<string, number>
): string[] {
  const passes = (subjects: string[], minimum: number) =>
    subjects.some((subject) => (scoreFor(scores, subject) ?? -Infinity) >= minimum);
  const empty = (subjects: string[]) => subjects.filter((subject) => scoreFor(scores, subject) === undefined);
  return [
    ...new Set([
      ...(passes(primarySubjects, primaryMinimum) ? [] : empty(primarySubjects)),
      ...(passes(secondarySubjects, secondaryMinimum) ? [] : empty(secondarySubjects)),
    ]),
  ];
}

/**
 * Scores a major admitted on one суурь and one different дагалдах exam, weighted
 * 0.7 / 0.3 unless the major sets its own weights (АШУҮИС: 1 / 1, a plain sum).
 */
function scoreWeightedMatch(
  major: MatchableMajor,
  primarySubjects: string[],
  scores: Record<string, number>
): ScoreMatchOutcome {
  const rules = examRulesOf(major);
  const secondarySubjects = subjectList(major.secondarySubjects);
  const scorableSecondary = secondarySubjects.filter((subject) => subject !== SKILL_EXAM);
  const pairs = examPairs(rules, scores, primarySubjects, scorableSecondary);

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
        reason: `Босго хүрэхгүй: ${rules.numbered ? '1-р шалгалтын' : 'суурь хичээлийн'} оноо ${bestPrimary} нь ${major.name} мэргэжлийн ${primaryMinimum} босгоос доогуур байна.`,
      };
    }
    return {
      matchScore: 0,
      eligible: false,
      verdict: 'CHECK_WITH_SCHOOL',
      reason: rules.ownRules
        ? SKILL_EXAM_NOTE
        : `${major.name} мэргэжлийн дагалдах шалгалт нь ${SKILL_EXAM} тул сургуулиас тодруулна уу.`,
    };
  }
  if (pairs.length === 0) {
    return {
      matchScore: 0,
      eligible: false,
      verdict: 'MISSING_SCORES',
      reason: `${major.name} мэргэжилд ${rules.primaryLabel} (${primarySubjects.join(', ')}) болон түүнээс өөр ${rules.secondaryLabel} (${scorableSecondary.join(', ')}) хичээлийн оноо хэрэгтэй.`,
    };
  }
  if (major.secondaryCutOffScore != null) {
    return perExamOutcome(major, rules, pairs, primarySubjects, scorableSecondary, scores);
  }

  const best = bestPair(pairs);
  return outcomeFor(
    major,
    best.total,
    `${rules.scoreLabel.toLowerCase()} ${best.total.toFixed(1)} (${formulaText(rules, best)})`,
    '',
    rules.direct ? DIRECT_NOTE : PASSED_NOTE
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
