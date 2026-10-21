import type { MetadataRoute } from "next";
import { createGraphqlClient } from "@/lib/graphql-client";
import { SITEMAP_SCHOOLS_QUERY, type SitemapSchool } from "@/lib/graphql/documents";
import { fetchAllSchools } from "@/lib/graphql/fetch-all-schools";
import { PAGE_SEO, schoolPath } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";

// Built on each request, so a school added in the admin shows up right away.
export const dynamic = "force-dynamic";

const PUBLIC_PAGES = [PAGE_SEO.home, PAGE_SEO.schools, PAGE_SEO.scholarships, PAGE_SEO.admissions];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Signed out on purpose: the sitemap lists what everyone can see.
  const { items: schools } = await fetchAllSchools<SitemapSchool>(
    createGraphqlClient(async () => null),
    SITEMAP_SCHOOLS_QUERY,
  );

  // The listing pages show the schools, so they change when a school is added.
  const newestSchool = schools.reduce<string | undefined>(
    (newest, school) => (newest && newest > school.createdAt ? newest : school.createdAt),
    undefined,
  );

  return [
    ...PUBLIC_PAGES.map((page) => ({
      url: absoluteUrl(page.path),
      ...(newestSchool && { lastModified: newestSchool }),
    })),
    ...schools.map((school) => ({
      url: absoluteUrl(schoolPath(school.id)),
      lastModified: school.createdAt,
    })),
  ];
}
