import { ArrowRight, Banknote, Home, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { formatTuition } from "@/lib/format";
import type { School } from "@/lib/graphql/types";
import {
  getUniversityByFullName,
  getUniversitySlug,
} from "@/lib/university-logos";
import { cn } from "@/lib/utils";
import { SchoolBookmarkButton } from "./SchoolBookmarkButton";

export interface SchoolCardProps {
  school: School;
  className?: string;
  /** Forwarded to the bookmark button, e.g. to remove this card from a "saved schools" list once unsaved. */
  onToggled?: (saved: boolean) => void;
}

export function SchoolCard({ school, className, onToggled }: SchoolCardProps) {
  const university = getUniversityByFullName(school.name);
  const logoSrc = school.logoUrl ?? university?.image;
  const slug = getUniversitySlug(school.name) ?? school.id;
  const href = `/university/${slug}`;

  return (
    <div
      className={cn(
        "group relative flex w-[290px] shrink-0 flex-col justify-between rounded-2xl border border-ink/10 bg-card p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-ink/20 hover:shadow-md sm:w-[320px]",
        className,
      )}
    >
      <div className="absolute right-4 top-4 z-10">
        <SchoolBookmarkButton
          schoolId={school.id}
          initialSaved={school.isSaved}
          schoolName={university?.short ?? school.name}
          size="sm"
          onToggled={onToggled}
        />
      </div>

      <Link href={href} className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-4 pr-10">
          <span className="rounded-full bg-ink/5 px-3 py-1 text-[11px] font-semibold text-ink/70">
            {school.location ?? "Монгол Улс"}
          </span>
        </div>

        <div className="mt-5 flex items-center gap-3">
          {logoSrc ? (
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-ink/10 bg-paper p-1.5 shadow-2xs">
              <Image
                src={logoSrc}
                alt={`${school.name} лого`}
                fill
                sizes="44px"
                unoptimized={Boolean(school.logoUrl)}
                className="object-contain p-0.5"
              />
            </div>
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-ink/5 text-xs font-bold text-ink/60">
              {school.name.slice(0, 2)}
            </div>
          )}
          <h3 className="min-w-0 truncate text-xl font-bold tracking-tight text-ink transition-colors group-hover:text-accent">
            {university?.short ?? school.name}
          </h3>
        </div>

        <div className="mt-6 space-y-2.5 border-t border-ink/10 pt-4 text-xs text-ink/80">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-ink/40" />
            <span className="truncate">
              {school.location ?? "Байршил тодорхойгүй"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Banknote className="h-3.5 w-3.5 shrink-0 text-ink/40" />
            <span>
              Төлбөр:{" "}
              <strong className="font-semibold text-ink">
                {formatTuition(school.tuitionFee)}
              </strong>
            </span>
          </div>
          {school.dormAvailable && (
            <div className="flex items-center gap-2">
              <Home className="h-3.5 w-3.5 shrink-0 text-ink/40" />
              <span>Дотуур байртай</span>
            </div>
          )}
        </div>

        <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-ink transition-colors group-hover:text-accent">
          Дэлгэрэнгүй харах
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
        </div>
      </Link>
    </div>
  );
}
