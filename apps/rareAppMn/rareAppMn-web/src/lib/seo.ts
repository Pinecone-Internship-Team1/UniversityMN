import type { FormatT, SeoT } from "@/i18n/types";
import { degreeKey, formatAimag, formatMillions } from "@/lib/format";
import { SITE_ALTERNATE_NAMES, SITE_NAME, SITE_URL, SOCIAL_PROFILES, absoluteUrl } from "@/lib/site";
import { getUniversityBySchoolId, getUniversitySlug } from "@/lib/university-logos";

/** Google cuts titles and descriptions past about these lengths. */
export const MAX_TITLE_LENGTH = 60;
export const MAX_DESCRIPTION_LENGTH = 160;

/**
 * The fixed pages that have their own title and description. The text is in
 * messages/*.json under "seo.<key>"; lib/metadata.ts builds each page's
 * metadata in the visitor's language.
 */
export const PAGE_SEO = {
  home: { path: "/" },
  schools: { path: "/schools" },
  scholarships: { path: "/scholarships" },
  admissions: { path: "/admissions" },
  compare: { path: "/compare" },
  signIn: { path: "/sign-in" },
  signUp: { path: "/sign-up" },
  profile: { path: "/profile" },
  account: { path: "/profile/account" },
  admin: { path: "/admin" },
} as const;

export type PageSeoKey = keyof typeof PAGE_SEO;

/** The fields of a school (with its majors) that its title, description and JSON-LD use. */
export interface SchoolSeoInput {
  id: string;
  name: string;
  aliases: string[];
  location: string | null;
  logoUrl: string | null;
  overview: string | null;
  website: string | null;
  tuitionFee: number | null;
  majors: {
    cutOffScore: number | null;
    tuitionFee: number | null;
    degreeType: string | null;
  }[];
}

const CYRILLIC = /[Ѐ-ӿ]/;
const LATIN_SLUG = /^[a-z][a-z0-9-]*$/;

/** /university/muis for a known school, /university/<id> for any other. */
export function schoolPath(schoolId: string): string {
  return `/university/${getUniversitySlug(schoolId) ?? schoolId}`;
}

/** The short name people type in Cyrillic: "МУИС", else the first Cyrillic alias, else the full name. */
export function schoolShortName(school: Pick<SchoolSeoInput, "id" | "name" | "aliases">): string {
  return (
    getUniversityBySchoolId(school.id)?.short ??
    school.aliases.find((alias) => CYRILLIC.test(alias) && alias !== school.name) ??
    school.name
  );
}

/**
 * The name people type in Latin letters: the first lowercase Latin alias
 * ("muis", "ouubis" for ОУУБИС), else the route slug.
 */
export function schoolLatinName(school: Pick<SchoolSeoInput, "id" | "aliases">): string | null {
  return school.aliases.find((alias) => LATIN_SLUG.test(alias)) ?? getUniversitySlug(school.id) ?? null;
}

function range(values: number[]): [number, number] | null {
  if (values.length === 0) return null;
  return [Math.min(...values), Math.max(...values)];
}

/** Lowest and highest ЭЕШ cut-off among the school's majors; 0 means not known. */
export function cutOffRange(school: Pick<SchoolSeoInput, "majors">): [number, number] | null {
  return range(
    school.majors.map((major) => major.cutOffScore).filter((score): score is number => score != null && score > 0),
  );
}

/** "430–490", or "490" when every major has the same cut-off. */
export function formatCutOffRange(school: Pick<SchoolSeoInput, "majors">): string | null {
  const scores = cutOffRange(school);
  if (!scores) return null;
  return scores[0] === scores[1] ? String(scores[0]) : `${scores[0]}–${scores[1]}`;
}

/**
 * Yearly tuition from the majors' fees: "6.2–8.5 сая ₮", or the school's own
 * fee ("≈ 9.3 сая ₮") when no major has one; null when neither is known.
 */
export function formatTuitionRange(
  t: FormatT,
  school: Pick<SchoolSeoInput, "majors" | "tuitionFee">,
): string | null {
  const fees = range(
    school.majors.map((major) => major.tuitionFee).filter((fee): fee is number => fee != null && fee > 0),
  );
  if (fees) {
    const [low, high] = fees.map(formatMillions);
    return low === high ? t("millions", { amount: low }) : t("millionsRange", { low, high });
  }
  return school.tuitionFee ? t("millionsApprox", { amount: formatMillions(school.tuitionFee) }) : null;
}

/**
 * A few programs to show signed-out visitors: bachelor ones (what ЭЕШ students
 * look for), each name once, taking one from each faculty in the university's
 * order so the list isn't all from one (alphabetically first) branch school.
 */
export function previewMajors<T extends { name: string; facultyId: string | null; degreeType: string | null }>(
  majors: T[],
  facultyIds: string[],
  count: number,
): T[] {
  const bachelor = majors.filter((major) => degreeKey(major.degreeType) === "BACHELOR");
  const seen = new Set<string>();
  const distinct = (bachelor.length > 0 ? bachelor : majors).filter((major) => {
    if (seen.has(major.name)) return false;
    seen.add(major.name);
    return true;
  });
  const known = new Set(facultyIds);
  const groups = [
    ...facultyIds.map((id) => distinct.filter((major) => major.facultyId === id)),
    distinct.filter((major) => !major.facultyId || !known.has(major.facultyId)),
  ].filter((group) => group.length > 0);
  const picked: T[] = [];
  for (let round = 0; picked.length < count && groups.some((group) => group.length > round); round += 1) {
    for (const group of groups) {
      if (picked.length < count && group[round]) picked.push(group[round]);
    }
  }
  return picked;
}

