import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { StatusPage } from "@/components/layout/StatusPage";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { SITE_NAME } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("status");
  return { title: `${t("notFoundTitle")} — ${SITE_NAME}` };
}

export default function NotFound() {
  const t = useTranslations("status");
  return (
    <PageShell>
      <StatusPage
        code="404"
        title={t("notFoundTitle")}
        description={t("notFoundText")}
      />
    </PageShell>
  );
}
