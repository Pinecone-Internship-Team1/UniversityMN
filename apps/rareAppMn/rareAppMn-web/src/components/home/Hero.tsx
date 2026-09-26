import {
  UNIVERSITIES,
  getCursorTrailUniversities,
} from "@/lib/university-logos";
import { UniversityLogoCloud } from "./UniversityLogoCloud";
import { UniversityCursorTrail } from "./UniversityCursorTrail";
import { SectionLabel } from "./SectionLabel";
import Link from "next/link";

const CURSOR_TRAIL_UNIVERSITIES = getCursorTrailUniversities();

export function Hero() {
  const universityNames = Object.values(UNIVERSITIES)
    .map((u) => u.full)
    .join(", ");

  return (
    <section
      id="top"
      className="bg-grain relative isolate overflow-hidden bg-paper"
    >
      <UniversityLogoCloud />
      <UniversityCursorTrail universities={CURSOR_TRAIL_UNIVERSITIES} />

      <div className="relative z-10 mx-auto flex min-h-[600px] max-w-[1440px] flex-col items-center justify-center px-6 py-24 text-center sm:min-h-[700px] sm:py-28 md:min-h-[760px] lg:min-h-[820px]">
        {/* Label */}
        <SectionLabel className="mb-6">
          Элсэлтийн гарын авлага — 2026
        </SectionLabel>

        {/* Main Heading */}
        <h1 className="text-balance text-3xl font-bold leading-[1.15] tracking-tight text-ink sm:text-5xl md:text-6xl lg:text-[4.25rem]">
          Монголын их, дээд сургуулиудыг
          <br />
          <span className="text-ink/80">нэг дороос.</span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 max-w-lg text-sm leading-relaxed text-ink/70 sm:text-base">
          ЭЕШ оноо, мэргэжил, сургалтын төлбөр, тэтгэлэг болон бусад мэдээллээр
          өөрт тохирох сургуулиа олоорой.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex w-full max-w-xs flex-col items-stretch gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:items-center">
          <Link
            href="#search"
            className="rounded-full bg-ink px-6 py-3 text-center text-[13px] font-semibold uppercase tracking-wider text-paper transition-all hover:bg-accent"
          >
            Сургууль хайх
          </Link>
          <Link
            href="#discovery"
            className="rounded-full border border-ink/20 bg-paper/50 px-6 py-3 text-center text-[13px] font-semibold uppercase tracking-wider text-ink transition-all hover:border-ink hover:bg-paper"
          >
            Танилцах
          </Link>
        </div>

        <span className="sr-only">
          Тус платформд багтсан 11 их, дээд сургууль: {universityNames}.
        </span>
      </div>
    </section>
  );
}
