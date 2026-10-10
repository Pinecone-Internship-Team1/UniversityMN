import { describe, expect, test } from 'bun:test';
import { scoreMajorMatch } from './scoreMatch';

// Majors as the ШУТИС import writes them, from the untouched shutis-oyutan-mn v2 data/programs.json:
// confirmed/likely rows get the суурь/дагалдах split and secondaryCutOffScore = secondary_threshold_score ?? 0;
// unclear/unknown rows get empty subjects and the display text as examNote.
const COMPUTER_SCIENCE = {
  // must-mkhts-kompiyuteryn-ukhaan (061301)
  name: 'Компьютерын ухаан',
  requiredSubjects: null,
  primarySubjects: ['Математик', 'Физик'],
  secondarySubjects: ['Нийгэм судлал', 'Англи хэл', 'Математик', 'Физик'],
  examNote: null,
  cutOffScore: 490,
  secondaryCutOffScore: 450,
};

const SOFTWARE_ENGINEERING = {
  // must-mkhts-programm-khangamjiin-injenerchlel (071405): secondary_threshold_score null → 0 (unknown)
  ...COMPUTER_SCIENCE,
  name: 'Программ хангамжийн инженерчлэл',
  secondaryCutOffScore: 0,
};

const ARCHITECTURE = {
  // must-bas-arkhitektur (073104): the дагалдах exam is ШУТИС's own aptitude test
  name: 'Архитектур',
  requiredSubjects: null,
  primarySubjects: ['Математик', 'Физик'],
  secondarySubjects: ['Ур чадварын шалгалт'],
  examNote: null,
  cutOffScore: 550,
  secondaryCutOffScore: 550,
};

const GAS_ENGINEERING = {
  // must-guus-khiin-injenerchlel (072408, split_confidence unclear)
  name: 'Хийн инженерчлэл',
  requiredSubjects: [],
  primarySubjects: [],
  secondarySubjects: [],
  examNote:
    'Шалгалтын хичээлүүд (хэсэгчлэн): Математик, Физик — суурь/дагалдахыг burtgel.elselt.edu.mn-ээс шалгана уу.',
  cutOffScore: null,
  secondaryCutOffScore: null,
};

const BRANCH_JOINT = {
  // must-dats-mekhanik-injenerchlel-mekhts-tei-2-2 (still unknown after gap-filling)
  name: 'Механик инженерчлэл (МехТС-тэй 2+2)',
  requiredSubjects: [],
  primarySubjects: [],
  secondarySubjects: [],
  examNote:
    'Шалгалтын хичээл нийтлэгдээгүй (УБ дахь ижил нэртэй хөтөлбөртэй төстэй байх магадлалтай) — burtgel.elselt.edu.mn-ээс шалгана уу. Орон нутгийн босго 430.',
  cutOffScore: 430,
  secondaryCutOffScore: null,
};

// МУИС Даатгал as stored on local D1: one minimum on the weighted total.
const MUIS_INSURANCE = {
  name: 'Даатгал',
  requiredSubjects: null,
  primarySubjects: ['Математик'],
  secondarySubjects: ['Англи хэл', 'Нийгэм судлал'],
  examNote: null,
  cutOffScore: 490,
  secondaryCutOffScore: null,
};

