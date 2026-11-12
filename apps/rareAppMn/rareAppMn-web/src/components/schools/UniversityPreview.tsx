import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Award,
  Banknote,
  BedDouble,
  BookOpen,
  Bookmark,
  CalendarDays,
  ClipboardList,
  Info,
  Lock,
  MapPin,
  Scale,
} from "lucide-react";
import { buttonClassName } from "@/components/ui/Button";
import { ComingSoon } from "@/components/ui/ComingSoon";
import { InfoSection } from "./InfoSection";
import { SIGN_IN_PATH, SIGN_UP_PATH } from "@/lib/auth-routes";
import { formatCutOff, formatDegreeType, formatSchoolTuition } from "@/lib/format";
import type { SchoolDetail } from "@/lib/graphql/documents";
import { previewMajors, schoolPath, shortOverview } from "@/lib/seo";
import { getUniversityBySchoolId } from "@/lib/university-logos";

const PREVIEW_MAJOR_COUNT = 6;

/** What signing in adds to the preview; labels are "universityPreview.locked.<key>". */
const LOCKED_SECTIONS = [
  { icon: BookOpen, key: "majors" },
  { icon: ClipboardList, key: "exams" },
  { icon: Award, key: "scholarships" },
  { icon: BedDouble, key: "dorms" },
  { icon: Bookmark, key: "save" },
  { icon: Scale, key: "compare" },
] as const;

/** /sign-in (or /sign-up) that comes back to this school afterwards. */
export function signInHref(schoolId: string, path = SIGN_IN_PATH): string {
  return `${path}?redirect_url=${encodeURIComponent(schoolPath(schoolId))}`;
}

/**
 * A school page for signed-out visitors and search engines (both get exactly
 * this): the main facts and the first few programs; the rest needs sign-in.
 */
export function UniversityPreview({ school }: { school: SchoolDetail }) {
  const t = useTranslations("universityPreview");
  const tPage = useTranslations("universityPage");
  const tFormat = useTranslations("format");
  const tc = useTranslations("common");
  const founded = getUniversityBySchoolId(school.id)?.founded;
  const overview = shortOverview(school.overview);
  const majors = previewMajors(
    school.majors,
    school.faculties.map((faculty) => faculty.id),
    PREVIEW_MAJOR_COUNT,
  );
  const facultyNames = new Map(school.faculties.map((faculty) => [faculty.id, faculty.name]));
  const hiddenMajorCount = school.majors.length - majors.length;

  return (
    <div className="mt-6 grid grid-cols-1 gap-6 md:mt-8 md:grid-cols-12 md:gap-8">
      <div className="space-y-4 md:col-span-8">
        <InfoSection icon={Info} title={tPage("about")} collapsible={false}>
          {overview ? (
            <p className="text-base leading-relaxed text-ink-2">{overview}</p>
          ) : (
            <ComingSoon className="mt-0" />
          )}
        </InfoSection>

        <InfoSection
          icon={BookOpen}
          title={t("majors")}
          collapsible={false}
          meta={school.majors.length > 0 ? t("programCount", { count: school.majors.length }) : undefined}
        >
          {majors.length === 0 ? (
            <ComingSoon className="mt-0" />
          ) : (
            <>
              <ul className="divide-y divide-border-ink rounded-xl border border-border-ink bg-paper">
                {majors.map((major) => {
                  const faculty = major.facultyId ? facultyNames.get(major.facultyId) : null;
                  const cutOff = formatCutOff(tFormat, major);
                  const degree = formatDegreeType(tFormat, major.degreeType);
                  return (
                    <li key={major.id} className="flex items-start justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-base font-bold leading-snug text-ink">{major.name}</p>
                        {(faculty || degree) && (
                          <p className="mt-0.5 text-sm text-ink-3">
                            {[degree, faculty].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                      {cutOff && (
                        <span className="shrink-0 rounded-lg bg-ink/[0.06] px-2.5 py-1 text-sm font-bold text-ink-2">
                          {cutOff}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
              {hiddenMajorCount > 0 && (
                <p className="mt-3 text-[15px] text-ink-3">
                  {t("hiddenMajors", { count: hiddenMajorCount })}
                </p>
              )}
            </>
          )}
        </InfoSection>

        <section
          aria-labelledby="unlock-title"
          className="rounded-2xl border border-border-ink bg-card p-5 md:p-7"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
              <Lock className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="unlock-title" className="text-lg leading-tight text-ink md:text-xl">
                {t("unlockTitle")}
              </h2>
              <p className="mt-1 text-[15px] text-ink-2">
                {t("unlockText")}
              </p>
            </div>
          </div>
          <ul className="mt-4 grid gap-x-6 gap-y-2.5 sm:grid-cols-2">
            {LOCKED_SECTIONS.map(({ icon: Icon, key }) => (
              <li key={key} className="flex items-start gap-2.5 text-[15px] text-ink-2">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />
                {t(`locked.${key}`)}
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link href={signInHref(school.id)} className={buttonClassName({})}>
              {tc("signIn")}
            </Link>
            <Link
              href={signInHref(school.id, SIGN_UP_PATH)}
              className={buttonClassName({ variant: "secondary" })}
            >
              {tc("signUp")}
            </Link>
          </div>
        </section>
      </div>

      <aside className="md:col-span-4">
        <section
          aria-labelledby="preview-facts-title"
          className="rounded-2xl border border-border-ink bg-card p-5 md:sticky md:top-24"
        >
          <h2 id="preview-facts-title" className="font-sans text-lg font-bold tracking-normal text-ink">
            {tPage("generalInfo")}
          </h2>
          <ul className="mt-3 divide-y divide-border-ink text-[15px]">
            <li className="flex gap-3 py-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-ink-3" aria-hidden="true" />
              <div>
                <p className="font-bold text-ink">{t("location")}</p>
                <p className="mt-0.5 text-ink-2">{school.location ?? t("defaultLocation")}</p>
              </div>
            </li>
            {founded && (
              <li className="flex gap-3 py-3">
                <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-ink-3" aria-hidden="true" />
                <div>
                  <p className="font-bold text-ink">{t("foundedYear")}</p>
                  <p className="mt-0.5 text-ink-2">{founded}</p>
                </div>
              </li>
            )}
            <li className="flex gap-3 py-3">
              <Banknote className="mt-0.5 h-5 w-5 shrink-0 text-ink-3" aria-hidden="true" />
              <div>
                <p className="font-bold text-ink">{tPage("tuitionFee")}</p>
                <p className="mt-0.5 text-ink-2">{formatSchoolTuition(tFormat, school)}</p>
              </div>
            </li>
          </ul>
        </section>
      </aside>
    </div>
  );
}
