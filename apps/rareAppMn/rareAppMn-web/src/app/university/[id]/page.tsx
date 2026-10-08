import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  GraduationCap,
  Banknote,
  Globe,
  Award,
  Users,
  CalendarDays,
  BedDouble,
  Scale,
  Phone,
  Mail,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MajorScoreCheck } from "@/components/schools/MajorScoreCheck";
import { SchoolBookmarkButton } from "@/components/schools/SchoolBookmarkButton";
import { UniversityPrograms } from "@/components/schools/UniversityPrograms";
import { compareHref } from "@/lib/compare";
import { createServerGraphqlClient } from "@/lib/graphql-server";
import {
  SCHOOL_QUERY,
  SCHOOLS_QUERY,
  type SchoolDetail,
  type SchoolQueryResult,
  type SchoolQueryVariables,
  type SchoolsQueryResult,
  type SchoolsQueryVariables,
} from "@/lib/graphql/documents";
import {
  formatAmount,
  formatDate,
  formatDateRange,
  formatTuition,
} from "@/lib/format";
import { UNIVERSITIES, getUniversityByFullName } from "@/lib/university-logos";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * The URL segment is either a known static slug (e.g. "muis", matched to
 * its logo/display name in university-logos.ts) or a raw backend School
 * id. Slugs are resolved to a backend id by exact name match first, since
 * the backend itself has no concept of slugs.
 */
async function resolveSchool(idOrSlug: string): Promise<SchoolDetail | null> {
  const client = createServerGraphqlClient();
  const knownUniversity = UNIVERSITIES[idOrSlug];

  if (knownUniversity) {
    const listResult = await client
      .query<SchoolsQueryResult, SchoolsQueryVariables>(SCHOOLS_QUERY, {
        filter: { search: knownUniversity.full, limit: 100 },
      })
      .toPromise();

    const match = listResult.data?.schools.items.find(
      (item) => item.name === knownUniversity.full,
    );
    if (!match) return null;

    const detailResult = await client
      .query<SchoolQueryResult, SchoolQueryVariables>(SCHOOL_QUERY, {
        id: match.id,
      })
      .toPromise();
    return detailResult.data?.school ?? null;
  }

  const detailResult = await client
    .query<SchoolQueryResult, SchoolQueryVariables>(SCHOOL_QUERY, {
      id: idOrSlug,
    })
    .toPromise();
  return detailResult.data?.school ?? null;
}

