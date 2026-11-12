import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { LegalPage } from "@/components/layout/LegalPage";
import { SITE_NAME } from "@/lib/site";

// A draft: kept out of search results until the final text is written.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal.privacy");
  return {
    title: `${t("title")} — ${SITE_NAME}`,
    robots: { index: false },
    alternates: { canonical: "/privacy" },
  };
}

/** Text in messages "legal.privacy": an intro, then sections of a heading and paragraphs. */
export default function PrivacyPage() {
  const t = useTranslations("legal.privacy");
  return (
    <LegalPage title={t("title")}>
      <p>{t("intro")}</p>
      <h2>{t("storedTitle")}</h2>
      <p>{t("stored1")}</p>
      <p>{t("stored2")}</p>
      <h2>{t("useTitle")}</h2>
      <p>{t("use1")}</p>
    </LegalPage>
  );
}
