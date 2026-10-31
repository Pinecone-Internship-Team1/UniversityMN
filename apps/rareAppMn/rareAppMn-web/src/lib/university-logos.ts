export interface University {
  /** Route slug, e.g. "muis" in /university/muis. */
  id: string;
  /** The backend School id; logos and slugs are looked up by this, never by name. */
  schoolId: string;
  short: string;
  full: string;
  founded: string;
  image: string;
}

export const UNIVERSITIES: Record<string, University> = {
  muis: {
    id: "muis",
    schoolId: "sch_muis",
    short: "МУИС",
    full: "Монгол Улсын Их Сургууль",
    founded: "1942",
    image: "/logos/muis.png",
  },
  shutis: {
    id: "shutis",
    schoolId: "sch_shutis",
    short: "ШУТИС",
    full: "Шинжлэх Ухаан Технологийн Их Сургууль",
    founded: "1969",
    image: "/logos/shutis.png",
  },
  sezis: {
    id: "sezis",
    schoolId: "sch_sezis",
    short: "СЭЗИС",
    full: "Санхүү Эдийн Засгийн Их Сургууль",
    founded: "1963",
    image: "/logos/sezis.png",
  },
  ashuuis: {
    id: "ashuuis",
    schoolId: "sch_ashuuis",
    short: "АШУҮИС",
    full: "Анагаахын Шинжлэх Ухааны Үндэсний Их Сургууль",
    founded: "1942",
    image: "/logos/ashuuis.png",
  },
  khaais: {
    id: "khaais",
    schoolId: "sch_khaais",
    short: "ХААИС",
    full: "Хөдөө Аж Ахуйн Их Сургууль",
    founded: "1958",
    image: "/logos/khaais.png",
  },
  mubis: {
    id: "mubis",
    schoolId: "sch_mubis",
    short: "МУБИС",
    full: "Монгол Улсын Боловсролын Их Сургууль",
    founded: "1951",
    image: "/logos/mubis.png",
  },
  otgontenger: {
    id: "otgontenger",
    schoolId: "sch_otgontenger",
    short: "Отгонтэнгэр",
    full: "Отгонтэнгэр Их Сургууль",
    founded: "1994",
    image: "/logos/otgontenger.png",
  },
  suis: {
    id: "suis",
    schoolId: "sch_suis",
    short: "СУИС",
    full: "Монгол Улсын Соёл Урлагийн Их Сургууль",
    founded: "1990",
    image: "/logos/suis.png",
  },
  huree: {
    id: "huree",
    schoolId: "sch_huree",
    short: "Хүрээ",
    full: "Хүрээ Мэдээлэл Холбоо Технологийн Дээд Сургууль",
    founded: "1993",
    image: "/logos/huree.png",
  },
  iuu: {
    id: "iuu",
    schoolId: "sch_iuu",
    short: "ОУУБИС",
    full: "Олон Улсын Улаанбаатарын Их Сургууль",
    founded: "1995",
    image: "/logos/iuu.png",
  },
  etugen: {
    id: "etugen",
    schoolId: "sch_etugen",
    short: "Этүгэн",
    full: "Этүгэн Их Сургууль",
    founded: "1994",
    image: "/logos/etugen.png",
  },
};

const UNIVERSITIES_BY_SCHOOL_ID: Record<string, University> = Object.fromEntries(
  Object.values(UNIVERSITIES).map((university) => [university.schoolId, university]),
);

/**
 * The static entry (logo, short name, slug) for a backend school, by its id
 * so renaming a university can't break the match. Schools outside this
 * static set get no match (the call site falls back to an initials avatar).
 */
export function getUniversityBySchoolId(schoolId: string): University | undefined {
  return UNIVERSITIES_BY_SCHOOL_ID[schoolId];
}

/** The route slug (e.g. `"muis"`) for a known school, used to build `/university/[slug]` links. */
export function getUniversitySlug(schoolId: string): string | undefined {
  return UNIVERSITIES_BY_SCHOOL_ID[schoolId]?.id;
}