describe('majors without a дагалдах minimum (МУИС)', () => {
  // Captured from the code before per-exam minimums changed; must stay identical.
  test('weighted total above the cut-off', () => {
    expect(scoreMajorMatch(MUIS_INSURANCE, { Математик: 600, 'Англи хэл': 420 })).toEqual({
      matchScore: 1.1142857142857143,
      eligible: true,
      verdict: 'ELIGIBLE',
      reason:
        'Тооцоолсон оноо 546.0 (0.7 × Математик + 0.3 × Англи хэл) нь Даатгал мэргэжлийн 490 босго оноог хангаж байна. Босго давсан нь элсэх баталгаа биш, эрэлттэй хөтөлбөрт илүү өндөр оноо хэрэгтэй байж болно.',
    });
  });

  test('weighted total below the cut-off', () => {
    expect(scoreMajorMatch(MUIS_INSURANCE, { Математик: 450, 'Англи хэл': 500 })).toEqual({
      matchScore: 0.9489795918367347,
      eligible: false,
      verdict: 'BELOW_CUT_OFF',
      reason:
        'Тооцоолсон оноо 465.0 (0.7 × Математик + 0.3 × Англи хэл) нь Даатгал мэргэжлийн 490 босго оноонаас доогуур байна.',
    });
  });

  test('no дагалдах score', () => {
    expect(scoreMajorMatch(MUIS_INSURANCE, { Математик: 600 })).toEqual({
      matchScore: 0,
      eligible: false,
      verdict: 'MISSING_SCORES',
      reason:
        'Даатгал мэргэжилд суурь (Математик) болон түүнээс өөр дагалдах (Англи хэл, Нийгэм судлал) хичээлийн оноо хэрэгтэй.',
    });
  });
});

describe('per-exam minimums (ШУТИС)', () => {
  test('both minimums met: eligible, ranked by the best weighted pair', () => {
    const outcome = scoreMajorMatch(COMPUTER_SCIENCE, { Математик: 600, Физик: 500 });
    expect(outcome.verdict).toBe('ELIGIBLE');
    expect(outcome.eligible).toBe(true);
    expect(outcome.reason).toStartWith('Босго давсан — өрсөлдөх эрхтэй.');
    expect(outcome.reason).toContain('Тооцоолсон оноо 570.0 (0.7 × Математик + 0.3 × Физик)');
  });

  test('дагалдах below its own minimum: below, names Физик 450 and suggests the empty subjects', () => {
    const outcome = scoreMajorMatch(COMPUTER_SCIENCE, { Математик: 600, Физик: 440 });
    expect(outcome.verdict).toBe('BELOW_CUT_OFF');
    expect(outcome.eligible).toBe(false);
    expect(outcome.matchScore).toBeLessThan(1);
    expect(outcome.reason).toStartWith('Босго хүрэхгүй: дагалдах Физик 440 (босго 450).');
    expect(outcome.reason).not.toContain('суурь Математик 600');
    expect(outcome.reason).toContain('Оноо оруулаагүй Нийгэм судлал, Англи хэл хичээлээр');
  });

  test('unknown дагалдах minimum (0): only суурь is checked, with the caveat', () => {
    const outcome = scoreMajorMatch(SOFTWARE_ENGINEERING, { Математик: 600, Физик: 300 });
    expect(outcome.verdict).toBe('ELIGIBLE');
    expect(outcome.reason).toContain('Тооцоолсон оноо 510.0 (0.7 × Математик + 0.3 × Физик)');
    expect(outcome.reason).toContain('Дагалдах хичээлийн босго тодорхойгүй');
  });

  test('aptitude-test дагалдах: below when суурь misses its minimum', () => {
    const outcome = scoreMajorMatch(ARCHITECTURE, { Математик: 500 });
    expect(outcome.verdict).toBe('BELOW_CUT_OFF');
    expect(outcome.reason).toStartWith('Босго хүрэхгүй:');
  });

  test('aptitude-test дагалдах: neutral when суурь meets its minimum', () => {
    expect(scoreMajorMatch(ARCHITECTURE, { Математик: 600 }).verdict).toBe('CHECK_WITH_SCHOOL');
  });

  test('unclear split: neutral', () => {
    expect(scoreMajorMatch(GAS_ENGINEERING, { Математик: 600, Физик: 600 }).verdict).toBe(
      'CHECK_WITH_SCHOOL'
    );
  });

  test('still unknown after gap-filling: neutral', () => {
    expect(scoreMajorMatch(BRANCH_JOINT, { Математик: 600, Физик: 600 }).verdict).toBe(
      'CHECK_WITH_SCHOOL'
    );
  });
});
