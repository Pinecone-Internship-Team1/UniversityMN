import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Award,
  Banknote,
  BedDouble,
  CalendarDays,
  Flag,
  Globe,
  Info,
  LogIn,
  Mail,
  MapPin,
  Phone,
  Scale,
} from "lucide-react";
import { auth } from "@clerk/nextjs/server";
import { PageShell } from "@/components/layout/PageShell";
import { BackLink } from "@/components/schools/BackLink";
import { InfoSection } from "@/components/schools/InfoSection";
import { SchoolLogo } from "@/components/schools/SchoolCard";
import { Badge } from "@/components/ui/Badge";
import { buttonClassName } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { MajorScoreCheck } from "@/components/schools/MajorScoreCheck";
import { SchoolBookmarkButton } from "@/components/schools/SchoolBookmarkButton";
import { UniversityPrograms } from "@/components/schools/UniversityPrograms";
import {
  UniversityPreview,
  signInHref,
} from "@/components/schools/UniversityPreview";
import { DormGuideDetails } from "@/components/schools/DormGuideDetails";
import { ComingSoon } from "@/components/ui/ComingSoon";
import { compareHref } from "@/lib/compare";
import { createServerGraphqlClient } from "@/lib/graphql-server";
import {
  SCHOOL_QUERY,
  type SchoolDetail,
  type SchoolQueryResult,
  type SchoolQueryVariables,
} from "@/lib/graphql/documents";
import {
  formatAvailability,
  formatDateMn,
  formatDateRange,
  formatFee,
  formatSchoolTuition,
  formatSchoolType,
} from "@/lib/format";
import {
  formatCutOffRange,
  formatTuitionRange,
  schoolDescription,
  schoolJsonLd,
  schoolPath,
  schoolTitle,
} from "@/lib/seo";
import { DATA_UPDATED_AT, jsonLdHtml, pageMetadata, reportHref } from "@/lib/site";
import { cn } from "@/lib/utils";
import { UNIVERSITIES, getUniversityBySchoolId } from "@/lib/university-logos";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * The URL segment is either a known static slug (e.g. "muis", mapped to its
 * backend id in university-logos.ts) or a raw backend School id. Cached for
 * the request, so generateMetadata and the page share one fetch.
 */
const resolveSchool = cache(
  async (idOrSlug: string): Promise<SchoolDetail | null> => {
    const client = createServerGraphqlClient();
    const schoolId = UNIVERSITIES[idOrSlug]?.schoolId ?? idOrSlug;

    const detailResult = await client
      .query<SchoolQueryResult, SchoolQueryVariables>(SCHOOL_QUERY, {
        id: schoolId,
      })
      .toPromise();
    return detailResult.data?.school ?? null;
  },
);

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const school = await resolveSchool(id);
  if (!school) notFound();
  return pageMetadata({
    title: schoolTitle(school),
    description: schoolDescription(school),
    path: schoolPath(school.id),
  });
}

