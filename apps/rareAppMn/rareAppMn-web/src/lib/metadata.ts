import "server-only";
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { OG_LOCALES } from "@/i18n/config";
import { PAGE_SEO, type PageSeoKey } from "@/lib/seo";
import { pageMetadata } from "@/lib/site";

/** pageMetadata in the visitor's language (Open Graph locale and image alt included). */
export async function localizedPageMetadata(page: {
  title: string;
  description: string;
  path: string;
}): Promise<Metadata> {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("site")]);
  return pageMetadata({ ...page, ogLocale: OG_LOCALES[locale], imageAlt: t("ogImageAlt") });
}

/** Title, description and share card of a fixed page, from messages "seo.<key>". */
export async function staticPageMetadata(key: PageSeoKey): Promise<Metadata> {
  const t = await getTranslations("seo");
  return localizedPageMetadata({
    title: t(`${key}.title`),
    description: t(`${key}.description`),
    path: PAGE_SEO[key].path,
  });
}
