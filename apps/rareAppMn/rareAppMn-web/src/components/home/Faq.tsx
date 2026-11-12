import { useTranslations } from "next-intl";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import { Section, SectionHeader } from "@/components/ui/Section";
import { CONTACT_EMAIL, DATA_UPDATED_AT } from "@/lib/site";

/** Message keys "home.faq.items.<key>.question" / ".answer". */
const FAQ_KEYS = ["what", "free", "source", "official", "updates", "report"] as const;

export function Faq() {
  const t = useTranslations("home.faq");
  return (
    <Section id="faq" tone="muted">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <SectionHeader eyebrow={t("eyebrow")} title={t("title")} />
        <Accordion>
          {FAQ_KEYS.map((key) => (
            <AccordionItem key={key} title={t(`items.${key}.question`)} name="faq">
              <p>
                {t.rich(`items.${key}.answer`, {
                  date: DATA_UPDATED_AT,
                  email: CONTACT_EMAIL,
                  link: (chunks) => (
                    <a href={`mailto:${CONTACT_EMAIL}`} className="font-bold text-accent-strong underline underline-offset-4">
                      {chunks}
                    </a>
                  ),
                })}
              </p>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  );
}