export default async function UniversityDetailPage({ params }: PageProps) {
  const { id } = await params;
  const school = await resolveSchool(id);

  if (!school) {
    notFound();
  }

  // Signed-out visitors and search engines get the same public preview; the
  // full page (programs, exams, scholarships, dorms, save, compare) needs sign-in.
  const { userId } = await auth();
  const signedIn = userId != null;

  const university = getUniversityBySchoolId(school.id);
  const shortName = university?.short ?? school.name;
  const schoolType = formatSchoolType(school.name);
  const facts = [
    { label: "Байгуулагдсан", value: university?.founded ? `${university.founded} он` : null },
    { label: "Мэргэжил", value: school.majors.length > 0 ? String(school.majors.length) : null },
    { label: "ЭЕШ босго оноо", value: formatCutOffRange(school) },
    { label: "Жилийн төлбөр", value: formatTuitionRange(school) },
  ];

  return (
    <PageShell className="pb-24 md:pb-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(schoolJsonLd(school)) }}
      />

      <Container className="pt-3 pb-12 md:pt-6 md:pb-20">
        <BackLink />

        {school.coverUrl && (
          <div className="relative mt-3 h-40 overflow-hidden rounded-3xl border border-border-ink bg-card sm:h-64">
            <Image
              src={school.coverUrl}
              alt={`${shortName} нүүр зураг`}
              fill
              sizes="(max-width: 1200px) 100vw, 1200px"
              unoptimized
              className="object-cover"
            />
          </div>
        )}

        {/* Hero */}
        <header className="mt-3 flex flex-col gap-5 md:mt-4 md:flex-row md:items-end md:justify-between">
          <div className="flex items-start gap-4">
            <SchoolLogo school={school} size={72} className="rounded-2xl p-2 md:h-24 md:w-24" />
            <div className="min-w-0">
              <h1 className="text-[1.75rem] leading-tight text-ink md:text-4xl">{shortName}</h1>
              {shortName !== school.name && (
                <p className="mt-1 text-base leading-snug text-ink-2 md:text-lg">{school.name}</p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[15px] text-ink-3">
                {schoolType && <Badge>{schoolType}</Badge>}
                {school.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {school.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions: here on wide screens, in the bottom bar on phones. */}
          <div className="hidden shrink-0 items-center gap-3 md:flex">
            <SchoolActions school={school} shortName={shortName} signedIn={signedIn} />
          </div>
        </header>

        <dl className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {facts.map((fact) => (
            <div key={fact.label} className="rounded-2xl border border-border-ink bg-card p-4">
              <dt className="text-sm text-ink-3">{fact.label}</dt>
              <dd className="mt-1 text-lg font-bold leading-tight text-ink md:text-xl">{fact.value ?? "—"}</dd>
            </div>
          ))}
        </dl>

        {signedIn ? (
          <div className="mt-6 grid grid-cols-1 gap-6 md:mt-8 md:grid-cols-12 md:gap-8">
            <div className="space-y-4 md:col-span-8">
              <InfoSection icon={Info} title="Сургуулийн тухай" collapsible={false}>
                {school.overview ? (
                  <p className="text-base leading-relaxed text-ink-2">{school.overview}</p>
                ) : (
                  <ComingSoon className="mt-0" />
                )}
              </InfoSection>

              <UniversityPrograms faculties={school.faculties} majors={school.majors} />

              {school.majors.length > 0 && (
                <MajorScoreCheck majors={school.majors} faculties={school.faculties} />
              )}

              <InfoSection
                icon={Award}
                title="Тэтгэлэг ба боломжууд"
                meta={school.scholarships.length > 0 ? `${school.scholarships.length} тэтгэлэг` : undefined}
              >
                {school.scholarships.length === 0 ? (
                  <ComingSoon className="mt-0" />
                ) : (
                  <ul className="space-y-3">
                    {school.scholarships.map((scholarship) => (
                      <li key={scholarship.id} className="rounded-xl border border-border-ink bg-paper p-4">
                        <p className="text-base font-bold leading-snug text-ink">{scholarship.name}</p>
                        {scholarship.coverage && (
                          <p className="mt-1 text-[15px] text-ink-2">{scholarship.coverage}</p>
                        )}
                        {scholarship.requirements && (
                          <p className="mt-1 whitespace-pre-line text-[15px] text-ink-2">
                            <span className="font-bold text-ink">Шаардлага: </span>
                            {scholarship.requirements}
                          </p>
                        )}
                        {scholarship.deadline && (
                          <p className="mt-2 text-[15px] font-bold text-ink">
                            Эцсийн хугацаа: {formatDateMn(scholarship.deadline)}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </InfoSection>

              <InfoSection icon={BedDouble} title="Оюутны байр">
                {school.dormitories.length === 0 && !school.dormGuide ? (
                  <ComingSoon className="mt-0" />
                ) : (
                  <>
                    {school.dormitories.length > 0 && (
                      <ul className="space-y-3">
                        {school.dormitories.map((dormitory) => (
                          <li key={dormitory.id} className="rounded-xl border border-border-ink bg-paper p-4">
                            {dormitory.name && (
                              <p className="mb-2 text-base font-bold text-ink">{dormitory.name}</p>
                            )}
                            <div className="flex flex-wrap gap-2 text-sm font-bold text-ink-2">
                              {dormitory.capacity != null && (
                                <span className="rounded-lg bg-ink/[0.06] px-2.5 py-1">
                                  {dormitory.capacity.toLocaleString("mn-MN")} ор
                                </span>
                              )}
                              {dormitory.feePerYear != null && (
                                <span className="rounded-lg bg-ink/[0.06] px-2.5 py-1">
                                  Жилд: {formatFee(dormitory.feePerYear, dormitory.currency)}
                                </span>
                              )}
                              {dormitory.feePerMonth != null && (
                                <span className="rounded-lg bg-ink/[0.06] px-2.5 py-1">
                                  Сард: {formatFee(dormitory.feePerMonth, dormitory.currency)}
                                </span>
                              )}
                            </div>
                            {(dormitory.facilities ?? []).length > 0 && (
                              <p className="mt-2 text-[15px] text-ink-3">
                                {(dormitory.facilities ?? []).join(" · ")}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                    {school.dormGuide && <DormGuideDetails guide={school.dormGuide} />}
                  </>
                )}
              </InfoSection>

              <InfoSection
                icon={CalendarDays}
                title="Элсэлтийн хуанли"
                meta={school.admissionSchedules.length > 0 ? `${school.admissionSchedules.length} үйл явдал` : undefined}
              >
                {school.admissionSchedules.length === 0 ? (
                  <ComingSoon className="mt-0" />
                ) : (
                  <ul className="space-y-2">
                    {school.admissionSchedules.map((schedule) => (
                      <li
                        key={schedule.id}
                        className="flex flex-col gap-1 rounded-xl border border-border-ink bg-paper px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                      >
                        <span className="text-base font-bold text-ink">{schedule.eventName}</span>
                        <span className="shrink-0 text-[15px] text-ink-2 tabular-nums">
                          {formatDateRange(schedule.startDate, schedule.endDate)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </InfoSection>

              <SourceLine schoolName={shortName} website={school.website} />
            </div>

            <aside className="md:col-span-4">
              <div className="space-y-4 md:sticky md:top-24">
                <ContactCard school={school} />
              </div>
            </aside>
          </div>
        ) : (
          <>
            <UniversityPreview school={school} />
            <SourceLine schoolName={shortName} website={null} className="mt-6" />
          </>
        )}
      </Container>

      {/* Phones: the main actions stay in reach at the bottom of the screen. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border-ink bg-paper/95 px-4 pt-3 pb-safe backdrop-blur-md md:hidden">
        <div className="mx-auto flex max-w-[1200px] items-center gap-2">
          <SchoolActions school={school} shortName={shortName} signedIn={signedIn} compact />
        </div>
      </div>
    </PageShell>
  );
}

/** Save / compare / official site (signed in), or the sign-in call to action. */
function SchoolActions({
  school,
  shortName,
  signedIn,
  compact = false,
}: {
  school: SchoolDetail;
  shortName: string;
  signedIn: boolean;
  compact?: boolean;
}) {
  if (!signedIn) {
    return (
      <Link href={signInHref(school.id)} className={buttonClassName({ className: compact ? "flex-1" : "" })}>
        <LogIn />
        Нэвтэрч бүгдийг хар
      </Link>
    );
  }
  return (
    <>
      <SchoolBookmarkButton
        schoolId={school.id}
        initialSaved={school.isSaved}
        schoolName={shortName}
        className="h-12 w-12"
      />
      <Link
        href={compareHref("schools", [school.id])}
        className={buttonClassName({ variant: "secondary", className: compact ? "flex-1 px-3" : "" })}
      >
        <Scale />
        Харьцуулах
      </Link>
      {school.website && (
        <a
          href={school.website}
          target="_blank"
          rel="noreferrer"
          className={buttonClassName({ className: compact ? "flex-1 px-3" : "" })}
        >
          <Globe />
          {compact ? "Сайт" : "Албан ёсны сайт"}
        </a>
      )}
    </>
  );
}

function ContactCard({ school }: { school: SchoolDetail }) {
  const rows = [
    { icon: Banknote, label: "Сургалтын төлбөр", value: formatSchoolTuition(school) },
    { icon: BedDouble, label: "Дотуур байр", value: formatAvailability(school.dormAvailable) },
    { icon: Award, label: "Тэтгэлэг", value: formatAvailability(school.scholarshipAvailable) },
  ];
  return (
    <section aria-labelledby="contact-title" className="rounded-2xl border border-border-ink bg-card p-5">
      <h2 id="contact-title" className="font-sans text-lg font-bold tracking-normal text-ink">
        Ерөнхий мэдээлэл
      </h2>
      <ul className="mt-3 divide-y divide-border-ink text-[15px]">
        {rows.map(({ icon: Icon, label, value }) => (
          <li key={label} className="flex gap-3 py-3">
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-ink-3" aria-hidden="true" />
            <div className="min-w-0">
              <p className="font-bold text-ink">{label}</p>
              <p className="mt-0.5 text-ink-2">{value}</p>
            </div>
          </li>
        ))}
        {school.phones.length > 0 && (
          <li className="flex gap-3 py-3">
            <Phone className="mt-0.5 h-5 w-5 shrink-0 text-ink-3" aria-hidden="true" />
            <div className="min-w-0">
              <p className="font-bold text-ink">Утас</p>
              {school.phones.map((phone) => (
                <p key={phone}>
                  <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="inline-flex min-h-9 items-center text-ink-2 hover:text-accent">
                    {phone}
                  </a>
                </p>
              ))}
            </div>
          </li>
        )}
        {school.email && (
          <li className="flex gap-3 py-3">
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-ink-3" aria-hidden="true" />
            <div className="min-w-0">
              <p className="font-bold text-ink">И-мэйл</p>
              <p>
                <a href={`mailto:${school.email}`} className="inline-flex min-h-9 items-center break-all text-ink-2 hover:text-accent">
                  {school.email}
                </a>
              </p>
            </div>
          </li>
        )}
      </ul>
    </section>
  );
}

/** Where the data comes from, when it was checked, and how to report a mistake. */
function SourceLine({
  schoolName,
  website,
  className,
}: {
  schoolName: string;
  website: string | null;
  className?: string;
}) {
  return (
    <p className={cn("text-[15px] leading-relaxed text-ink-3", className)}>
      Мэдээллийг{" "}
      {website ? (
        <a href={website} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-accent">
          сургуулийн албан ёсны сайт
        </a>
      ) : (
        "сургуулийн албан ёсны сайт"
      )}
      , элсэлтийн журмаас цуглуулав. Сүүлд шинэчилсэн: {DATA_UPDATED_AT}.{" "}
      <a href={reportHref(schoolName)} className="inline-flex min-h-11 items-center gap-1 font-bold text-accent-strong underline-offset-4 hover:underline">
        <Flag className="h-4 w-4" aria-hidden="true" />
        Мэдэгдэх
      </a>
    </p>
  );
}
