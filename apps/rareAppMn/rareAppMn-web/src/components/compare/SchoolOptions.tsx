"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useQuery } from "urql";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  COMPARE_SCHOOL_OPTIONS_QUERY,
  type CompareSchoolOption,
  type CompareSchoolOptionsResult,
  type SchoolsQueryVariables,
} from "@/lib/graphql/documents";
import { getErrorMessage } from "@/lib/graphql/errors";
import { getUniversityBySchoolId } from "@/lib/university-logos";
import { cn } from "@/lib/utils";

/** A university as the compare page's cards and chips show it. */
export interface SchoolOption {
  id: string;
  /** Full name, e.g. "Монгол Улсын Их Сургууль". */
  name: string;
  /** e.g. "МУИС"; a university without one shows its first alias or full name. */
  short: string;
  logo: string | null;
  /** True when `logo` is an uploaded image rather than one of our static logos. */
  uploadedLogo: boolean;
}

function toSchoolOption(school: CompareSchoolOption): SchoolOption {
  const university = getUniversityBySchoolId(school.id);
  return {
    id: school.id,
    name: school.name,
    short: university?.short ?? school.aliases[0] ?? school.name,
    logo: school.logoUrl ?? university?.image ?? null,
    uploadedLogo: Boolean(school.logoUrl),
  };
}

// The API's page limit; there are 11 universities today.
const ALL_SCHOOLS: SchoolsQueryVariables = { filter: { limit: 100 } };

/** Every university, in the API's order. */
export function useSchoolOptions() {
  const [result, reexecute] = useQuery<CompareSchoolOptionsResult, SchoolsQueryVariables>({
    query: COMPARE_SCHOOL_OPTIONS_QUERY,
    variables: ALL_SCHOOLS,
  });
  return {
    options: (result.data?.schools.items ?? []).map(toSchoolOption),
    fetching: result.fetching && !result.data,
    error: result.error,
    retry: () => reexecute({ requestPolicy: "network-only" }),
  };
}

export type SchoolOptions = ReturnType<typeof useSchoolOptions>;

export function SchoolLogo({ option, className }: { option: SchoolOption; className?: string }) {
  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-ink/10 bg-paper",
        className,
      )}
    >
      {option.logo ? (
        <Image
          src={option.logo}
          alt=""
          fill
          sizes="40px"
          unoptimized={option.uploadedLogo}
          className="object-contain p-1"
        />
      ) : (
        <span className="text-[10px] font-bold text-ink/60">{option.short.slice(0, 2)}</span>
      )}
    </span>
  );
}

interface SchoolOptionsStateProps {
  fetching: boolean;
  error: SchoolOptions["error"];
  retry: () => void;
  skeleton: ReactNode;
  children: ReactNode;
}

/** Loading and error states shared by the cards and the chips. */
export function SchoolOptionsState({ fetching, error, retry, skeleton, children }: SchoolOptionsStateProps) {
  if (error) return <ErrorState description={getErrorMessage(error)} onRetry={retry} />;
  if (fetching) return <>{skeleton}</>;
  return <>{children}</>;
}

interface SchoolCardPickerProps {
  options: SchoolOption[];
  selectedIds: string[];
  full: boolean;
  onToggle: (id: string) => void;
}

/** Every university as a compact card; tap to pick (numbered in pick order), tap again to remove. */
export function SchoolCardPicker({ options, selectedIds, full, onToggle }: SchoolCardPickerProps) {
  return (
    <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {options.map((option) => {
        const order = selectedIds.indexOf(option.id);
        const selected = order >= 0;
        return (
          <li key={option.id} className="min-w-0">
            <button
              type="button"
              aria-pressed={selected}
              disabled={!selected && full}
              onClick={() => onToggle(option.id)}
              title={option.name}
              className={cn(
                "flex h-full min-h-11 w-full flex-col gap-2 rounded-xl border p-3 text-left transition-colors duration-150",
                selected
                  ? "border-accent bg-accent-soft"
                  : "border-ink/10 bg-paper hover:border-ink/30",
                "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-ink/10",
              )}
            >
              <span className="flex w-full items-center gap-2.5">
                <span className="relative shrink-0">
                  <SchoolLogo option={option} className="h-9 w-9" />
                  {selected && (
                    <span
                      aria-hidden
                      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground ring-2 ring-card"
                    >
                      {order + 1}
                    </span>
                  )}
                </span>
                <span className="min-w-0 truncate text-sm font-bold text-ink">{option.short}</span>
              </span>
              <span className="line-clamp-2 text-[11px] leading-snug text-ink/60">{option.name}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function SchoolCardPickerSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-[92px] w-full rounded-xl" />
      ))}
    </div>
  );
}

const chipClass =
  "inline-flex min-h-9 items-center gap-2 rounded-full border px-3 text-xs font-semibold transition-colors max-lg:min-h-11";

interface SchoolChipsProps {
  options: SchoolOption[];
  /** null: every university. */
  activeId: string | null;
  onChange: (id: string | null) => void;
}

/** "Бүх сургууль" plus one chip per university; one is active at a time. */
export function SchoolChips({ options, activeId, onChange }: SchoolChipsProps) {
  const chip = (id: string | null, label: ReactNode, title?: string) => {
    const active = activeId === id;
    return (
      <button
        key={id ?? "all"}
        type="button"
        role="radio"
        aria-checked={active}
        title={title}
        onClick={() => onChange(id)}
        className={cn(
          chipClass,
          active
            ? "border-ink bg-ink text-paper"
            : "border-ink/15 bg-paper text-ink/80 hover:border-ink/40 hover:text-ink",
        )}
      >
        {label}
      </button>
    );
  };
  return (
    <div role="radiogroup" aria-label="Сургуулиар харах" className="flex flex-wrap gap-2">
      {chip(null, "Бүх сургууль")}
      {options.map((option) =>
        chip(
          option.id,
          <>
            <SchoolLogo option={option} className="-ml-1 h-6 w-6 rounded-full border-0 bg-white" />
            {option.short}
          </>,
          option.name,
        ),
      )}
    </div>
  );
}

export function SchoolChipsSkeleton() {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-11 w-24 rounded-full lg:h-9" />
      ))}
    </div>
  );
}
