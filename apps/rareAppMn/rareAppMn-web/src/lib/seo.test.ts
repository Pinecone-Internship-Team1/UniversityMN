import { describe, expect, test } from "bun:test";
import {
  MAX_DESCRIPTION_LENGTH,
  MAX_TITLE_LENGTH,
  PAGE_SEO,
  type SchoolSeoInput,
  formatCutOffRange,
  formatTuitionRange,
  previewMajors,
  schoolDescription,
  schoolJsonLd,
  schoolLatinName,
  schoolPath,
  schoolShortName,
  schoolTitle,
  shortOverview,
  siteJsonLd,
} from "./seo";

/** `count` bachelor majors whose cut-offs and fees run from the first value to the second. */
function majors(
  count: number,
  cutOffs: [number, number],
  fees: [number, number] | null,
): SchoolSeoInput["majors"] {
  return Array.from({ length: count }, (_, index) => {
    const share = count > 1 ? index / (count - 1) : 0;
    return {
      cutOffScore: Math.round(cutOffs[0] + (cutOffs[1] - cutOffs[0]) * share),
      tuitionFee: fees ? Math.round(fees[0] + (fees[1] - fees[0]) * share) : null,
      degreeType: "BACHELOR",
    };
  });
}

function school(overrides: Partial<SchoolSeoInput> & Pick<SchoolSeoInput, "id" | "name">): SchoolSeoInput {
  return {
    aliases: [],
    location: null,
    logoUrl: null,
    overview: null,
    website: null,
    tuitionFee: null,
    majors: [],
    ...overrides,
  };
}

/** The live schools (2026-10-21): names, aliases and the range of their majors' numbers. */
const LIVE_SCHOOLS: SchoolSeoInput[] = [
  school({
    id: "sch_muis",
    name: "Монгол Улсын Их Сургууль",
    aliases: ["МУИС", "muis", "NUM", "National University of Mongolia"],
    location: "Улаанбаатар, Сүхбаатар дүүрэг, Их сургуулийн гудамж-1",
    tuitionFee: 6_111_000,
    majors: majors(330, [430, 490], [6_162_000, 8_547_000]),
  }),
  school({
    id: "sch_shutis",
    name: "Шинжлэх Ухаан Технологийн Их Сургууль",
    aliases: ["ШУТИС", "shutis", "MUST", "Mongolian University of Science and Technology"],
    majors: majors(189, [430, 550], [6_479_000, 7_733_000]),
  }),
  school({
    id: "sch_sezis",
    name: "Санхүү Эдийн Засгийн Их Сургууль",
    aliases: ["СЭЗИС", "sezis", "UFE", "University of Finance and Economics"],
    majors: majors(58, [440, 620], [4_578_552, 28_000_000]),
  }),
  school({
    id: "sch_ashuuis",
    name: "Анагаахын Шинжлэх Ухааны Үндэсний Их Сургууль",
    aliases: ["АШУҮИС", "ashuuis", "MNUMS", "Mongolian National University of Medical Sciences"],
    majors: majors(78, [410, 490], [3_520_000, 7_072_000]),
  }),
  school({
    id: "sch_khaais",
    name: "Хөдөө Аж Ахуйн Их Сургууль",
    aliases: ["ХААИС", "haais", "khaais", "MULS", "Mongolian University of Life Sciences"],
    majors: majors(62, [440, 490], [5_070_000, 5_070_000]),
  }),
  school({
    id: "sch_mubis",
    name: "Монгол Улсын Боловсролын Их Сургууль",
    aliases: ["МУБИС", "mubis", "MNUE", "MSUE", "Mongolian National University of Education"],
    majors: majors(63, [430, 490], null),
  }),
  school({
    id: "sch_otgontenger",
    name: "Отгонтэнгэр Их Сургууль",
    aliases: ["Отгонтэнгэр", "ОТИС", "otgontenger", "Otgontenger University"],
    majors: majors(19, [440, 490], null),
  }),
  school({
    id: "sch_suis",
    name: "Монгол Улсын Соёл Урлагийн Их Сургууль",
    aliases: ["СУИС", "suis", "MNUAC", "MSUAC", "Mongolian National University of Arts and Culture"],
    majors: majors(35, [450, 490], null),
  }),
  school({
    id: "sch_huree",
    name: "Хүрээ Мэдээлэл Холбоо Технологийн Дээд Сургууль",
    aliases: ["Хүрээ", "huree", "Huree University of ICT"],
    majors: majors(10, [450, 490], null),
  }),
  school({
    id: "sch_iuu",
    name: "Олон Улсын Улаанбаатарын Их Сургууль",
    aliases: ["ОУУБИС", "ouubis", "IUU", "International University of Ulaanbaatar"],
    majors: majors(29, [430, 490], null),
  }),
  school({
    id: "sch_etugen",
    name: "Этүгэн Их Сургууль",
    aliases: ["Этүгэн", "etugen", "Etugen University"],
    majors: majors(29, [410, 490], null),
  }),
];

