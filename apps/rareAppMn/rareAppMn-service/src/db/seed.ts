import type { Database } from './index';
import {
  admissionSchedules,
  dormitories,
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
        name: 'Компьютерийн ухаан',
        category: 'Байгалийн ухаан',
        requiredSubjects: ['Математик', 'Физик'],
        cutOffScore: 580,
        degreeType: 'BACHELOR',
        tuitionFee: 4_800_000,
      },
      {
        id: 'maj_muis_2',
        name: 'Олон улсын харилцаа',
        category: 'Хүмүүнлэг',
        requiredSubjects: ['Математик', 'Англи хэл'],
        cutOffScore: 560,
        degreeType: 'BACHELOR',
        tuitionFee: 4_300_000,
      },
      {
        id: 'maj_muis_3',
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
        name: 'Программ хангамж',
        category: 'Инженерчлэл',
        requiredSubjects: ['Математик', 'Физик'],
        cutOffScore: 550,
        degreeType: 'BACHELOR',
        tuitionFee: 4_200_000,
      },
      {
        id: 'maj_shutis_2',
        name: 'Сүлжээний инженер',
        category: 'Инженерчлэл',
        requiredSubjects: ['Математик', 'Физик'],
        cutOffScore: 530,
        degreeType: 'BACHELOR',
        tuitionFee: 4_200_000,
      },
      {
        id: 'maj_shutis_3',
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
    website: 'https://www.ufe.edu.mn',
    majors: [
      {
        id: 'maj_sezis_1',
        name: 'Санхүү ба банк',
        category: 'Бизнес',
        requiredSubjects: ['Математик'],
        cutOffScore: 600,
        degreeType: 'BACHELOR',
        tuitionFee: 8_200_000,
      },
      {
        id: 'maj_sezis_2',
        name: 'Нягтлан бодох бүртгэл',
        category: 'Бизнес',
        requiredSubjects: ['Математик'],
        cutOffScore: 580,
        degreeType: 'BACHELOR',
        tuitionFee: 7_800_000,
      },
      {
        id: 'maj_sezis_3',
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
        name: 'Хүний эмч',
        category: 'Эрүүл мэнд',
        requiredSubjects: ['Хими', 'Биологи'],
        cutOffScore: 620,
        degreeType: 'BACHELOR',
        tuitionFee: 6_500_000,
      },
      {
        id: 'maj_ashuuis_2',
        name: 'Эм зүй',
        category: 'Эрүүл мэнд',
        requiredSubjects: ['Хими', 'Биологи'],
        cutOffScore: 590,
        degreeType: 'BACHELOR',
        tuitionFee: 5_200_000,
      },
      {
        id: 'maj_ashuuis_3',
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
        name: 'Мал эмнэлэг',
        category: 'Хөдөө аж ахуй',
        requiredSubjects: ['Биологи', 'Хими'],
        cutOffScore: 480,
        degreeType: 'BACHELOR',
        tuitionFee: 3_600_000,
      },
      {
        id: 'maj_khaais_2',
        name: 'Агрономи',
        category: 'Хөдөө аж ахуй',
        requiredSubjects: ['Биологи'],
        cutOffScore: 460,
        degreeType: 'BACHELOR',
        tuitionFee: 3_400_000,
      },
      {
        id: 'maj_khaais_3',
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
        name: 'Боловсрол судлал',
        category: 'Боловсрол',
        requiredSubjects: ['Нийгмийн ухаан'],
        cutOffScore: 500,
        degreeType: 'BACHELOR',
        tuitionFee: 3_700_000,
      },
      {
        id: 'maj_mubis_2',
        name: 'Багш (Эхлэх анги)',
        category: 'Боловсрол',
        requiredSubjects: ['Нийгмийн ухаан'],
        cutOffScore: 480,
        degreeType: 'BACHELOR',
        tuitionFee: 3_500_000,
      },
      {
        id: 'maj_mubis_3',
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
        name: 'Хууль зүй',
        category: 'Хууль зүй',
        requiredSubjects: ['Нийгмийн ухаан'],
        cutOffScore: 480,
        degreeType: 'BACHELOR',
        tuitionFee: 4_100_000,
      },
      {
        id: 'maj_otgontenger_2',
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
    name: 'Соёл Урлагийн Их Сургууль',
    location: 'Сүхбаатар дүүрэг, Улаанбаатар',
    tuitionFee: 4_400_000,
    dormAvailable: true,
    scholarshipAvailable: true,
    overview:
      'Соёл Урлагийн Их Сургууль нь жүжигчин, хөгжим, дизайн, радио телевизийн чиглэлээр мэргэжилтэн бэлтгэдэг.',
    website: 'https://www.suis.edu.mn',
    majors: [
      {
        id: 'maj_suis_1',
        name: 'Жүжигчин',
        category: 'Урлаг',
        requiredSubjects: ['Нийгмийн ухаан'],
        cutOffScore: 480,
        degreeType: 'BACHELOR',
        tuitionFee: 4_200_000,
      },
      {
        id: 'maj_suis_2',
        name: 'Дизайн',
        category: 'Урлаг',
        requiredSubjects: ['Зураг зүй'],
        cutOffScore: 470,
        degreeType: 'BACHELOR',
        tuitionFee: 4_500_000,
      },
      {
        id: 'maj_suis_3',
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
    name: 'Хүрээ Их Сургууль',
    location: 'Хан-Уул дүүрэг, Улаанбаатар',
    tuitionFee: 4_700_000,
    dormAvailable: false,
    scholarshipAvailable: true,
    overview:
      'Хүрээ Их Сургууль нь мэдээллийн технологи, сүлжээ, гадаад хэлний чиглэлээр сургалт явуулдаг хувийн дээд сургууль.',
    website: 'https://www.huree.edu.mn',
    majors: [
      {
        id: 'maj_huree_1',
        name: 'IT / Программчлал',
        category: 'Инженерчлэл',
        requiredSubjects: ['Математик'],
        cutOffScore: 500,
        degreeType: 'BACHELOR',
        tuitionFee: 4_800_000,
      },
      {
        id: 'maj_huree_2',
        name: 'Сүлжээ',
        category: 'Инженерчлэл',
        requiredSubjects: ['Математик'],
        cutOffScore: 490,
        degreeType: 'BACHELOR',
        tuitionFee: 4_700_000,
      },
      {
        id: 'maj_huree_3',
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
    name: 'Улаанбаатарын Олон Улсын Их Сургууль',
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
        name: 'Олон улсын бизнес',
        category: 'Бизнес',
        requiredSubjects: ['Математик', 'Англи хэл'],
        cutOffScore: 540,
        degreeType: 'BACHELOR',
        tuitionFee: 5_600_000,
      },
      {
        id: 'maj_iuu_2',
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
        name: 'Хууль зүй',
        category: 'Хууль зүй',
        requiredSubjects: ['Нийгмийн ухаан'],
        cutOffScore: 470,
        degreeType: 'BACHELOR',
        tuitionFee: 4_000_000,
      },
      {
        id: 'maj_etugen_2',
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

export interface SeedSummary {
  schools: number;
  majors: number;
  scholarships: number;
  dormitories: number;
  admissionSchedules: number;
}

/**
 * Wipes and re-inserts the demo dataset above. Idempotent and safe to
 * re-run: fixed ids mean repeated runs produce identical data rather than
 * duplicates. Deleting `schools` cascades (via each table's `onDelete:
 * 'cascade'` foreign key) through majors, scholarships, dormitories,
 * admission schedules, and any saved-school/saved-major bookmarks pointing
 * at them -- so this intentionally clears bookmarks on seeded schools too.
 * Dev/demo convenience only; never exposed in production (see the
 * `/dev/seed` route in src/index.ts, gated by `isDevelopment(env)`).
 */
export async function seedDatabase(db: Database): Promise<SeedSummary> {
  await db.delete(schools);

  for (const entry of SEED_SCHOOLS) {
    await db.insert(schools).values({
      id: entry.id,
      name: entry.name,
      location: entry.location,
      tuitionFee: entry.tuitionFee,
      dormAvailable: entry.dormAvailable,
      scholarshipAvailable: entry.scholarshipAvailable,
      overview: entry.overview,
      website: entry.website,
    });

    if (entry.majors.length > 0) {
      await db.insert(majors).values(
        entry.majors.map((major) => ({
          id: major.id,
          schoolId: entry.id,
          name: major.name,
          category: major.category,
          requiredSubjects: major.requiredSubjects,
          cutOffScore: major.cutOffScore,
          degreeType: major.degreeType,
          tuitionFee: major.tuitionFee,
        })),
      );
    }

    if (entry.scholarships.length > 0) {
      await db.insert(scholarships).values(
        entry.scholarships.map((scholarship) => ({
          id: scholarship.id,
          schoolId: entry.id,
          name: scholarship.name,
          coverage: scholarship.coverage,
          requirements: scholarship.requirements,
          deadline: scholarship.deadline,
        })),
      );
    }

    if (entry.dormitories.length > 0) {
      await db.insert(dormitories).values(
        entry.dormitories.map((dormitory) => ({
          id: dormitory.id,
          schoolId: entry.id,
          capacity: dormitory.capacity,
          feePerMonth: dormitory.feePerMonth,
          facilities: dormitory.facilities,
        })),
      );
    }

    if (entry.admissionSchedules.length > 0) {
      await db.insert(admissionSchedules).values(
        entry.admissionSchedules.map((schedule) => ({
          id: schedule.id,
          schoolId: entry.id,
          eventName: schedule.eventName,
          startDate: schedule.startDate,
          endDate: schedule.endDate,
        })),
      );
    }
  }

  return {
    schools: SEED_SCHOOLS.length,
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
