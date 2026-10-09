import { notInArray } from 'drizzle-orm';
import type { Database } from './index';
import {
  admissionSchedules,
  dormitories,
  faculties,
  majors,
  scholarships,
  schools,
} from './schema';

/**
 * Demo/local-dev seed data for the 11 universities the frontend already
 * ships static assets (logos) and copy for. `name` values intentionally
 * match apps/rareAppMn/rareAppMn-web's src/lib/university-logos.ts `full`
 * field exactly, so the frontend can resolve a backend School to its
 * static logo asset by name.
 *
 * Ids are fixed, readable strings (not random UUIDs) so this seed is
 * idempotent -- re-running it always produces the same rows.
 */

interface MajorSeed {
  id: string;
  /** Name of the faculty (school within the university) the major belongs to. */
  faculty: string;
  name: string;
  category: string;
  requiredSubjects: string[];
  cutOffScore: number;
  degreeType: string;
  tuitionFee: number;
}

interface ScholarshipSeed {
  id: string;
  name: string;
  coverage: string;
  requirements: string;
  deadline: string;
}

interface DormitorySeed {
  id: string;
  capacity: number;
  feePerMonth: number;
  facilities: string[];
}

interface AdmissionScheduleSeed {
  id: string;
  eventName: string;
  startDate: string;
  endDate: string;
}

interface SchoolSeed {
  id: string;
  name: string;
  location: string;
  tuitionFee: number;
  dormAvailable: boolean;
  scholarshipAvailable: boolean;
  overview: string;
  website: string;
  majors: MajorSeed[];
  scholarships: ScholarshipSeed[];
  dormitories: DormitorySeed[];
  admissionSchedules: AdmissionScheduleSeed[];
}

