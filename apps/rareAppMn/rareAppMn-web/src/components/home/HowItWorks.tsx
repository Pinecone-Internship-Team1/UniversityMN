import { Section, SectionHeader } from "@/components/ui/Section";

const STEPS = [
  { title: "Хайх", text: "Сургууль, мэргэжлээ нэрээр нь эсвэл ЭЕШ оноогоороо хай." },
  { title: "Харьцуулах", text: "Төлбөр, босго оноо, тэтгэлгийг нь зэрэгцүүлэн хар." },
  { title: "Шийдэх", text: "Өөрт тохирохыг сонгоод албан ёсны сайтаас нь бүртгүүл." },
];

export function HowItWorks() {
  return (
    <Section tone="muted">
      <SectionHeader eyebrow="Хэрхэн ажилладаг вэ" title="Гуравхан алхам" align="center" />
      <ol className="mt-10 grid gap-3 md:grid-cols-3 md:gap-4">
        {STEPS.map((step, index) => (
          <li key={step.title} className="reveal relative rounded-2xl border border-border-ink bg-card p-5 md:p-6">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-full bg-accent font-display text-lg font-bold text-accent-foreground"
              aria-hidden="true"
            >
              {index + 1}
            </span>
            <h3 className="mt-4 text-xl font-bold text-ink">{step.title}</h3>
            <p className="mt-1.5 text-base leading-relaxed text-ink-2">{step.text}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
