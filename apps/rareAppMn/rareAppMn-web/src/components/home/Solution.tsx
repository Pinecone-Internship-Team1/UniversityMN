import { Check, X } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/Section";

/** Each problem lined up with its fix. */
const ROWS = [
  { before: "Мэдээлэл олон газар тархсан", after: "Бүх сургууль нэг хайлтад" },
  { before: "Сургууль бүрийн сайт өөр", after: "Ижил бүтэцтэй, ойлгомжтой карт" },
  { before: "Facebook, Telegram-аас хайна", after: "Албан ёсны сайт, журам, мэдээллээс цуглуулсан" },
  { before: "Төлбөр, ЭЕШ, тэтгэлгийг тусад нь", after: "Төлбөр, босго оноо, тэтгэлэг нэг дор" },
  { before: "Сонголтод цаг их зарцуулна", after: "Зэрэгцүүлэн харьцуулаад шийднэ" },
];

export function Solution() {
  return (
    <Section tone="muted">
      <SectionHeader eyebrow="Шийдэл" title="Өмнө нь ба одоо" />

      <div className="mt-10 overflow-hidden rounded-3xl border border-border-ink bg-card">
        {/* Column titles: wide screens only; on phones each pair is labelled. */}
        <div className="hidden grid-cols-2 border-b border-border-ink text-sm font-bold md:grid" aria-hidden="true">
          <p className="px-6 py-4 text-ink-3">Өмнө</p>
          <p className="border-l border-border-ink bg-accent-soft/50 px-6 py-4 text-accent">Oyutan MN</p>
        </div>
        <ul>
          {ROWS.map((row) => (
            <li key={row.before} className="reveal grid grid-cols-1 border-b border-border-ink last:border-b-0 md:grid-cols-2">
              <p className="flex items-start gap-3 px-5 pt-4 pb-2 text-base text-ink-3 md:px-6 md:py-5">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <X className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
                </span>
                <span>
                  <span className="sr-only">Өмнө: </span>
                  {row.before}
                </span>
              </p>
              <p className="flex items-start gap-3 px-5 pt-2 pb-4 text-base font-bold text-ink md:border-l md:border-border-ink md:bg-accent-soft/40 md:px-6 md:py-5">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
                </span>
                <span>
                  <span className="sr-only">Oyutan MN: </span>
                  {row.after}
                </span>
              </p>
            </li>
          ))}
        </ul>
      </div>

      <p className="reveal mx-auto mt-10 max-w-3xl text-center font-display text-xl leading-snug font-bold tracking-tight text-balance text-ink md:text-2xl">
        <span className="text-ink-3">Бид сурагчдын өмнөөс сонголт хийхгүй.</span> Харин зөв мэдээллийг
        нэг дор хүргэнэ.
      </p>
    </Section>
  );
}
