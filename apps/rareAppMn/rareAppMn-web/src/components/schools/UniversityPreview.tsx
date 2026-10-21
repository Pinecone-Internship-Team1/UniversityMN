import Link from "next/link";
import {
  Award,
  Banknote,
  BedDouble,
  BookOpen,
  Bookmark,
  CalendarDays,
  ClipboardList,
  Lock,
  MapPin,
  Scale,
} from "lucide-react";
import { buttonClassName } from "@/components/ui/Button";
import { ComingSoon } from "@/components/ui/ComingSoon";
import { SIGN_IN_PATH, SIGN_UP_PATH } from "@/lib/auth-routes";
import { formatCutOff, formatDegreeType, formatSchoolTuition } from "@/lib/format";
import type { SchoolDetail } from "@/lib/graphql/documents";
import {
  formatCutOffRange,
  formatTuitionRange,
  previewMajors,
  schoolPath,
  shortOverview,
} from "@/lib/seo";
import { getUniversityBySchoolId } from "@/lib/university-logos";

const PREVIEW_MAJOR_COUNT = 6;

/** What signing in adds to the preview. */
const LOCKED_SECTIONS = [
  { icon: BookOpen, label: "Бүх мэргэжлийн хүснэгт" },
  { icon: ClipboardList, label: "ЭЕШ шалгалтын хичээл, жин, оноо тооцоолох" },
  { icon: Award, label: "Тэтгэлэг ба боломжууд" },
  { icon: BedDouble, label: "Оюутны байр, бүртгүүлэх журам" },
  { icon: Bookmark, label: "Сургууль, мэргэжлээ хадгалах" },
  { icon: Scale, label: "Бусад сургуультай харьцуулах" },
];

/** /sign-in (or /sign-up) that comes back to this school afterwards. */
export function signInHref(schoolId: string, path = SIGN_IN_PATH): string {
  return `${path}?redirect_url=${encodeURIComponent(schoolPath(schoolId))}`;
}

/**
 * A school page for signed-out visitors and search engines (both get exactly
 * this): the main facts and the first few programs; the rest needs sign-in.
 */
export function UniversityPreview({ school }: { school: SchoolDetail }) {
  const founded = getUniversityBySchoolId(school.id)?.founded;
  const overview = shortOverview(school.overview);
  const cutOffs = formatCutOffRange(school);
  const tuition = formatTuitionRange(school);
  const majors = previewMajors(
    school.majors,
    school.faculties.map((faculty) => faculty.id),
    PREVIEW_MAJOR_COUNT,
  );
  const facultyNames = new Map(school.faculties.map((faculty) => [faculty.id, faculty.name]));
  const hiddenMajorCount = school.majors.length - majors.length;

  const facts = [
    { label: "Байгуулагдсан", value: founded ? `${founded} он` : null },
    { label: "Мэргэжил", value: school.majors.length > 0 ? String(school.majors.length) : null },
    { label: "ЭЕШ босго оноо", value: cutOffs },
    { label: "Жилийн төлбөр", value: tuition },
  ];

  return (
    <div className="mt-10 grid gap-8 md:grid-cols-12">
      <div className="space-y-8 md:col-span-8">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {facts.map((fact) => (
            <div key={fact.label} className="rounded-2xl border border-ink/10 bg-card p-4">
              <dt className="text-[11px] font-bold uppercase tracking-wider text-ink/50">
                {fact.label}
              </dt>
              <dd className="mt-1.5 text-lg font-bold text-ink sm:text-xl">{fact.value ?? "—"}</dd>
            </div>
          ))}
        </dl>

        <section className="rounded-2xl border border-ink/10 bg-card p-6 sm:p-8">
          <h2 className="text-xl font-bold tracking-tight text-ink">Сургуулийн тухай</h2>
          {overview ? (
            <p className="mt-4 text-sm leading-relaxed text-ink/80 sm:text-base">{overview}</p>
          ) : (
            <ComingSoon />
          )}
        </section>

        <section className="rounded-2xl border border-ink/10 bg-card p-6 sm:p-8">
          <div className="flex items-center gap-2 text-ink">
            <BookOpen className="h-5 w-5 text-accent" />
            <h2 className="text-xl font-bold tracking-tight">Мэргэжлүүд</h2>
          </div>
          {majors.length === 0 ? (
            <ComingSoon />
          ) : (
            <>
              <ul className="mt-4 divide-y divide-ink/10 rounded-xl border border-ink/10 bg-paper">
                {majors.map((major) => {
                  const faculty = major.facultyId ? facultyNames.get(major.facultyId) : null;
                  const cutOff = formatCutOff(major);
                  const degree = formatDegreeType(major.degreeType);
                  return (
                    <li
                      key={major.id}
                      className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-ink">{major.name}</p>
                        {(faculty || degree) && (
                          <p className="mt-0.5 text-xs text-ink/60">
                            {[degree, faculty].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                      {cutOff && (
                        <span className="shrink-0 text-xs font-semibold text-ink/70">
                          Босго: {cutOff}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
              {hiddenMajorCount > 0 && (
                <p className="mt-3 text-xs font-semibold text-ink/60">
                  + {hiddenMajorCount} мэргэжил нэвтэрсний дараа харагдана
                </p>
              )}
            </>
          )}
        </section>

        <section className="rounded-2xl border border-accent/30 bg-accent-soft p-6 sm:p-8">
          <div className="flex items-center gap-2 text-ink">
            <Lock className="h-5 w-5 text-accent" />
            <h2 className="text-xl font-bold tracking-tight">Нэвтэрч бүх мэдээллийг хар</h2>
          </div>
          <p className="mt-2 text-sm text-ink/70">
            Бүртгэл үнэгүй. Нэвтэрсний дараа энэ хуудас руу буцаж ирнэ.
          </p>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {LOCKED_SECTIONS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-start gap-2.5 text-sm text-ink/80">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                {label}
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href={signInHref(school.id)} className={buttonClassName({ size: "lg" })}>
              Нэвтэрч бүгдийг хар
            </Link>
            <Link
              href={signInHref(school.id, SIGN_UP_PATH)}
              className={buttonClassName({ variant: "outline", size: "lg" })}
            >
              Бүртгүүлэх
            </Link>
          </div>
        </section>
      </div>

      <div className="md:col-span-4">
        <div className="sticky top-28 space-y-4 rounded-2xl border border-ink/10 bg-card p-6">
          <h3 className="text-base font-bold text-ink">Ерөнхий мэдээлэл</h3>

          <div className="space-y-4 pt-2 text-xs text-ink/80">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 text-ink/40" />
              <div>
                <p className="font-semibold text-ink">Байршил</p>
                <p className="mt-0.5">{school.location ?? "Улаанбаатар хот"}</p>
              </div>
            </div>

            {founded && (
              <div className="flex items-start gap-3 border-t border-ink/10 pt-3">
                <CalendarDays className="mt-0.5 h-4 w-4 text-ink/40" />
                <div>
                  <p className="font-semibold text-ink">Байгуулагдсан он</p>
                  <p className="mt-0.5">{founded}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 border-t border-ink/10 pt-3">
              <Banknote className="mt-0.5 h-4 w-4 text-ink/40" />
              <div>
                <p className="font-semibold text-ink">Сургалтын төлбөр</p>
                <p className="mt-0.5">{formatSchoolTuition(school)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
