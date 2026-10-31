import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, CalendarDays, CheckCircle2, Search, SlidersHorizontal } from "lucide-react";
import { SchoolCard, SchoolLogo } from "@/components/schools/SchoolCard";
import { Badge } from "@/components/ui/Badge";
import { Section, SectionHeader } from "@/components/ui/Section";
import { formatCutOff, formatDateMn, formatDateRange, todayInMongolia } from "@/lib/format";
import {
  getScholarshipDirectory,
  getSchoolDetail,
  getUpcomingAdmissions,
} from "@/lib/home-data";
import { formatCutOffRange, formatTuitionRange } from "@/lib/seo";
import { getUniversityBySchoolId } from "@/lib/university-logos";
import { cn } from "@/lib/utils";

/** The example score in the majors preview: a sample input, not a statistic. */
const EXAMPLE_SCORE = 520;

function Feature({
  index,
  title,
  text,
  links,
  preview,
}: {
  index: number;
  title: string;
  text: string;
  links: { label: string; href: string }[];
  preview: ReactNode;
}) {
  const flipped = index % 2 === 1;
  return (
    <li className="grid grid-cols-1 items-center gap-6 md:grid-cols-2 md:gap-12 lg:gap-16">
      <div className={cn("reveal", flipped && "md:order-2")}>
        <span className="font-display text-sm font-bold text-accent">0{index + 1}</span>
        <h3 className="mt-2 font-display text-xl leading-tight font-bold tracking-tight text-ink md:text-2xl">
          {title}
        </h3>
        <p className="mt-3 max-w-md text-base leading-relaxed text-ink-2 md:text-lg">{text}</p>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group inline-flex min-h-11 items-center gap-1.5 text-base font-bold text-accent-strong"
            >
              {link.label}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          ))}
        </div>
      </div>
      {/* Illustrations of the real screens, built from the real components and data. */}
      <div
        aria-hidden="true"
        inert
        className={cn("reveal select-none rounded-3xl border border-border-ink bg-paper-deep/70 p-3 sm:p-5", flipped && "md:order-1")}
      >
        {preview}
      </div>
    </li>
  );
}

function FakeSearch({ text, filter = false }: { text: string; filter?: boolean }) {
  return (
    <div className="flex gap-2">
      <div className="flex h-11 flex-1 items-center gap-2.5 rounded-xl border border-border-ink bg-card px-3.5 text-[15px] text-ink-2">
        <Search className="h-4 w-4 text-ink-3" />
        {text}
      </div>
      {filter && (
        <div className="flex h-11 items-center gap-2 rounded-xl border border-accent bg-accent-soft px-3.5 text-[15px] font-bold text-accent-strong">
          <SlidersHorizontal className="h-4 w-4" />
          Шүүлтүүр
        </div>
      )}
    </div>
  );
}

