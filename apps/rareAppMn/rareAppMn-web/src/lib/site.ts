import type { Metadata } from "next";

export const SITE_URL = "https://oyutanmn.site";
export const SITE_NAME = "Oyutan MN";
/** What people type to find us: the name in Cyrillic, and the domain as one word. */
export const SITE_ALTERNATE_NAMES = ["Оюутан MN", "oyutanmn"];

/** Our social profiles, listed as Organization.sameAs in the home page's JSON-LD. */
export const SOCIAL_PROFILES: string[] = ["https://www.instagram.com/oyutan_mn/"];

/** public/brand/og-image.png: the 1200×630 card shown when a link is shared. */
export const OG_IMAGE = {
  url: "/brand/og-image.png",
  width: 1200,
  height: 630,
  alt: "Oyutan MN (Оюутан MN) — их, дээд сургуулиудыг нэг дороос",
};

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

/**
 * A page's title, description, canonical URL and share card. Every page sets
 * its own canonical (the layout sets none, so no page inherits another's).
 */
export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "mn_MN",
      url: path,
      title,
      description,
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE],
    },
  };
}

/**
 * A JSON-LD object as the body of a <script type="application/ld+json">;
 * `<` is escaped so text from the data can't close the script tag.
 */
export function jsonLdHtml(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