function liveSchool(id: string): SchoolSeoInput {
  const found = LIVE_SCHOOLS.find((live) => live.id === id);
  if (!found) throw new Error(`no live school ${id}`);
  return found;
}

describe("fixed pages", () => {
  test("titles carry our name in both alphabets and stay short", () => {
    for (const [key, page] of Object.entries(PAGE_SEO)) {
      expect(page.title).toContain("Oyutan MN");
      expect(page.title).toContain("Оюутан MN");
      expect(page.title.length).toBeLessThanOrEqual(MAX_TITLE_LENGTH);
      expect(page.description.length).toBeLessThanOrEqual(MAX_DESCRIPTION_LENGTH);
    }
  });

  test("the home title is the one asked for", () => {
    expect(PAGE_SEO.home.title).toBe("Oyutan MN (Оюутан MN) — их сургуулийн босго оноо, тэтгэлэг");
  });
});

describe("school pages", () => {
  test("title: short name in Cyrillic, then in Latin letters", () => {
    expect(schoolTitle(LIVE_SCHOOLS[0])).toBe("МУИС (muis) — босго оноо, мэргэжил, төлбөр | Oyutan MN");
  });

  test("every live school's title and description fit", () => {
    for (const live of LIVE_SCHOOLS) {
      const title = schoolTitle(live);
      const description = schoolDescription(live);
      expect(title.length).toBeLessThanOrEqual(MAX_TITLE_LENGTH);
      expect(title).toContain(schoolShortName(live));
      expect(title).toContain(schoolLatinName(live) ?? "");
      expect(description.length).toBeLessThanOrEqual(MAX_DESCRIPTION_LENGTH);
      expect(description).toContain(`${live.majors.length} мэргэжил`);
      expect(description).toContain(formatCutOffRange(live) ?? "");
    }
  });

  test("a long short name drops words from the title, not the names", () => {
    expect(schoolTitle(liveSchool("sch_otgontenger"))).toBe("Отгонтэнгэр (otgontenger) — босго оноо, төлбөр | Oyutan MN");
  });

  test("description from the real numbers", () => {
    expect(schoolDescription(LIVE_SCHOOLS[0])).toBe(
      "Монгол Улсын Их Сургууль (МУИС, muis): 330 мэргэжил, ЭЕШ босго оноо 430–490, төлбөр 6.2–8.5 сая ₮/жил. Тэтгэлэг, дотуур байр, элсэлт.",
    );
    expect(schoolDescription(liveSchool("sch_etugen"))).toBe(
      "Этүгэн Их Сургууль (etugen): 29 мэргэжил, ЭЕШ босго оноо 410–490. Тэтгэлэг, дотуур байр, элсэлт.",
    );
  });

  test("the Latin name is the first lowercase Latin alias, else the slug", () => {
    expect(schoolLatinName({ id: "sch_iuu", aliases: ["ОУУБИС", "ouubis", "IUU"] })).toBe("ouubis");
    expect(schoolLatinName({ id: "sch_new", aliases: ["ДТДС", "DTDS", "dtds"] })).toBe("dtds");
    expect(schoolLatinName({ id: "sch_muis", aliases: [] })).toBe("muis");
    expect(schoolLatinName({ id: "sch_new", aliases: ["NEW"] })).toBeNull();
    expect(schoolShortName({ id: "sch_new", name: "Дарханы Технологийн Дээд Сургууль", aliases: ["DTDS", "ДТДС"] })).toBe(
      "ДТДС",
    );
    expect(schoolPath("sch_muis")).toBe("/university/muis");
    expect(schoolPath("sch_new")).toBe("/university/sch_new");
  });
});

