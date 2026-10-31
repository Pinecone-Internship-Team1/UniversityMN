import type { ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/ui/Container";
import { CONTACT_EMAIL } from "@/lib/site";
import { PageShell } from "./PageShell";

/** /privacy and /terms: drafts until the final text is written. */
export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <PageShell>
      <Container size="narrow" className="py-12 md:py-20">
        <Badge variant="accent">Төсөл — эцэслэгдээгүй</Badge>
        <h1 className="mt-4 text-[1.75rem] text-ink sm:text-4xl">{title}</h1>
        <div className="mt-8 space-y-5 text-base leading-relaxed text-ink-2 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:text-ink">
          {children}
          <p>
            Асуулт байвал{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="font-bold text-accent underline underline-offset-4">
              {CONTACT_EMAIL}
            </a>{" "}
            хаягаар бидэнтэй холбогдоорой.
          </p>
        </div>
      </Container>
    </PageShell>
  );
}
