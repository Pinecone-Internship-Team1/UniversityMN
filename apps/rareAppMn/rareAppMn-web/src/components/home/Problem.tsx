import { Clock, Globe, ListChecks, MessagesSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import { Section, SectionHeader } from "@/components/ui/Section";

/** `key`: message keys "home.problem.<key>Title" / "<key>Text". */
const PROBLEMS = [
  { icon: Globe, key: "sites" },
  { icon: MessagesSquare, key: "social" },
  { icon: ListChecks, key: "separate" },
  { icon: Clock, key: "time" },
] as const;

/** The start of the story («Бидний тухай» in the hero scrolls here). */
export function Problem() {
  const t = useTranslations("home.problem");
  return (
    <Section id="story">
      <SectionHeader eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
      <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        {PROBLEMS.map(({ icon: Icon, key }) => (
          <li key={key} className="reveal rounded-2xl border border-border-ink bg-card p-5 md:p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-ink">{t(`${key}Title`)}</h3>
            <p className="mt-1.5 text-base leading-relaxed text-ink-2">{t(`${key}Text`)}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
