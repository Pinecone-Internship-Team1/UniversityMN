import { Clock, Globe, ListChecks, MessagesSquare } from "lucide-react";
import { Section, SectionHeader } from "@/components/ui/Section";

const PROBLEMS = [
  {
    icon: Globe,
    title: "Олон сайт",
    text: "Сургууль бүр өөр сайттай, мэдээлэл нь өөр өөр газар байрладаг.",
  },
  {
    icon: MessagesSquare,
    title: "Facebook, Telegram",
    text: "Чухал зарлал пост, группэд алга болж, хайхад хэцүү.",
  },
  {
    icon: ListChecks,
    title: "Тус тусдаа шалгана",
    text: "Төлбөр, мэргэжил, ЭЕШ босго, тэтгэлгийг нэг нэгээр нь хайна.",
  },
  {
    icon: Clock,
    title: "Цаг их зарцуулна",
    text: "Харьцуулах гэж хэдэн цаг, хэдэн өдрийг үрдэг.",
  },
];

/** The start of the story («Бидний тухай» in the hero scrolls here). */
export function Problem() {
  return (
    <Section id="story">
      <SectionHeader
        eyebrow="Асуудал"
        title="Бид ч мөн адил асуудалтай тулгарсан"
        description="Элсэлтийн жил ирэхэд бид ч бусадтай адил олон цагийг хайлтад зарцуулсан. Мэдээлэл хаа сайгүй тархсан, аль нь шинэ, аль нь хуучин гэдгийг ч мэдэхэд хэцүү."
      />
      <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        {PROBLEMS.map(({ icon: Icon, title, text }) => (
          <li key={title} className="reveal rounded-2xl border border-border-ink bg-card p-5 md:p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-ink">{title}</h3>
            <p className="mt-1.5 text-base leading-relaxed text-ink-2">{text}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
