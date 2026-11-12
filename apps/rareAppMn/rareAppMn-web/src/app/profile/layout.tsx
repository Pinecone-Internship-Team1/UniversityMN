import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { PageShell } from "@/components/layout/PageShell";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/Section";
import { ProfileTabs } from "@/components/profile/ProfileTabs";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  const t = useTranslations("profile");
  return (
    <PageShell>
      <Container className="py-6 md:py-12">
        <SectionHeader as="h1" title={t("pageTitle")} />

        <ProfileTabs className="mt-6" />

        <div className="mt-6 md:mt-8">{children}</div>
      </Container>
    </PageShell>
  );
}
