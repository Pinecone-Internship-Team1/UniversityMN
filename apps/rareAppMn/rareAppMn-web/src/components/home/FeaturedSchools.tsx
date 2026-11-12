import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { SchoolCard } from "@/components/schools/SchoolCard";
import { ErrorState } from "@/components/ui/ErrorState";
import { Section, SectionHeader } from "@/components/ui/Section";
import { SchoolCardSkeleton } from "@/components/ui/Skeleton";
import { getHomeSchools, getSchoolDetail } from "@/lib/home-data";
import { formatCutOffRange, formatTuitionRange } from "@/lib/seo";

const FEATURED_COUNT = 6;

function SeeAll() {
  const t = useTranslations("common");
  return (
    <Link href="/schools" className="group inline-flex min-h-11 items-center gap-1.5 text-base font-bold text-accent-strong">
      {t("seeAll")}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
    </Link>
  );
}

/** Snap-scrolls sideways on phones (the next card peeks in); a grid on wide screens. */
const TRACK =
  "no-scrollbar -mx-4 mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 scroll-px-4 sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:px-0 lg:grid-cols-3";
const ITEM = "w-[85%] max-w-[340px] shrink-0 snap-start md:w-auto md:max-w-none";

function Header() {
  const t = useTranslations("home.featured");
  return (
    <SectionHeader
      eyebrow={t("eyebrow")}
      title={t("title")}
      action={
        <span className="hidden md:block">
          <SeeAll />
        </span>
      }
    />
  );
}

export async function FeaturedSchools() {
  const [{ schools, error }, t, tFormat] = await Promise.all([
    getHomeSchools(),
    getTranslations("home.featured"),
    getTranslations("format"),
  ]);
  const featured = schools.slice(0, FEATURED_COUNT);
  // The cards' cut-off and tuition ranges come from each school's majors.
  const details = await Promise.all(featured.map((school) => getSchoolDetail(school.id)));

  return (
    <Section>
      <Header />
      {error ? (
        <ErrorState className="mt-8" title={t("error")} />
      ) : (
        <ul className={TRACK} aria-label={t("title")}>
          {featured.map((school, index) => {
            const detail = details[index];
            return (
              <li key={school.id} className={ITEM}>
                <SchoolCard
                  school={school}
                  className="h-full"
                  cutOffRange={detail ? formatCutOffRange(detail) : null}
                  tuitionSummary={detail ? formatTuitionRange(tFormat, detail) : null}
                />
              </li>
            );
          })}
        </ul>
      )}
      <div className="mt-6 md:hidden">
        <SeeAll />
      </div>
    </Section>
  );
}

export function FeaturedSchoolsSkeleton() {
  return (
    <Section>
      <Header />
      <div className={TRACK}>
        {Array.from({ length: 3 }).map((_, index) => (
          <SchoolCardSkeleton key={index} className={ITEM} />
        ))}
      </div>
    </Section>
  );
}