export const SEED_SCHOOLS: SchoolSeed[] = [
  {
    id: 'sch_muis',
    name: 'Монгол Улсын Их Сургууль',
    location: 'Сүхбаатар дүүрэг, Улаанбаатар',
    tuitionFee: 4_500_000,
    dormAvailable: true,
    scholarshipAvailable: true,
    overview:
      'Монгол Улсын Их Сургууль нь 1942 онд байгуулагдсан Монгол улсын анхны бөгөөд тэргүүлэх их сургууль юм.',
    website: 'https://www.num.edu.mn',
    majors: [
      {
        id: 'maj_muis_1',
        faculty: 'Инженер, технологийн сургууль',
        name: 'Компьютерийн ухаан',
        category: 'Байгалийн ухаан',
        requiredSubjects: ['Математик', 'Физик'],
        cutOffScore: 580,
        degreeType: 'BACHELOR',
        tuitionFee: 4_800_000,
      },
      {
        id: 'maj_muis_2',
        faculty: 'Олон улсын харилцаа, нийтийн удирдлагын сургууль',
        name: 'Олон улсын харилцаа',
        category: 'Хүмүүнлэг',
        requiredSubjects: ['Математик', 'Англи хэл'],
        cutOffScore: 560,
        degreeType: 'BACHELOR',
        tuitionFee: 4_300_000,
      },
      {
        id: 'maj_muis_3',
        faculty: 'Бизнесийн сургууль',
        name: 'Бизнесийн удирдлага',
        category: 'Бизнес',
        requiredSubjects: ['Математик'],
        cutOffScore: 540,
        degreeType: 'BACHELOR',
        tuitionFee: 4_300_000,
      },
    ],
    scholarships: [
      {
        id: 'sp_muis_1',
        name: 'МУИС-ийн нэрэмжит тэтгэлэг',
        coverage: 'Сургалтын төлбөрийн 50-100%',
        requirements: 'ЭЕШ дундаж 85+, өрхийн орлого',
        deadline: '2026-08-15',
      },
    ],
    dormitories: [
      {
        id: 'dorm_muis',
        capacity: 1200,
        feePerMonth: 180_000,
        facilities: ['Wi-Fi', 'Угаалгын өрөө', 'Хоолны газар', 'Номын сан'],
      },
    ],
    admissionSchedules: [
      {
        id: 'adm_muis_1',
        eventName: 'Элсэлтийн баримт бичиг хүлээн авах',
        startDate: '2026-06-01',
        endDate: '2026-07-15',
      },
      {
        id: 'adm_muis_2',
        eventName: 'Элсэлтийн ярилцлага',
        startDate: '2026-07-20',
        endDate: '2026-07-30',
      },
    ],
  },
  {
    id: 'sch_shutis',
    name: 'Шинжлэх Ухаан Технологийн Их Сургууль',
    location: 'Сүхбаатар дүүрэг, Улаанбаатар',
    tuitionFee: 4_100_000,
    dormAvailable: true,
    scholarshipAvailable: true,
    overview:
      'Шинжлэх Ухаан Технологийн Их Сургууль нь инженер, технологийн чиглэлээр улсдаа тэргүүлэх сургууль юм.',
    website: 'https://www.must.edu.mn',
    majors: [
      {
        id: 'maj_shutis_1',
        faculty: 'Мэдээлэл, холбооны технологийн сургууль',
        name: 'Программ хангамж',
        category: 'Инженерчлэл',
        requiredSubjects: ['Математик', 'Физик'],
        cutOffScore: 550,
        degreeType: 'BACHELOR',
        tuitionFee: 4_200_000,
      },
      {
        id: 'maj_shutis_2',
        faculty: 'Мэдээлэл, холбооны технологийн сургууль',
        name: 'Сүлжээний инженер',
        category: 'Инженерчлэл',
        requiredSubjects: ['Математик', 'Физик'],
        cutOffScore: 530,
        degreeType: 'BACHELOR',
        tuitionFee: 4_200_000,
      },
      {
        id: 'maj_shutis_3',
        faculty: 'Барилга, архитектурын сургууль',
        name: 'Архитектур',
        category: 'Инженерчлэл',
        requiredSubjects: ['Математик', 'Зураг зүй'],
        cutOffScore: 520,
        degreeType: 'BACHELOR',
        tuitionFee: 4_500_000,
      },
    ],
    scholarships: [
      {
        id: 'sp_shutis_1',
        name: 'ШУТИС-ийн захирлын нэрэмжит тэтгэлэг',
        coverage: 'Сургалтын төлбөрийн 30-70%',
        requirements: 'ЭЕШ дундаж 80+',
        deadline: '2026-08-10',
      },
    ],
    dormitories: [
      {
        id: 'dorm_shutis',
        capacity: 900,
        feePerMonth: 170_000,
        facilities: ['Wi-Fi', 'Спорт заал', 'Хоолны газар'],
      },
    ],
    admissionSchedules: [
      {
        id: 'adm_shutis_1',
        eventName: 'Элсэлтийн баримт бичиг хүлээн авах',
        startDate: '2026-06-01',
        endDate: '2026-07-10',
      },
    ],
  },
  {
    id: 'sch_sezis',
    name: 'Санхүү Эдийн Засгийн Их Сургууль',
    location: 'Баянзүрх дүүрэг, Улаанбаатар',
    tuitionFee: 8_000_000,
    dormAvailable: false,
    scholarshipAvailable: true,
    overview:
      'Санхүү Эдийн Засгийн Их Сургууль нь бизнес, санхүү, менежментийн сургалтаар тэргүүлэгч сургуулиудын нэг юм.',
    website: 'https://ufe.edu.mn',
    majors: [
      {
        id: 'maj_sezis_1',
        faculty: 'Санхүү, нягтлан бодох бүртгэлийн сургууль',
        name: 'Санхүү ба банк',
        category: 'Бизнес',
        requiredSubjects: ['Математик'],
        cutOffScore: 600,
        degreeType: 'BACHELOR',
        tuitionFee: 8_200_000,
      },
      {
        id: 'maj_sezis_2',
        faculty: 'Санхүү, нягтлан бодох бүртгэлийн сургууль',
        name: 'Нягтлан бодох бүртгэл',
        category: 'Бизнес',
        requiredSubjects: ['Математик'],
        cutOffScore: 580,
        degreeType: 'BACHELOR',
        tuitionFee: 7_800_000,
      },
      {
        id: 'maj_sezis_3',
        faculty: 'Бизнесийн удирдлагын сургууль',
        name: 'Маркетинг',
        category: 'Бизнес',
        requiredSubjects: ['Математик', 'Англи хэл'],
        cutOffScore: 560,
        degreeType: 'BACHELOR',
        tuitionFee: 7_800_000,
      },
    ],
    scholarships: [
      {
        id: 'sp_sezis_1',
        name: 'UFE Merit Scholarship',
        coverage: 'Сургалтын төлбөрийн 25-50%',
        requirements: 'ЭЕШ дундаж 85+',
        deadline: '2026-08-01',
      },
    ],
    dormitories: [
      {
        id: 'dorm_sezis',
        capacity: 300,
        feePerMonth: 220_000,
        facilities: ['Wi-Fi', 'Хамгаалалт'],
      },
    ],
    admissionSchedules: [
      {
        id: 'adm_sezis_1',
        eventName: 'Элсэлтийн баримт бичиг хүлээн авах',
        startDate: '2026-06-05',
        endDate: '2026-07-20',
      },
    ],
  },
  {
    id: 'sch_ashuuis',
    name: 'Анагаахын Шинжлэх Ухааны Үндэсний Их Сургууль',
    location: 'Сүхбаатар дүүрэг, Улаанбаатар',
    tuitionFee: 5_300_000,
    dormAvailable: true,
    scholarshipAvailable: true,
    overview:
      'Анагаахын Шинжлэх Ухааны Үндэсний Их Сургууль нь эрүүл мэнд, анагаах ухааны салбарын мэргэжилтнүүдийг бэлтгэдэг.',
    website: 'https://www.mnums.edu.mn',
    majors: [
      {
        id: 'maj_ashuuis_1',
        faculty: 'Анагаах ухааны сургууль',
        name: 'Хүний эмч',
        category: 'Эрүүл мэнд',
        requiredSubjects: ['Хими', 'Биологи'],
        cutOffScore: 620,
        degreeType: 'BACHELOR',
        tuitionFee: 6_500_000,
      },
      {
        id: 'maj_ashuuis_2',
        faculty: 'Эм зүйн сургууль',
        name: 'Эм зүй',
        category: 'Эрүүл мэнд',
        requiredSubjects: ['Хими', 'Биологи'],
        cutOffScore: 590,
        degreeType: 'BACHELOR',
        tuitionFee: 5_200_000,
      },
      {
        id: 'maj_ashuuis_3',
        faculty: 'Нийгмийн эрүүл мэндийн сургууль',
        name: 'Нийтийн эрүүл мэнд',
        category: 'Эрүүл мэнд',
        requiredSubjects: ['Биологи'],
        cutOffScore: 560,
        degreeType: 'BACHELOR',
        tuitionFee: 4_800_000,
      },
    ],
    scholarships: [
      {
        id: 'sp_ashuuis_1',
        name: 'Эрүүл мэндийн яамны тэтгэлэг',
        coverage: 'Сургалтын төлбөрийн 50-100%',
        requirements: 'ЭЕШ дундаж 90+, хөдөөгийн сурагч',
        deadline: '2026-08-05',
      },
    ],
    dormitories: [
      {
        id: 'dorm_ashuuis',
        capacity: 500,
        feePerMonth: 190_000,
        facilities: ['Wi-Fi', 'Эмнэлэг', 'Хоолны газар'],
      },
    ],
    admissionSchedules: [
      {
        id: 'adm_ashuuis_1',
        eventName: 'Элсэлтийн баримт бичиг хүлээн авах',
        startDate: '2026-06-01',
        endDate: '2026-07-05',
      },
      {
        id: 'adm_ashuuis_2',
        eventName: 'Элсэлтийн шалгалт',
        startDate: '2026-07-10',
        endDate: '2026-07-18',
      },
    ],
  },
  {
    id: 'sch_khaais',
    name: 'Хөдөө Аж Ахуйн Их Сургууль',
    location: 'Хан-Уул дүүрэг, Улаанбаатар',
    tuitionFee: 3_500_000,
    dormAvailable: true,
    scholarshipAvailable: true,
    overview:
      'Хөдөө Аж Ахуйн Их Сургууль нь мал эмнэлэг, агрономи, хөдөө аж ахуйн инженерчлэлийн чиглэлээр мэргэжилтэн бэлтгэдэг.',
    website: 'https://www.muls.edu.mn',
    majors: [
      {
        id: 'maj_khaais_1',
        faculty: 'Мал эмнэлгийн сургууль',
        name: 'Мал эмнэлэг',
        category: 'Хөдөө аж ахуй',
        requiredSubjects: ['Биологи', 'Хими'],
        cutOffScore: 480,
        degreeType: 'BACHELOR',
        tuitionFee: 3_600_000,
      },
      {
        id: 'maj_khaais_2',
        faculty: 'Агрономийн сургууль',
        name: 'Агрономи',
        category: 'Хөдөө аж ахуй',
        requiredSubjects: ['Биологи'],
        cutOffScore: 460,
        degreeType: 'BACHELOR',
        tuitionFee: 3_400_000,
      },
      {
        id: 'maj_khaais_3',
        faculty: 'Инженер, технологийн сургууль',
        name: 'Хөдөө аж ахуйн инженерчлэл',
        category: 'Инженерчлэл',
        requiredSubjects: ['Математик', 'Физик'],
        cutOffScore: 470,
        degreeType: 'BACHELOR',
        tuitionFee: 3_500_000,
      },
    ],
    scholarships: [
      {
        id: 'sp_khaais_1',
        name: 'Хөдөөгийн сурагчдын тэтгэлэг',
        coverage: 'Сургалтын төлбөрийн 40-80%',
        requirements: 'Хөдөөгийн бүртгэлтэй сурагч',
        deadline: '2026-08-12',
      },
    ],
    dormitories: [
      {
        id: 'dorm_khaais',
        capacity: 700,
        feePerMonth: 150_000,
        facilities: ['Wi-Fi', 'Фермийн дадлага', 'Хоолны газар'],
      },
    ],
    admissionSchedules: [
      {
        id: 'adm_khaais_1',
        eventName: 'Элсэлтийн баримт бичиг хүлээн авах',
        startDate: '2026-06-01',
        endDate: '2026-07-25',
      },
    ],
  },
  {
    id: 'sch_mubis',
    name: 'Монгол Улсын Боловсролын Их Сургууль',
    location: 'Сүхбаатар дүүрэг, Улаанбаатар',
    tuitionFee: 3_700_000,
    dormAvailable: true,
    scholarshipAvailable: true,
    overview:
      'Монгол Улсын Боловсролын Их Сургууль нь багш бэлтгэх чиглэлээр улсдаа тэргүүлэх сургууль юм.',
    website: 'https://www.msue.edu.mn',
    majors: [
      {
        id: 'maj_mubis_1',
        faculty: 'Боловсрол судлалын сургууль',
        name: 'Боловсрол судлал',
        category: 'Боловсрол',
        requiredSubjects: ['Нийгмийн ухаан'],
        cutOffScore: 500,
        degreeType: 'BACHELOR',
        tuitionFee: 3_700_000,
      },
      {
        id: 'maj_mubis_2',
        faculty: 'Боловсрол судлалын сургууль',
        name: 'Багш (Эхлэх анги)',
        category: 'Боловсрол',
        requiredSubjects: ['Нийгмийн ухаан'],
        cutOffScore: 480,
        degreeType: 'BACHELOR',
        tuitionFee: 3_500_000,
      },
      {
        id: 'maj_mubis_3',
        faculty: 'Нийгмийн ухааны сургууль',
        name: 'Сэтгэл судлал',
        category: 'Хүмүүнлэг',
        requiredSubjects: ['Биологи'],
        cutOffScore: 520,
        degreeType: 'BACHELOR',
        tuitionFee: 3_800_000,
      },
    ],
    scholarships: [
      {
        id: 'sp_mubis_1',
        name: 'Багшийн мэргэжлийн тэтгэлэг',
        coverage: 'Сургалтын төлбөрийн 50%',
        requirements: 'Багшийн мэргэжил сонгосон',
        deadline: '2026-08-08',
      },
    ],
    dormitories: [
      {
        id: 'dorm_mubis',
        capacity: 600,
        feePerMonth: 160_000,
        facilities: ['Wi-Fi', 'Номын сан'],
      },
    ],
    admissionSchedules: [
      {
        id: 'adm_mubis_1',
        eventName: 'Элсэлтийн баримт бичиг хүлээн авах',
        startDate: '2026-06-01',
        endDate: '2026-07-20',
      },
    ],
  },
  {
    id: 'sch_otgontenger',
    name: 'Отгонтэнгэр Их Сургууль',
    location: 'Хан-Уул дүүрэг, Улаанбаатар',
    tuitionFee: 4_000_000,
    dormAvailable: false,
    scholarshipAvailable: true,
    overview:
      'Отгонтэнгэр Их Сургууль нь хууль зүй, бизнес, технологийн чиглэлээр сургалт явуулдаг хувийн их сургууль.',
    website: 'https://www.otgontenger.edu.mn',
    majors: [
      {
        id: 'maj_otgontenger_1',
        faculty: 'Хууль зүйн сургууль',
        name: 'Хууль зүй',
        category: 'Хууль зүй',
        requiredSubjects: ['Нийгмийн ухаан'],
        cutOffScore: 480,
        degreeType: 'BACHELOR',
        tuitionFee: 4_100_000,
      },
      {
        id: 'maj_otgontenger_2',
        faculty: 'Мэдээллийн технологийн сургууль',
        name: 'Мэдээллийн технологи',
        category: 'Инженерчлэл',
        requiredSubjects: ['Математик'],
        cutOffScore: 470,
        degreeType: 'BACHELOR',
        tuitionFee: 4_000_000,
      },
    ],
    scholarships: [
      {
        id: 'sp_otgontenger_1',
        name: 'Шилдэг суралцагчийн тэтгэлэг',
        coverage: 'Сургалтын төлбөрийн 20-40%',
        requirements: 'ЭЕШ дундаж 75+',
        deadline: '2026-08-15',
      },
    ],
    dormitories: [
      {
        id: 'dorm_otgontenger',
        capacity: 200,
        feePerMonth: 170_000,
        facilities: ['Wi-Fi'],
      },
    ],
    admissionSchedules: [
      {
        id: 'adm_otgontenger_1',
        eventName: 'Элсэлтийн баримт бичиг хүлээн авах',
        startDate: '2026-06-10',
        endDate: '2026-08-01',
      },
    ],
  },
  {
    id: 'sch_suis',
    name: 'Монгол Улсын Соёл Урлагийн Их Сургууль',
    location: 'Сүхбаатар дүүрэг, Улаанбаатар',
    tuitionFee: 4_400_000,
    dormAvailable: true,
    scholarshipAvailable: true,
    overview:
      'Соёл Урлагийн Их Сургууль нь жүжигчин, хөгжим, дизайн, радио телевизийн чиглэлээр мэргэжилтэн бэлтгэдэг.',
    website: 'https://mnuac.edu.mn',
    majors: [
      {
        id: 'maj_suis_1',
        faculty: 'Жүжиг, кино урлагийн сургууль',
        name: 'Жүжигчин',
        category: 'Урлаг',
        requiredSubjects: ['Нийгмийн ухаан'],
        cutOffScore: 480,
        degreeType: 'BACHELOR',
        tuitionFee: 4_200_000,
      },
      {
        id: 'maj_suis_2',
        faculty: 'Дүрслэх урлаг, дизайны сургууль',
        name: 'Дизайн',
        category: 'Урлаг',
        requiredSubjects: ['Зураг зүй'],
        cutOffScore: 470,
        degreeType: 'BACHELOR',
        tuitionFee: 4_500_000,
      },
      {
        id: 'maj_suis_3',
        faculty: 'Жүжиг, кино урлагийн сургууль',
        name: 'Радио телевиз',
        category: 'Урлаг',
        requiredSubjects: ['Нийгмийн ухаан'],
        cutOffScore: 460,
        degreeType: 'BACHELOR',
        tuitionFee: 4_400_000,
      },
    ],
    scholarships: [
      {
        id: 'sp_suis_1',
        name: 'Урлагийн авьяаслаг сурагчийн тэтгэлэг',
        coverage: 'Сургалтын төлбөрийн 30-60%',
        requirements: 'Шалгалтын шилдэг оноо',
        deadline: '2026-08-01',
      },
    ],
    dormitories: [
      {
        id: 'dorm_suis',
        capacity: 250,
        feePerMonth: 180_000,
        facilities: ['Wi-Fi', 'Дадлагын танхим'],
      },
    ],
    admissionSchedules: [
      {
        id: 'adm_suis_1',
        eventName: 'Авьяасын шалгалт',
        startDate: '2026-06-15',
        endDate: '2026-07-01',
      },
    ],
  },
  {
    id: 'sch_huree',
    name: 'Хүрээ Мэдээлэл Холбоо Технологийн Дээд Сургууль',
    location: 'Хан-Уул дүүрэг, Улаанбаатар',
    tuitionFee: 4_700_000,
    dormAvailable: false,
    scholarshipAvailable: true,
    overview:
      'Хүрээ Их Сургууль нь мэдээллийн технологи, сүлжээ, гадаад хэлний чиглэлээр сургалт явуулдаг хувийн дээд сургууль.',
    website: 'https://huree.edu.mn',
    majors: [
      {
        id: 'maj_huree_1',
        faculty: 'Мэдээллийн технологийн сургууль',
        name: 'IT / Программчлал',
        category: 'Инженерчлэл',
        requiredSubjects: ['Математик'],
        cutOffScore: 500,
        degreeType: 'BACHELOR',
        tuitionFee: 4_800_000,
      },
      {
        id: 'maj_huree_2',
        faculty: 'Мэдээллийн технологийн сургууль',
        name: 'Сүлжээ',
        category: 'Инженерчлэл',
        requiredSubjects: ['Математик'],
        cutOffScore: 490,
        degreeType: 'BACHELOR',
        tuitionFee: 4_700_000,
      },
      {
        id: 'maj_huree_3',
        faculty: 'Гадаад хэлний сургууль',
        name: 'Солонгос хэл',
        category: 'Хүмүүнлэг',
        requiredSubjects: ['Англи хэл'],
        cutOffScore: 460,
        degreeType: 'BACHELOR',
        tuitionFee: 4_500_000,
      },
    ],
    scholarships: [
      {
        id: 'sp_huree_1',
        name: 'IT ирээдүй тэтгэлэг',
        coverage: 'Сургалтын төлбөрийн 25-50%',
        requirements: 'ЭЕШ математикийн оноо 85+',
        deadline: '2026-08-10',
      },
    ],
    dormitories: [
      {
        id: 'dorm_huree',
        capacity: 150,
        feePerMonth: 190_000,
        facilities: ['Wi-Fi', 'Компьютерийн лаборатори'],
      },
    ],
    admissionSchedules: [
      {
        id: 'adm_huree_1',
        eventName: 'Элсэлтийн баримт бичиг хүлээн авах',
        startDate: '2026-06-01',
        endDate: '2026-08-01',
      },
    ],
  },
  {
    id: 'sch_iuu',
    name: 'Олон Улсын Улаанбаатарын Их Сургууль',
    location: 'Сонгинохайрхан дүүрэг, Улаанбаатар',
    tuitionFee: 5_500_000,
    dormAvailable: true,
    scholarshipAvailable: true,
    overview:
      'Улаанбаатарын Олон Улсын Их Сургууль нь олон улсын хөтөлбөрүүдээр суралцах боломж олгодог хувийн их сургууль.',
    website: 'https://www.iuu.edu.mn',
    majors: [
      {
        id: 'maj_iuu_1',
        faculty: 'Бизнесийн сургууль',
        name: 'Олон улсын бизнес',
        category: 'Бизнес',
        requiredSubjects: ['Математик', 'Англи хэл'],
        cutOffScore: 540,
        degreeType: 'BACHELOR',
        tuitionFee: 5_600_000,
      },
      {
        id: 'maj_iuu_2',
        faculty: 'Хэл, соёлын сургууль',
        name: 'Англи хэлний багш',
        category: 'Хүмүүнлэг',
        requiredSubjects: ['Англи хэл'],
        cutOffScore: 500,
        degreeType: 'BACHELOR',
        tuitionFee: 5_200_000,
      },
    ],
    scholarships: [
      {
        id: 'sp_iuu_1',
        name: 'Олон улсын хөтөлбөрийн тэтгэлэг',
        coverage: 'Сургалтын төлбөрийн 20-40%',
        requirements: 'IELTS 5.5+',
        deadline: '2026-08-20',
      },
    ],
    dormitories: [
      {
        id: 'dorm_iuu',
        capacity: 400,
        feePerMonth: 200_000,
        facilities: ['Wi-Fi', 'Олон улсын оюутны байр'],
      },
    ],
    admissionSchedules: [
      {
        id: 'adm_iuu_1',
        eventName: 'Элсэлтийн баримт бичиг хүлээн авах',
        startDate: '2026-06-01',
        endDate: '2026-08-10',
      },
    ],
  },
  {
    id: 'sch_etugen',
    name: 'Этүгэн Их Сургууль',
    location: 'Баянгол дүүрэг, Улаанбаатар',
    tuitionFee: 3_900_000,
    dormAvailable: false,
    scholarshipAvailable: true,
    overview:
      'Этүгэн Их Сургууль нь хууль зүй, нийгмийн ажил, бизнесийн чиглэлээр сургалт явуулдаг хувийн их сургууль.',
    website: 'https://www.etugen.edu.mn',
    majors: [
      {
        id: 'maj_etugen_1',
        faculty: 'Хууль зүйн сургууль',
        name: 'Хууль зүй',
        category: 'Хууль зүй',
        requiredSubjects: ['Нийгмийн ухаан'],
        cutOffScore: 470,
        degreeType: 'BACHELOR',
        tuitionFee: 4_000_000,
      },
      {
        id: 'maj_etugen_2',
        faculty: 'Нийгмийн ухааны сургууль',
        name: 'Нийгмийн ажил',
        category: 'Хүмүүнлэг',
        requiredSubjects: ['Нийгмийн ухаан'],
        cutOffScore: 450,
        degreeType: 'BACHELOR',
        tuitionFee: 3_800_000,
      },
    ],
    scholarships: [
      {
        id: 'sp_etugen_1',
        name: 'Этүгэн тэтгэлэг',
        coverage: 'Сургалтын төлбөрийн 20-30%',
        requirements: 'ЭЕШ дундаж 70+',
        deadline: '2026-08-15',
      },
    ],
    dormitories: [
      {
        id: 'dorm_etugen',
        capacity: 180,
        feePerMonth: 160_000,
        facilities: ['Wi-Fi'],
      },
    ],
    admissionSchedules: [
      {
        id: 'adm_etugen_1',
        eventName: 'Элсэлтийн баримт бичиг хүлээн авах',
        startDate: '2026-06-01',
        endDate: '2026-08-05',
      },
    ],
  },
];