export default async function UniversityDetailPage({ params }: PageProps) {
  const { id } = await params;
  const school = await resolveSchool(id);

  if (!school) {
    notFound();
  }

  const university = getUniversityByFullName(school.name);
  const shortName = university?.short ?? school.name;
  const imageSrc = school.logoUrl ?? university?.image;

  return (
    <div className="min-h-screen bg-paper text-ink">
      <Navbar />

      <main className="mx-auto max-w-[1440px] px-6 py-12 sm:px-8 sm:py-20">
        {/* Back Link */}
        <Link
          href="/#discovery"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink/60 transition-colors hover:text-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          Буцах
        </Link>

        {school.coverUrl && (
          <div className="relative mt-8 h-48 overflow-hidden rounded-3xl border border-ink/10 bg-card sm:h-72">
            <Image
              src={school.coverUrl}
              alt={`${shortName} нүүр зураг`}
              fill
              unoptimized
              className="object-cover"
            />
          </div>
        )}

        {/* Header Hero Section */}
        <div className="mt-8 flex flex-col gap-8 rounded-3xl border border-ink/10 bg-card p-6 sm:p-10 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-6">
            {imageSrc && (
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-ink/10 bg-paper p-2 shadow-xs sm:h-24 sm:w-24">
                <Image
                  src={imageSrc}
                  alt={`${shortName} лого`}
                  fill
                  unoptimized={Boolean(school.logoUrl)}
                  className="object-contain p-1"
                />
              </div>
            )}
            <div>
              <span className="rounded-full bg-ink/5 px-3 py-1 text-xs font-semibold text-ink/70">
                {school.location ?? "Их сургууль"}
              </span>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                {shortName}
              </h1>
              <p className="mt-1 text-sm font-medium text-ink/60 sm:text-base">
                {school.name}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <SchoolBookmarkButton
              schoolId={school.id}
              initialSaved={school.isSaved}
              schoolName={shortName}
            />
            <Link
              href={compareHref("schools", [school.id])}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-ink/20 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-ink transition-all hover:border-ink hover:bg-ink hover:text-paper"
            >
              <Scale className="h-4 w-4" />
              Харьцуулах
            </Link>
            {school.website && (
              <Link
                href={school.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-xs font-semibold uppercase tracking-wider text-paper transition-all hover:bg-accent"
              >
                <Globe className="h-4 w-4" />
                Албан ёсны сайт
              </Link>
            )}
          </div>
        </div>

        {/* Grid Content Section */}
        <div className="mt-10 grid gap-8 md:grid-cols-12">
          <div className="space-y-8 md:col-span-8">
            <section className="rounded-2xl border border-ink/10 bg-card p-6 sm:p-8">
              <h2 className="text-xl font-bold tracking-tight text-ink">
                Сургуулийн тухай
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-ink/80 sm:text-base">
                {school.overview ??
                  `${school.name} нь салбартаа манлайлагч, чанартай боловсрол олгодог тэргүүлэгч сургуулиудын нэг юм.`}
              </p>
            </section>

            <UniversityPrograms faculties={school.faculties} majors={school.majors} />

            {/* Scholarships */}
            <section className="rounded-2xl border border-ink/10 bg-card p-6 sm:p-8">
              <div className="flex items-center gap-2 text-ink">
                <Award className="h-5 w-5 text-accent" />
                <h2 className="text-xl font-bold tracking-tight">
                  Тэтгэлэг ба Боломжууд
                </h2>
              </div>
              {school.scholarships.length === 0 ? (
                <p className="mt-4 text-sm text-ink/60">
                  Тэтгэлгийн мэдээлэл одоогоор бүртгэгдээгүй байна.
                </p>
              ) : (
                <ul className="mt-4 space-y-3 text-sm text-ink/80">
                  {school.scholarships.map((scholarship) => (
                    <li
                      key={scholarship.id}
                      className="flex items-start gap-2"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      <div>
                        <p className="font-semibold text-ink">
                          {scholarship.name}
                        </p>
                        {scholarship.coverage && (
                          <p className="text-xs text-ink/60">
                            {scholarship.coverage}
                          </p>
                        )}
                        {scholarship.requirements && (
                          <p className="mt-0.5 text-xs text-ink/60">
                            Шаардлага: {scholarship.requirements}
                          </p>
                        )}
                        {scholarship.deadline && (
                          <p className="mt-0.5 text-xs font-semibold text-ink/70">
                            Эцсийн хугацаа: {formatDate(scholarship.deadline)}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {school.dormitories.length > 0 && (
              <section className="rounded-2xl border border-ink/10 bg-card p-6 sm:p-8">
                <div className="flex items-center gap-2 text-ink">
                  <BedDouble className="h-5 w-5 text-accent" />
                  <h2 className="text-xl font-bold tracking-tight">
                    Оюутны байр
                  </h2>
                </div>
                <ul className="mt-4 space-y-3 text-sm text-ink/80">
                  {school.dormitories.map((dormitory) => (
                    <li
                      key={dormitory.id}
                      className="rounded-xl border border-ink/10 bg-paper px-4 py-3"
                    >
                      <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-ink/70">
                        {dormitory.capacity != null && (
                          <span className="rounded-full bg-ink/5 px-2.5 py-1">
                            {dormitory.capacity.toLocaleString("mn-MN")} ор
                          </span>
                        )}
                        {dormitory.feePerMonth != null && (
                          <span className="rounded-full bg-ink/5 px-2.5 py-1">
                            Сарын төлбөр: {formatAmount(dormitory.feePerMonth)}
                          </span>
                        )}
                      </div>
                      {(dormitory.facilities ?? []).length > 0 && (
                        <p className="mt-2 text-xs text-ink/60">
                          {(dormitory.facilities ?? []).join(" · ")}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {school.majors.length > 0 && (
              <MajorScoreCheck majors={school.majors} />
            )}

            {/* Admission schedule */}
            {school.admissionSchedules.length > 0 && (
              <section className="rounded-2xl border border-ink/10 bg-card p-6 sm:p-8">
                <div className="flex items-center gap-2 text-ink">
                  <CalendarDays className="h-5 w-5 text-accent" />
                  <h2 className="text-xl font-bold tracking-tight">
                    Элсэлтийн хуанли
                  </h2>
                </div>
                <ul className="mt-4 space-y-3 text-sm text-ink/80">
                  {school.admissionSchedules.map((schedule) => (
                    <li
                      key={schedule.id}
                      className="flex items-center justify-between gap-4 rounded-xl border border-ink/10 bg-paper px-4 py-3"
                    >
                      <span className="font-semibold text-ink">
                        {schedule.eventName}
                      </span>
                      <span className="text-xs font-medium text-ink/60">
                        {formatDateRange(schedule.startDate, schedule.endDate)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* Sidebar Specs */}
          <div className="md:col-span-4">
            <div className="sticky top-28 space-y-4 rounded-2xl border border-ink/10 bg-card p-6">
              <h3 className="text-base font-bold text-ink">Ерөнхий мэдээлэл</h3>

              <div className="space-y-4 pt-2 text-xs text-ink/80">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 text-ink/40" />
                  <div>
                    <p className="font-semibold text-ink">Байршил</p>
                    <p className="mt-0.5">
                      {school.location ?? "Улаанбаатар хот"}
                    </p>
                  </div>
                </div>

                {school.phones.length > 0 && (
                  <div className="flex items-start gap-3 border-t border-ink/10 pt-3">
                    <Phone className="mt-0.5 h-4 w-4 text-ink/40" />
                    <div>
                      <p className="font-semibold text-ink">Утас</p>
                      <ul className="mt-0.5 space-y-0.5">
                        {school.phones.map((phone) => (
                          <li key={phone}>
                            <a
                              href={`tel:${phone.replace(/[^\d+]/g, "")}`}
                              className="transition-colors hover:text-accent"
                            >
                              {phone}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {school.email && (
                  <div className="flex items-start gap-3 border-t border-ink/10 pt-3">
                    <Mail className="mt-0.5 h-4 w-4 text-ink/40" />
                    <div className="min-w-0">
                      <p className="font-semibold text-ink">И-мэйл</p>
                      <a
                        href={`mailto:${school.email}`}
                        className="mt-0.5 block break-all transition-colors hover:text-accent"
                      >
                        {school.email}
                      </a>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 border-t border-ink/10 pt-3">
                  <Banknote className="mt-0.5 h-4 w-4 text-ink/40" />
                  <div>
                    <p className="font-semibold text-ink">
                      Дундаж сургалтын төлбөр
                    </p>
                    <p className="mt-0.5">{formatTuition(school.tuitionFee)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 border-t border-ink/10 pt-3">
                  <GraduationCap className="mt-0.5 h-4 w-4 text-ink/40" />
                  <div>
                    <p className="font-semibold text-ink">Дотуур байр</p>
                    <p className="mt-0.5">
                      {school.dormAvailable ? "Боломжтой" : "Боломжгүй"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 border-t border-ink/10 pt-3">
                  <Users className="mt-0.5 h-4 w-4 text-ink/40" />
                  <div>
                    <p className="font-semibold text-ink">Тэтгэлэг</p>
                    <p className="mt-0.5">
                      {school.scholarshipAvailable ? "Боломжтой" : "Боломжгүй"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
