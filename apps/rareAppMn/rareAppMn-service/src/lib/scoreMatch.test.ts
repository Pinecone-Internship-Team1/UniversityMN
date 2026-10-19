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

// Majors as the АШУҮИС import writes them, from the untouched ashuuis-oyutan-mn data/programs.json:
// group 1 / group 2 go to primary / secondary subjects, each with its own minimum, weights 1 / 1 (a plain
// sum, max 1600) and the program's selection type.
const MEDICAL_DOCTOR = {
  // mnums-med-khunii-ikh-emch
  name: 'Хүний их эмч',
  requiredSubjects: null,
  primarySubjects: ['Хими', 'Математик'],
  secondarySubjects: ['Биологи', 'Физик'],
  examNote:
    '1-р шалгалт: Хими эсвэл Математик — босго 490. 2-р шалгалт: Биологи эсвэл Физик — босго 490. Хоёр шалгалтын онооны нийлбэрээр жагсаана (8 хүртэл хөтөлбөр сонгоно).',
  cutOffScore: 490,
  secondaryCutOffScore: 490,
  primaryWeight: 1,
  secondaryWeight: 1,
  selectionType: 'list',
};

const NURSE = {
  // mnums-nursing-suvilagch: the second exam is АШУҮИС's own skills test
  name: 'Сувилагч',
  requiredSubjects: null,
  primarySubjects: ['Хими', 'Биологи'],
  secondarySubjects: ['Ур чадварын шалгалт'],
  examNote:
    '1-р шалгалт: Хими эсвэл Биологи — босго 430. 2-р шалгалт: Ур чадварын шалгалт (АШУҮИС өөрөө авна) — босго 450. Шууд сонгох хөтөлбөр: хоёр босгыг хангавал элсэх эрхтэй.',
  cutOffScore: 430,
  secondaryCutOffScore: 450,
  primaryWeight: 1,
  secondaryWeight: 1,
  selectionType: 'direct',
};

const HEALTH_INFORMATICS = {
  // mnums-bio-eruul-mendiin-medeelel-zuich (direct selection)
  name: 'Эрүүл мэндийн мэдээлэл зүйч',
  requiredSubjects: null,
  primarySubjects: ['Математик', 'Физик'],
  secondarySubjects: ['Нийгэм судлал', 'Англи хэл'],
  examNote:
    '1-р шалгалт: Математик эсвэл Физик — босго 490. 2-р шалгалт: Нийгэм судлал эсвэл Англи хэл — босго 450. Шууд сонгох хөтөлбөр: хоёр босгыг хангавал элсэх эрхтэй.',
  cutOffScore: 490,
  secondaryCutOffScore: 450,
  primaryWeight: 1,
  secondaryWeight: 1,
  selectionType: 'direct',
};

const DARKHAN_UNKNOWN = {
  // mnums-darkhan-niigmiin-eruul-mend-sudlalch (split unknown)
  name: 'Нийгмийн эрүүл мэнд судлалч',
  requiredSubjects: [],
  primarySubjects: [],
  secondarySubjects: [],
  examNote: 'Шалгалтын хичээл, босгыг Дархан-Уул салбар сургуулиас тодруулна уу (mnums-da.edu.mn, 7037 7734).',
  cutOffScore: null,
  secondaryCutOffScore: null,
  primaryWeight: 1,
  secondaryWeight: 1,
  selectionType: null,
};

describe('sum of two exams (АШУҮИС)', () => {
  test('both groups meet their minimums: eligible, scored as the plain sum', () => {
    const outcome = scoreMajorMatch(MEDICAL_DOCTOR, { Хими: 620, Биологи: 580 });
    expect(outcome.verdict).toBe('ELIGIBLE');
    expect(outcome.eligible).toBe(true);
    expect(outcome.reason).toStartWith('Босго давсан — өрсөлдөх эрхтэй.');
    expect(outcome.reason).toContain('Нийлбэр оноо 1200.0 (Хими + Биологи)');
    expect(outcome.reason).not.toContain('0.7');
    expect(outcome.matchScore).toBeCloseTo(1200 / 980);
  });

  test('group 2 below its minimum: below, names Биологи 490 and suggests Физик, not Математик', () => {
    const outcome = scoreMajorMatch(MEDICAL_DOCTOR, { Хими: 620, Биологи: 480 });
    expect(outcome.verdict).toBe('BELOW_CUT_OFF');
    expect(outcome.eligible).toBe(false);
    expect(outcome.reason).toStartWith('Босго хүрэхгүй: 2-р шалгалт Биологи 480 (босго 490).');
    expect(outcome.reason).toContain('Оноо оруулаагүй Физик хичээлээр');
    expect(outcome.reason).not.toContain('Математик');
  });

  test('skills-test program: neutral when group 1 meets its minimum', () => {
    const outcome = scoreMajorMatch(NURSE, { Хими: 500 });
    expect(outcome.verdict).toBe('CHECK_WITH_SCHOOL');
    expect(outcome.reason).toBe('Ур чадварын шалгалтыг их сургууль өөрөө авна — сургуулиас тодруулна уу.');
  });

  test('skills-test program: below when group 1 misses its minimum', () => {
    const outcome = scoreMajorMatch(NURSE, { Хими: 420 });
    expect(outcome.verdict).toBe('BELOW_CUT_OFF');
    expect(outcome.reason).toStartWith('Босго хүрэхгүй: 1-р шалгалтын оноо 420');
  });

  test('direct selection: eligible with the "шууд элсэх" wording', () => {
    const outcome = scoreMajorMatch(HEALTH_INFORMATICS, { Математик: 600, 'Англи хэл': 500 });
    expect(outcome.verdict).toBe('ELIGIBLE');
    expect(outcome.reason).toStartWith('Босго давсан — шууд элсэх боломжтой.');
    expect(outcome.reason).toContain('Нийлбэр оноо 1100.0 (Математик + Англи хэл)');
  });

  test('direct selection: the note fits every direct university, not only АШУҮИС', () => {
    const outcome = scoreMajorMatch(HEALTH_INFORMATICS, { Математик: 600, 'Англи хэл': 500 });
    expect(outcome.verdict).toBe('ELIGIBLE');
    expect(outcome.reason).toEndWith(
      ' Шууд элсүүлэх хөтөлбөрт босго хангасан бүртгүүлэгчийг суудал дүүртэл элсүүлдэг тул элсэх эрхээ хугацаанд нь баталгаажуулаарай.'
    );
    expect(outcome.reason).not.toContain('1 хөтөлбөр');
  });

  test('branch row still unknown: neutral', () => {
    expect(scoreMajorMatch(DARKHAN_UNKNOWN, { Хими: 620, Биологи: 580 }).verdict).toBe('CHECK_WITH_SCHOOL');
  });

  test('a sum and a 0.7/0.3 total rank on the same scale', () => {
    // Both clear their minimums by the same margin (each exam 10% above its minimum).
    const sum = scoreMajorMatch(MEDICAL_DOCTOR, { Хими: 539, Биологи: 539 });
    const weighted = scoreMajorMatch(COMPUTER_SCIENCE, { Математик: 539, Физик: 495 });
    expect(sum.matchScore).toBeCloseTo(1.1);
    expect(weighted.matchScore).toBeCloseTo(1.1);
  });
});