function firstThatFits(candidates: string[], max: number): string {
  const fitting = candidates.find((candidate) => candidate.length <= max);
  if (fitting) return fitting;
  const last = candidates[candidates.length - 1];
  return `${last.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}

/** "МУИС (muis) — босго оноо, мэргэжил, төлбөр | Oyutan MN", shortened to fit 60 characters. */
export function schoolTitle(t: SeoT, school: Pick<SchoolSeoInput, "id" | "name" | "aliases">): string {
  const short = schoolShortName(school);
  const latin = schoolLatinName(school);
  const name = latin ? `${short} (${latin})` : short;
  return firstThatFits(
    [
      t("schoolTitle.full", { name }),
      t("schoolTitle.medium", { name }),
      t("schoolTitle.short", { name }),
      `${name} | ${SITE_NAME}`,
      name,
    ],
    MAX_TITLE_LENGTH,
  );
}

/**
 * The school's real numbers in one line under 160 characters, e.g. "Монгол Улсын
 * Их Сургууль (МУИС, muis): 330 мэргэжил, ЭЕШ босго оноо 430–490, төлбөр
 * 6.2–8.5 сая ₮/жил. Тэтгэлэг, дотуур байр, элсэлт."
 */
export function schoolDescription(t: SeoT, tFormat: FormatT, school: SchoolSeoInput): string {
  const short = schoolShortName(school);
  const latin = schoolLatinName(school);
  const cutOffs = formatCutOffRange(school);
  const tuition = formatTuitionRange(tFormat, school);
  const facts = [
    school.majors.length > 0 ? t("schoolFacts.majors", { count: school.majors.length }) : null,
    cutOffs ? t("schoolFacts.cutOff", { range: cutOffs }) : null,
    tuition ? t("schoolFacts.tuition", { range: tuition }) : null,
  ].filter(Boolean);
  const body = facts.length > 0 ? facts.join(", ") : t("schoolFacts.fallback");
  // "Этүгэн Их Сургууль (etugen)": a short name already in the full name isn't repeated.
  const names = [school.name.includes(short) ? null : short, latin].filter(Boolean).join(", ");
  const fullName = names ? `${school.name} (${names})` : school.name;
  const shortName = latin ? `${short} (${latin})` : short;
  const more = t("schoolFacts.more");
  return firstThatFits(
    [
      `${fullName}: ${body}. ${more}`,
      `${fullName}: ${body}.`,
      `${shortName}: ${body}. ${more}`,
      `${shortName}: ${body}.`,
    ],
    MAX_DESCRIPTION_LENGTH,
  );
}

/** The first sentences of the overview, cut at a sentence end before `max` characters. */
export function shortOverview(overview: string | null, max = 280): string | null {
  const text = overview?.trim().replace(/\s+/g, " ");
  if (!text) return null;
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const sentenceEnd = cut.lastIndexOf(". ");
  if (sentenceEnd > max / 3) return cut.slice(0, sentenceEnd + 1);
  return `${cut.replace(/\s+\S*$/, "")}…`;
}

/** Where a school's logo is: its uploaded image, else our copy in public/logos. */
export function schoolLogoUrl(school: Pick<SchoolSeoInput, "id" | "logoUrl">): string | null {
  return school.logoUrl ?? getUniversityBySchoolId(school.id)?.image ?? null;
}

/** schema.org CollegeOrUniversity for a school page, built only from what the public preview shows. */
export function schoolJsonLd(school: SchoolSeoInput): Record<string, unknown> {
  const pageUrl = absoluteUrl(schoolPath(school.id));
  const short = schoolShortName(school);
  const logo = schoolLogoUrl(school);
  const founded = getUniversityBySchoolId(school.id)?.founded;
  const alternateNames = [...new Set([short, ...school.aliases])].filter((name) => name !== school.name);
  const description = shortOverview(school.overview);
  return {
    "@context": "https://schema.org",
    "@type": "CollegeOrUniversity",
    "@id": `${pageUrl}#university`,
    name: school.name,
    ...(alternateNames.length > 0 && { alternateName: alternateNames }),
    url: school.website ?? pageUrl,
    mainEntityOfPage: pageUrl,
    ...(logo && { logo: absoluteUrl(logo), image: absoluteUrl(logo) }),
    ...(founded && { foundingDate: founded }),
    ...(description && { description }),
    address: {
      "@type": "PostalAddress",
      ...(school.location && { streetAddress: school.location }),
      addressLocality: formatAimag(school.location) ?? "Улаанбаатар",
      addressCountry: "MN",
    },
  };
}

/** schema.org WebSite and Organization for the home page: the names Google can show for the site. */
export function siteJsonLd(): Record<string, unknown> {
  const organizationId = `${SITE_URL}/#organization`;
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: SITE_NAME,
        alternateName: SITE_ALTERNATE_NAMES,
        url: `${SITE_URL}/`,
        inLanguage: "mn",
        publisher: { "@id": organizationId },
      },
      {
        "@type": "Organization",
        "@id": organizationId,
        name: SITE_NAME,
        alternateName: SITE_ALTERNATE_NAMES,
        url: `${SITE_URL}/`,
        logo: absoluteUrl("/brand/oyutan-icon.png"),
        ...(SOCIAL_PROFILES.length > 0 && { sameAs: SOCIAL_PROFILES }),
      },
    ],
  };
}
