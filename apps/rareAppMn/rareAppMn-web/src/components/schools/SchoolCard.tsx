import { ArrowRight, Banknote, MapPin, Target } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formatSchoolTuition } from "@/lib/format";
import type { School } from "@/lib/graphql/types";
import {
  getUniversityBySchoolId,
  getUniversitySlug,
} from "@/lib/university-logos";
import { cn } from "@/lib/utils";
import { SchoolBookmarkButton } from "./SchoolBookmarkButton";

export interface SchoolCardProps {
  school: School;
  className?: string;
  /** ЭЕШ cut-off range across the school's majors, e.g. "430–490" (only where the majors were loaded). */
  cutOffRange?: string | null;
  /** A one-line yearly tuition, e.g. "6.2–8.5 сая ₮"; defaults to the school's own tuition text. */
  tuitionSummary?: string | null;
  /** Hide the bookmark (e.g. in a decorative preview). */
  showBookmark?: boolean;
  /** Forwarded to the bookmark button, e.g. to remove this card from a "saved schools" list once unsaved. */
  onToggled?: (saved: boolean) => void;
}

/** The school's logo in a rounded tile, or its first letters when there is none. */
export function SchoolLogo({
  school,
  size = 48,
  className,
}: {
  school: Pick<School, "id" | "name" | "logoUrl">;
  size?: number;
  className?: string;
}) {
  const university = getUniversityBySchoolId(school.id);
  const logoSrc = school.logoUrl ?? university?.image;
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border-ink bg-white p-1.5",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {logoSrc ? (
        <Image
          src={logoSrc}
          alt=""
          width={size}
          height={size}
          sizes={`${size}px`}
          unoptimized={Boolean(school.logoUrl)}
          className="h-full w-full object-contain"
        />
      ) : (
        <span className="text-sm font-bold text-ink-2">{school.name.slice(0, 2)}</span>
      )}
    </div>
  );
}

/**
 * One school in a list. The whole card is a link (the name's ::after covers
 * it), and the bookmark sits above that layer, so there's no button inside a
 * link and each has its own tap target.
 */
export function SchoolCard({
  school,
  className,
  cutOffRange,
  tuitionSummary,
  showBookmark = true,
  onToggled,
}: SchoolCardProps) {
  const university = getUniversityBySchoolId(school.id);
  const slug = getUniversitySlug(school.id) ?? school.id;
  const href = `/university/${slug}`;
  const shortName = university?.short ?? school.name;
  const tuition = tuitionSummary ?? formatSchoolTuition(school);
  // The school's own tuition text may already say "/жил"; a computed range doesn't.
  const perYear = tuitionSummary != null;

  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-2xl border border-border-ink bg-card p-5 shadow-card transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-ink/25 hover:shadow-lift active:scale-[0.99]",
        className,
      )}
    >
      <div className="flex items-start gap-3 pr-12">
        <SchoolLogo school={school} />
        <div className="min-w-0">
          <h3 className="text-lg font-bold leading-tight text-ink">
            <Link
              href={href}
              className="rounded-sm after:absolute after:inset-0 after:rounded-2xl after:content-[''] group-hover:text-accent"
            >
              {shortName}
            </Link>
          </h3>
          {shortName !== school.name && (
            <p className="mt-0.5 line-clamp-2 text-[15px] leading-snug text-ink-3">{school.name}</p>
          )}
        </div>
      </div>

      {showBookmark && (
        <div className="absolute right-4 top-4 z-10">
          <SchoolBookmarkButton
            schoolId={school.id}
            initialSaved={school.isSaved}
            schoolName={shortName}
            size="sm"
            className="h-10 w-10"
            onToggled={onToggled}
          />
        </div>
      )}

      <ul className="mt-4 space-y-2 text-[15px] text-ink-2">
        <li className="flex items-center gap-2.5">
          <span className="sr-only">Байршил: </span>
          <MapPin className="h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />
          <span className="truncate">{school.location ?? "Байршил тодорхойгүй"}</span>
        </li>
        {cutOffRange && (
          <li className="flex items-center gap-2.5">
            <Target className="h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />
            <span>
              Босго оноо <strong className="font-bold text-ink">{cutOffRange}</strong>
            </span>
          </li>
        )}
        <li className="flex items-center gap-2.5">
          <span className="sr-only">Сургалтын төлбөр: </span>
          <Banknote className="h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />
          <span className="truncate" title={tuition}>
            <strong className="font-bold text-ink">{tuition}</strong>
            {perYear && <span className="text-ink-3"> / жил</span>}
          </span>
        </li>
      </ul>

      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
        {school.dormAvailable ? <Badge variant="success">Дотуур байртай</Badge> : <span />}
        <span className="inline-flex items-center gap-1 text-[15px] font-bold text-ink group-hover:text-accent" aria-hidden="true">
          Дэлгэрэнгүй
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </article>
  );
}