/** The distinct `faculty` names among a school's seeded majors, in first-seen order. */
function facultyNames(entry: SchoolSeed): string[] {
  return [...new Set(entry.majors.map((major) => major.faculty))];
}

function seedFacultyId(entry: SchoolSeed, facultyName: string): string {
  return `fac_${entry.id.replace(/^sch_/, '')}_${facultyNames(entry).indexOf(facultyName) + 1}`;
}

function seedFaculties(entry: SchoolSeed) {
  return facultyNames(entry).map((name) => ({
    id: seedFacultyId(entry, name),
    schoolId: entry.id,
    name,
  }));
}

export interface SeedSummary {
  schools: number;
  faculties: number;
  majors: number;
  scholarships: number;
  dormitories: number;
  admissionSchedules: number;
}

/** Thrown instead of seeding a database that holds anything besides the demo data. */
export class SeedRefusedError extends Error {}

/**
 * Seeding starts by deleting every school, so it must only ever touch a
 * database that contains nothing but this demo data -- a fresh local D1, or
 * one seeded before. Any real university, program, scholarship, dorm or date
 * (as on main) makes it refuse, whichever route or binding reached it.
 */
async function assertOnlySeedData(db: Database): Promise<void> {
  const seedIds = <T>(pick: (entry: SchoolSeed) => T[]) => SEED_SCHOOLS.flatMap(pick);
  const ids = (rows: { id: string }[]) => rows.map((row) => row.id);
  const [foreignSchools, foreignMajors, foreignScholarships, foreignDorms, foreignSchedules] =
    await db.batch([
      db.select({ id: schools.id }).from(schools)
        .where(notInArray(schools.id, SEED_SCHOOLS.map((entry) => entry.id))).limit(1),
      db.select({ id: majors.id }).from(majors)
        .where(notInArray(majors.id, ids(seedIds((entry) => entry.majors)))).limit(1),
      db.select({ id: scholarships.id }).from(scholarships)
        .where(notInArray(scholarships.id, ids(seedIds((entry) => entry.scholarships)))).limit(1),
      db.select({ id: dormitories.id }).from(dormitories)
        .where(notInArray(dormitories.id, ids(seedIds((entry) => entry.dormitories)))).limit(1),
      db.select({ id: admissionSchedules.id }).from(admissionSchedules)
        .where(notInArray(admissionSchedules.id, ids(seedIds((entry) => entry.admissionSchedules))))
        .limit(1),
    ]);
  if (
    [foreignSchools, foreignMajors, foreignScholarships, foreignDorms, foreignSchedules].some(
      (rows) => rows.length > 0
    )
  ) {
    throw new SeedRefusedError(
      'This database contains data that is not part of the demo seed; seeding would delete it.'
    );
  }
}