describe("ranges", () => {
  test("cut-offs skip unknown (null or 0) scores", () => {
    const input = {
      majors: [
        { cutOffScore: 0, tuitionFee: null, degreeType: null },
        { cutOffScore: null, tuitionFee: null, degreeType: null },
        { cutOffScore: 450, tuitionFee: null, degreeType: null },
        { cutOffScore: 520, tuitionFee: null, degreeType: null },
      ],
    };
    expect(formatCutOffRange(input)).toBe("450–520");
    expect(formatCutOffRange({ majors: input.majors.slice(0, 3) })).toBe("450");
    expect(formatCutOffRange({ majors: [] })).toBeNull();
  });

  test("tuition from the majors, else the school's own fee", () => {
    expect(formatTuitionRange({ tuitionFee: null, majors: majors(3, [400, 400], [4_520_000, 7_080_000]) })).toBe(
      "4.5–7.1 сая ₮",
    );
    expect(formatTuitionRange({ tuitionFee: 9_300_000, majors: [] })).toBe("≈ 9.3 сая ₮");
    expect(formatTuitionRange({ tuitionFee: null, majors: [] })).toBeNull();
  });

  test("the preview takes bachelor programs, one per faculty in turn, each name once", () => {
    const major = (id: string, name: string, facultyId: string | null, degreeType = "BACHELOR") => ({
      id,
      name,
      facultyId,
      degreeType,
    });
    const list = [
      major("branch-1", "Аялал жуулчлал", "branch"),
      major("branch-1b", "Аялал жуулчлал", "branch"),
      major("branch-2", "Багш", "branch"),
      major("law-1", "Хууль", "law"),
      major("law-2", "Эрх зүй", "law"),
      major("biz-1", "Менежмент", "business"),
      major("biz-m", "Менежмент (магистр)", "business", "MASTER"),
      major("none", "Бусад", null),
    ];
    const ids = (count: number) =>
      previewMajors(list, ["business", "law", "branch"], count).map((picked) => picked.id);
    expect(ids(4)).toEqual(["biz-1", "law-1", "branch-1", "none"]);
    expect(ids(10)).toEqual(["biz-1", "law-1", "branch-1", "none", "law-2", "branch-2"]);
    expect(previewMajors([list[6]], [], 6).map((picked) => picked.id)).toEqual(["biz-m"]);
  });
});

describe("shortOverview", () => {
  test("cut at a sentence end", () => {
    const overview = `${"Нэг өгүүлбэр. ".repeat(30)}`;
    const short = shortOverview(overview, 100) ?? "";
    expect(short.length).toBeGreaterThan(0);
    expect(short.length).toBeLessThanOrEqual(100);
    expect(short.endsWith(".")).toBe(true);
    expect(shortOverview("Богино.")).toBe("Богино.");
    expect(shortOverview(null)).toBeNull();
  });
});

describe("JSON-LD", () => {
  test("CollegeOrUniversity with its aliases and address", () => {
    const data = schoolJsonLd({
      ...LIVE_SCHOOLS[0],
      website: "https://www.num.edu.mn",
      overview: "Монгол Улсын анхны их сургууль.",
    });
    expect(data).toMatchObject({
      "@context": "https://schema.org",
      "@type": "CollegeOrUniversity",
      name: "Монгол Улсын Их Сургууль",
      alternateName: ["МУИС", "muis", "NUM", "National University of Mongolia"],
      url: "https://www.num.edu.mn",
      mainEntityOfPage: "https://oyutanmn.site/university/muis",
      logo: "https://oyutanmn.site/logos/muis.png",
      foundingDate: "1942",
      description: "Монгол Улсын анхны их сургууль.",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Улаанбаатар, Сүхбаатар дүүрэг, Их сургуулийн гудамж-1",
        addressLocality: "Улаанбаатар",
        addressCountry: "MN",
      },
    });
  });

  test("WebSite and Organization with our names", () => {
    const graph = siteJsonLd()["@graph"] as Record<string, unknown>[];
    expect(graph.map((node) => node["@type"])).toEqual(["WebSite", "Organization"]);
    expect(graph[0]).toMatchObject({
      name: "Oyutan MN",
      alternateName: ["Оюутан MN", "oyutanmn"],
      url: "https://oyutanmn.site/",
    });
    expect(graph[1]).toMatchObject({ logo: "https://oyutanmn.site/brand/oyutan-icon.png" });
  });
});
