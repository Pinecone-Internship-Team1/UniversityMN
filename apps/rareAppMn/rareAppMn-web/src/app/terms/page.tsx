import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { LegalPage } from "@/components/layout/LegalPage";
import { SITE_NAME } from "@/lib/site";

// A draft: kept out of search results until the final text is written.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal.terms");
  return {
    title: `${t("title")} — ${SITE_NAME}`,
    robots: { index: false },
    alternates: { canonical: "/terms" },
  };
}

/** Text in messages "legal.terms": an intro, then sections of a heading and paragraphs. */
export default function TermsPage() {
  const t = useTranslations("legal.terms");
  return (
    <LegalPage title={t("title")}>
      <p>{t("intro")}</p>
      <h2>{t("whatTitle")}</h2>
      <p>{t("what1")}</p>
      <h2>{t("accuracyTitle")}</h2>
      <p>{t("accuracy1")}</p>
    </LegalPage>
  );
}