/**
 * Wipes and re-inserts the demo dataset above. Idempotent and safe to
 * re-run: fixed ids mean repeated runs produce identical data rather than
 * duplicates. Deleting `schools` cascades (via each table's `onDelete:
 * 'cascade'` foreign key) through faculties, majors, scholarships, dormitories,
 * admission schedules, and any saved-school/saved-major bookmarks pointing
 * at them -- so this intentionally clears bookmarks on seeded schools too.
 * Dev/demo convenience only: the `/dev/seed` route in src/index.ts only
 * answers localhost outside production, and this refuses any database with
 * non-demo data (see `assertOnlySeedData`), so it can never run against main.
 */
export async function seedDatabase(db: Database): Promise<SeedSummary> {
  await assertOnlySeedData(db);

  const inserts = SEED_SCHOOLS.flatMap((entry) => [
    db.insert(schools).values({
      id: entry.id,
      name: entry.name,
      location: entry.location,
      tuitionFee: entry.tuitionFee,
      dormAvailable: entry.dormAvailable,
      scholarshipAvailable: entry.scholarshipAvailable,
      overview: entry.overview,
      website: entry.website,
    }),
    ...(entry.majors.length > 0
      ? [
          db.insert(faculties).values(seedFaculties(entry)),
          db.insert(majors).values(
            entry.majors.map((major) => ({
              id: major.id,
              schoolId: entry.id,
              facultyId: seedFacultyId(entry, major.faculty),
              name: major.name,
              category: major.category,
              requiredSubjects: major.requiredSubjects,
              cutOffScore: major.cutOffScore,
              degreeType: major.degreeType,
              tuitionFee: major.tuitionFee,
            })),
          ),
        ]
      : []),
    ...(entry.scholarships.length > 0
      ? [
          db.insert(scholarships).values(
            entry.scholarships.map((scholarship) => ({
              id: scholarship.id,
              schoolId: entry.id,
              name: scholarship.name,
              coverage: scholarship.coverage,
              requirements: scholarship.requirements,
              deadline: scholarship.deadline,
            })),
          ),
        ]
      : []),
    ...(entry.dormitories.length > 0
      ? [
          db.insert(dormitories).values(
            entry.dormitories.map((dormitory) => ({
              id: dormitory.id,
              schoolId: entry.id,
              capacity: dormitory.capacity,
              feePerMonth: dormitory.feePerMonth,
              facilities: dormitory.facilities,
            })),
          ),
        ]
      : []),
    ...(entry.admissionSchedules.length > 0
      ? [
          db.insert(admissionSchedules).values(
            entry.admissionSchedules.map((schedule) => ({
              id: schedule.id,
              schoolId: entry.id,
              eventName: schedule.eventName,
              startDate: schedule.startDate,
              endDate: schedule.endDate,
            })),
          ),
        ]
      : []),
  ]);

  await db.batch([db.delete(schools), ...inserts]);

  return {
    schools: SEED_SCHOOLS.length,
    faculties: SEED_SCHOOLS.reduce((sum, entry) => sum + seedFaculties(entry).length, 0),
    majors: SEED_SCHOOLS.reduce((sum, entry) => sum + entry.majors.length, 0),
    scholarships: SEED_SCHOOLS.reduce(
      (sum, entry) => sum + entry.scholarships.length,
      0,
    ),
    dormitories: SEED_SCHOOLS.reduce(
      (sum, entry) => sum + entry.dormitories.length,
      0,
    ),
    admissionSchedules: SEED_SCHOOLS.reduce(
      (sum, entry) => sum + entry.admissionSchedules.length,
      0,
    ),
  };
}