export async function ProductTour() {
  const [muis, shutis, { entries: scholarships }, admissions] = await Promise.all([
    getSchoolDetail("sch_muis"),
    getSchoolDetail("sch_shutis"),
    getScholarshipDirectory(),
    getUpcomingAdmissions(),
  ]);

  const today = todayInMongolia();
  const compared = [muis, shutis].filter((school) => school != null);
  // Schools with dorms, with their majors loaded so the card can show ranges.
  const dormSchools = compared.filter((school) => school.dormAvailable).slice(0, 2);
  // МУИС majors with one plain cut-off at or under the example score, distinct names.
  const seen = new Set<string>();
  const scoreMajors = (muis?.majors ?? [])
    .filter((major) => {
      const fits =
        major.secondaryCutOffScore == null &&
        major.cutOffScore != null &&
        major.cutOffScore > 0 &&
        major.cutOffScore <= EXAMPLE_SCORE &&
        !seen.has(major.name);
      if (fits) seen.add(major.name);
      return fits;
    })
    .slice(0, 3);
  const openScholarship = scholarships
    // Only real dates: some deadlines are notes like "2025 оны жишиг: …".
    .filter(({ scholarship }) => /^\d{4}-\d{2}-\d{2}/.test(scholarship.deadline ?? "") && (scholarship.deadline ?? "") >= today)
    .sort((a, b) => (a.scholarship.deadline ?? "").localeCompare(b.scholarship.deadline ?? ""))[0];
  const features = [
    {
      title: "Сургууль хайх ба шүүх",
      text: "Байршил, төлбөр, дотуур байр, тэтгэлгээр шүүгээд хэрэгтэй сургуулиа ол.",
      links: [{ label: "Сургууль хайх", href: "/schools" }],
      preview: (
        <div className="space-y-3">
          <FakeSearch text="Дотуур байртай" filter />
          {dormSchools.map((school) => (
            <SchoolCard
              key={school.id}
              school={school}
              showBookmark={false}
              cutOffRange={formatCutOffRange(school)}
              tuitionSummary={formatTuitionRange(school)}
              className="shadow-none"
            />
          ))}
        </div>
      ),
    },
    {
      title: "ЭЕШ оноогоор мэргэжил олох",
      text: "Оноогоо оруулаад босго нь тохирох мэргэжлүүдээ хар.",
      links: [{ label: "Мэргэжил хайх", href: "/schools?tab=majors" }],
      preview: (
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-xl border border-border-ink bg-card px-4 py-3">
            <span className="text-[15px] text-ink-2">Таны ЭЕШ оноо</span>
            <span className="font-display text-xl font-bold text-ink">{EXAMPLE_SCORE}</span>
          </div>
          {scoreMajors.map((major) => (
            <div key={major.id} className="flex items-center justify-between gap-3 rounded-xl border border-border-ink bg-card px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-bold text-ink">{major.name}</p>
                <p className="text-sm text-ink-3">МУИС · Босго {formatCutOff(major)}</p>
              </div>
              <Badge variant="success">
                <CheckCircle2 />
                Тохирно
              </Badge>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "Сургуулиудыг харьцуулах",
      text: "Хоёр, гурван сургуулийг төлбөр, босго оноо, тэтгэлгээр нь зэрэгцүүл.",
      links: [{ label: "Харьцуулах", href: "/compare" }],
      preview: (
        <div className="overflow-hidden rounded-2xl border border-border-ink bg-card text-[15px]">
          <div className="grid grid-cols-[1fr_1fr_1fr] border-b border-border-ink">
            <span />
            {compared.map((school) => (
              <div key={school.id} className="flex items-center gap-2 border-l border-border-ink px-3 py-3 font-bold text-ink">
                <SchoolLogo school={school} size={28} className="rounded-lg p-0.5" />
                {getUniversityBySchoolId(school.id)?.short ?? school.name}
              </div>
            ))}
          </div>
          {[
            { label: "Босго оноо", value: formatCutOffRange },
            { label: "Төлбөр / жил", value: formatTuitionRange },
            { label: "Мэргэжил", value: (school: (typeof compared)[number]) => String(school.majors.length) },
            { label: "Тэтгэлэг", value: (school: (typeof compared)[number]) => String(school.scholarships.length) },
          ].map((row) => (
            <div key={row.label} className="grid grid-cols-[1fr_1fr_1fr] border-b border-border-ink last:border-b-0">
              <span className="px-3 py-3 text-ink-3">{row.label}</span>
              {compared.map((school) => (
                <span key={school.id} className="border-l border-border-ink px-3 py-3 font-bold text-ink">
                  {row.value(school) ?? "—"}
                </span>
              ))}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "Тэтгэлэг ба элсэлтийн хуанли",
      text: "Нээлттэй тэтгэлэг, ойртож буй хугацааг алдалгүй хяна.",
      links: [
        { label: "Тэтгэлэг", href: "/scholarships" },
        { label: "Элсэлтийн хуанли", href: "/admissions" },
      ],
      preview: (
        <div className="space-y-3">
          {openScholarship && (
            <div className="rounded-2xl border border-border-ink bg-card p-4">
              <Badge variant="accent">Нээлттэй</Badge>
              <p className="mt-2 line-clamp-2 text-base font-bold text-ink">{openScholarship.scholarship.name}</p>
              <p className="mt-1 text-sm text-ink-3">
                {getUniversityBySchoolId(openScholarship.school.id)?.short ?? openScholarship.school.name} · Эцсийн хугацаа{" "}
                {formatDateMn(openScholarship.scholarship.deadline)}
              </p>
            </div>
          )}
          {admissions.slice(0, 2).map(({ schedule, school }) => (
            <div key={schedule.id} className="flex items-center gap-3 rounded-xl border border-border-ink bg-card px-4 py-3">
              <CalendarDays className="h-5 w-5 shrink-0 text-accent" />
              <div className="min-w-0">
                <p className="truncate text-[15px] font-bold text-ink">{schedule.eventName}</p>
                <p className="text-sm text-ink-3">
                  {getUniversityBySchoolId(school.id)?.short ?? school.name} ·{" "}
                  {formatDateRange(schedule.startDate, schedule.endDate)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <Section id="features">
      <SectionHeader
        eyebrow="Платформ"
        title="Юу хийж болох вэ?"
        description="Элсэлтэд хэрэгтэй бүх мэдээллийг сургуулиудын албан ёсны эх сурвалжаас цуглуулж, нэг загвараар харуулна."
      />
      <ol className="mt-12 space-y-16 md:mt-16 md:space-y-24">
        {features.map((feature, index) => (
          <Feature key={feature.title} index={index} {...feature} />
        ))}
      </ol>
    </Section>
  );
}
