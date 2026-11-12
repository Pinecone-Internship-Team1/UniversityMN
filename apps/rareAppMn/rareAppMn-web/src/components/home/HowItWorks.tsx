import { useTranslations } from "next-intl";
import { Section, SectionHeader } from "@/components/ui/Section";

/** Message keys under "home.howItWorks": <step>Title and <step>Text. */
const STEPS = ["search", "compare", "decide"] as const;

export function HowItWorks() {
  const t = useTranslations("home.howItWorks");
  return (
    <Section tone="muted">
      <SectionHeader eyebrow={t("eyebrow")} title={t("title")} align="center" />
      <ol className="mt-10 grid gap-3 md:grid-cols-3 md:gap-4">
        {STEPS.map((step, index) => (
          <li key={step} className="reveal relative rounded-2xl border border-border-ink bg-card p-5 md:p-6">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-full bg-accent font-display text-lg font-bold text-accent-foreground"
              aria-hidden="true"
            >
              {index + 1}
            </span>
            <h3 className="mt-4 text-xl font-bold text-ink">{t(`${step}Title`)}</h3>
            <p className="mt-1.5 text-base leading-relaxed text-ink-2">{t(`${step}Text`)}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
