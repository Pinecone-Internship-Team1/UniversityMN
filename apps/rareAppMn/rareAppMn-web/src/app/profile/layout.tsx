import type { ReactNode } from "react";
import { PageShell } from "@/components/layout/PageShell";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/Section";
import { ProfileTabs } from "@/components/profile/ProfileTabs";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <PageShell>
      <Container className="py-6 md:py-12">
        <SectionHeader
          as="h1"
          title="Таны профайл"
        />

        <ProfileTabs className="mt-6" />

        <div className="mt-6 md:mt-8">{children}</div>
      </Container>
    </PageShell>
  );
}
