export interface University {
  id: string;
  short: string;
  full: string;
  founded: string;
  image: string;
}

export const UNIVERSITIES: Record<string, University> = {
  muis: {
    id: "muis",
    short: "МУИС",
    full: "Монгол Улсын Их Сургууль",
    founded: "1942",
    image: "/logos/muis.png",
  },
  shutis: {
    id: "shutis",
    short: "ШУТИС",
    full: "Шинжлэх Ухаан Технологийн Их Сургууль",
    founded: "1969",
    image: "/logos/shutis.png",
  },
  sezis: {
    id: "sezis",
    short: "СЭЗИС",
    full: "Санхүү Эдийн Засгийн Их Сургууль",
    founded: "1963",
    image: "/logos/sezis.png",
  },
  ashuuis: {
    id: "ashuuis",
    short: "АШУҮИС",
    full: "Анагаахын Шинжлэх Ухааны Үндэсний Их Сургууль",
    founded: "1942",
    image: "/logos/ashuuis.png",
  },
  khaais: {
    id: "khaais",
    short: "ХААИС",
    full: "Хөдөө Аж Ахуйн Их Сургууль",
    founded: "1958",
    image: "/logos/khaais.png",
  },
  mubis: {
    id: "mubis",
    short: "МУБИС",
    full: "Монгол Улсын Боловсролын Их Сургууль",
    founded: "1951",
    image: "/logos/mubis.png",
  },
  otgontenger: {
    id: "otgontenger",
    short: "Отгонтэнгэр",
    full: "Отгонтэнгэр Их Сургууль",
    founded: "1994",
    image: "/logos/otgontenger.png",
  },
  suis: {
    id: "suis",
    short: "СУИС",
    full: "Соёл Урлагийн Их Сургууль",
    founded: "1990",
    image: "/logos/suis.png",
  },
  huree: {
    id: "huree",
    short: "Хүрээ",
    full: "Хүрээ Их Сургууль",
    founded: "1993",
    image: "/logos/huree.png",
  },
  iuu: {
    id: "iuu",
    short: "УБОУИС",
    full: "Улаанбаатарын Олон Улсын Их Сургууль",
    founded: "1995",
    image: "/logos/iuu.png",
  },
  etugen: {
    id: "etugen",
    short: "Этүгэн",
    full: "Этүгэн Их Сургууль",
    founded: "1994",
    image: "/logos/etugen.png",
  },
};

export interface LogoPlacement {
  id: string;
  x: number;
  y: number;
  rotate: number;
  order: number;
}

export const DESKTOP_LAYOUT: LogoPlacement[] = [
  { id: "muis", x: 8, y: 20, rotate: -11, order: 0 },
  { id: "shutis", x: 24.5, y: 10, rotate: 6, order: 3 },
  { id: "sezis", x: 49, y: 13, rotate: -5, order: 6 },
  { id: "ashuuis", x: 73, y: 11, rotate: 9, order: 1 },
  { id: "iuu", x: 93.5, y: 24, rotate: -8, order: 5 },
  { id: "khaais", x: 4.5, y: 47, rotate: 5, order: 8 },
  { id: "mubis", x: 95.5, y: 52, rotate: -13, order: 2 },
  { id: "etugen", x: 11, y: 77, rotate: 8, order: 7 },
  { id: "otgontenger", x: 29, y: 91, rotate: -7, order: 4 },
  { id: "suis", x: 58, y: 91.5, rotate: 11, order: 10 },
  { id: "huree", x: 82.5, y: 81, rotate: -10, order: 9 },
];

export const TABLET_LAYOUT: LogoPlacement[] = [
  { id: "muis", x: 10, y: 9, rotate: -10, order: 0 },
  { id: "shutis", x: 50, y: 9.5, rotate: 6, order: 4 },
  { id: "sezis", x: 89, y: 15, rotate: -8, order: 2 },
  { id: "ashuuis", x: 6, y: 48, rotate: 9, order: 5 },
  { id: "khaais", x: 94, y: 46, rotate: -12, order: 1 },
  { id: "mubis", x: 17, y: 90, rotate: 8, order: 6 },
  { id: "huree", x: 50, y: 92, rotate: -6, order: 3 },
  { id: "suis", x: 85, y: 83, rotate: 11, order: 7 },
];

export const MOBILE_LAYOUT: LogoPlacement[] = [
  { id: "muis", x: 16, y: 9, rotate: -9, order: 0 },
  { id: "shutis", x: 83, y: 11, rotate: 7, order: 1 },
  { id: "khaais", x: 11, y: 90, rotate: 8, order: 3 },
  { id: "suis", x: 85, y: 92, rotate: -9, order: 4 },
  { id: "sezis", x: 50, y: 13, rotate: -4, order: 2 },
];

export const CURSOR_TRAIL_SEQUENCE = [
  "muis",
  "shutis",
  "sezis",
  "ashuuis",
  "khaais",
  "mubis",
  "otgontenger",
  "suis",
  "huree",
  "iuu",
  "etugen",
] as const;

export function getCursorTrailUniversities(): University[] {
  return CURSOR_TRAIL_SEQUENCE.map((id) => UNIVERSITIES[id]);
}
