import {
  UNIVERSITIES,
  getCursorTrailUniversities,
} from "@/lib/university-logos";
import { UniversityLogoCloud } from "./UniversityLogoCloud";
import { UniversityCursorTrail } from "./UniversityCursorTrail";

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

      <div className="relative z-10 mx-auto flex min-h-[600px] max-w-[1440px] flex-col items-center justify-center px-6 py-28 text-center sm:min-h-[720px] sm:py-32 md:min-h-[780px] lg:min-h-[860px] lg:py-36">
        <p className="mb-6 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-soft">
          <span className="h-px w-8 bg-accent" aria-hidden="true" />
          Элсэлтийн гарын авлага — 2026
        </p>

        <h1 className="text-balance font-display text-[2.15rem] font-semibold leading-[1.1] tracking-tight text-ink sm:text-6xl md:text-7xl lg:text-[4.85rem]">
          Монголын их, дээд сургуулиудыг
          <br />
          нэг дороос.
        </h1>

        <p className="mt-7 max-w-[19rem] text-[15px] leading-relaxed text-ink-soft sm:max-w-lg sm:text-base">
          ЭЕШ оноо, мэргэжил, сургалтын төлбөр, тэтгэлэг болон бусад мэдээллээр
          өөрт тохирох сургуулиа олоорой.
        </p>

        <div className="mt-9 flex w-full max-w-md flex-col items-stretch gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:items-center">
          <a
            href="#search"
            className="rounded-sm bg-ink px-6 py-3.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-paper transition-colors hover:bg-accent"
          >
            Нуур хуудас руу
          </a>
          <a
            href="#discovery"
            className="rounded-sm border border-ink/25 px-6 py-3.5 text-[13px] font-semibold uppercase tracking-[0.06em] text-ink transition-colors hover:border-ink"
          >
            Сургууль хайх
          </a>
        </div>

        <span className="sr-only">
          Тус платформд багтсан 11 их, дээд сургууль: {universityNames}.
        </span>
      </div>
    </section>
  );
}
