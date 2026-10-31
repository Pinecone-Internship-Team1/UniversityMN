"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "urql";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatCutOff, formatMajorPlace, formatMajorTuition } from "@/lib/format";
import {
  MAJORS_QUERY,
  type MajorsQueryResult,
  type MajorsQueryVariables,
} from "@/lib/graphql/documents";
import type { MajorFilterInput } from "@/lib/graphql/types";
import { getUniversityBySchoolId, getUniversitySlug } from "@/lib/university-logos";
import { cn } from "@/lib/utils";
import { MajorBookmarkButton } from "./MajorBookmarkButton";
import { MajorNotes } from "./MajorNotes";
import { Filters, Pager, ResultCount, SearchField } from "./ExplorerParts";

const PAGE_SIZE = 10;

interface FilterState {
  search: string;
  category: string;
  minCutOffScore: string;
  maxCutOffScore: string;
}

const INITIAL_FILTERS: FilterState = {
  search: "",
  category: "",
  minCutOffScore: "",
  maxCutOffScore: "",
};

function buildFilter(filters: FilterState, page: number): MajorFilterInput {
  const filter: MajorFilterInput = {
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  };
  if (filters.search.trim()) filter.search = filters.search.trim();
  if (filters.category.trim()) filter.category = filters.category.trim();

  const min = Number(filters.minCutOffScore);
  if (filters.minCutOffScore.trim() && Number.isFinite(min)) {
    filter.minCutOffScore = min;
  }
  const max = Number(filters.maxCutOffScore);
  if (filters.maxCutOffScore.trim() && Number.isFinite(max)) {
    filter.maxCutOffScore = max;
  }
  return filter;
}

function MajorResultSkeleton() {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-border-ink bg-card p-4">
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-7 w-40 rounded-full" />
      </div>
      <Skeleton className="h-10 w-10 rounded-full" />
    </div>
  );
}

export interface MajorsExplorerProps {
  /** The visitor's ЭЕШ score from the homepage (?score=): shows majors whose cut-off is at or below it. */
  initialScore?: number | null;
}

export function MajorsExplorer({ initialScore = null }: MajorsExplorerProps) {
  const [filters, setFilters] = useState<FilterState>(() =>
    initialScore != null ? { ...INITIAL_FILTERS, maxCutOffScore: String(initialScore) } : INITIAL_FILTERS,
  );
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const debouncedFilters = useDebouncedValue(filters, 350);

  const variables = useMemo<MajorsQueryVariables>(
    () => ({ filter: buildFilter(debouncedFilters, page) }),
    [debouncedFilters, page],
  );

  const [{ data, fetching, error }, reexecuteQuery] = useQuery<
    MajorsQueryResult,
    MajorsQueryVariables
  >({ query: MAJORS_QUERY, variables });

  function updateFilter<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  }

  const pageInfo = data?.majors.pageInfo;
  const totalPages = pageInfo ? Math.max(1, Math.ceil(pageInfo.totalCount / PAGE_SIZE)) : 1;
  const hasActiveFilters =
    filters.search || filters.category || filters.minCutOffScore || filters.maxCutOffScore;

  const activeCount = [filters.category, filters.minCutOffScore, filters.maxCutOffScore].filter(Boolean).length;
  const scoreFilter = Number(filters.maxCutOffScore);

  function clearFilters() {
    setPage(1);
    setFilters((current) => ({ ...INITIAL_FILTERS, search: current.search }));
  }

  function resetAll() {
    setPage(1);
    setFilters(INITIAL_FILTERS);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 sm:gap-3">
        <SearchField
          value={filters.search}
          onChange={(value) => updateFilter("search", value)}
          placeholder="Мэргэжлийн нэр…"
          label="Мэргэжлийн нэрээр хайх"
        />
        <Filters
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          activeCount={activeCount}
          resultCount={pageInfo?.totalCount ?? null}
          onClear={clearFilters}
        >
          <Field label="Чиглэл" htmlFor="filter-category">
            <Input
              id="filter-category"
              value={filters.category}
              onChange={(event) => updateFilter("category", event.target.value)}
              placeholder="жишээ: Инженерчлэл"
            />
          </Field>
          <Field label="Босго оноо — доод" htmlFor="filter-min-score">
            <Input
              id="filter-min-score"
              type="number"
              inputMode="numeric"
              min={0}
              max={800}
              value={filters.minCutOffScore}
              onChange={(event) => updateFilter("minCutOffScore", event.target.value)}
              placeholder="жишээ: 450"
            />
          </Field>
          <Field label="Босго оноо — дээд (таны оноо)" htmlFor="filter-max-score">
            <Input
              id="filter-max-score"
              type="number"
              inputMode="numeric"
              min={0}
              max={800}
              value={filters.maxCutOffScore}
              onChange={(event) => updateFilter("maxCutOffScore", event.target.value)}
              placeholder="жишээ: 620"
            />
          </Field>
        </Filters>
      </div>

      {filters.maxCutOffScore && Number.isFinite(scoreFilter) && (
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-accent/30 bg-accent-soft px-4 py-3">
          <p className="flex-1 text-[15px] text-ink">
            Таны оноо: <strong className="font-bold">{scoreFilter}</strong> · босго нь үүнээс ихгүй мэргэжлүүд
          </p>
          <button
            type="button"
            onClick={() => updateFilter("maxCutOffScore", "")}
            className="-mr-2 inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 text-[15px] font-bold text-accent-strong"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Арилгах
          </button>
        </div>
      )}

      <div className="mt-6">
        {error ? (
          <ErrorState onRetry={() => reexecuteQuery({ requestPolicy: "network-only" })} />
        ) : fetching && !data ? (
          <div className="space-y-3" role="status" aria-label="Ачаалж байна">
            {Array.from({ length: 5 }).map((_, i) => (
              <MajorResultSkeleton key={i} />
            ))}
          </div>
        ) : !data || data.majors.items.length === 0 ? (
          <EmptyState
            title="Тохирох мэргэжил олдсонгүй"
            description="Хайлт эсвэл шүүлтүүрээ өөрчилж дахин оролдоно уу."
            action={
              hasActiveFilters ? (
                <Button variant="secondary" onClick={resetAll}>
                  Бүгдийг цэвэрлэх
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <ResultCount>{data.majors.pageInfo.totalCount} мэргэжил олдлоо</ResultCount>
            <ul
              className={cn(
                "grid grid-cols-1 gap-3 transition-opacity duration-200 lg:grid-cols-2",
                fetching && "opacity-60",
              )}
            >
              {data.majors.items.map((major) => {
                const university = getUniversityBySchoolId(major.school.id);
                const slug = getUniversitySlug(major.school.id) ?? major.school.id;
                const cutOff = formatCutOff(major);
                const place = formatMajorPlace(major.faculty, university?.short ?? major.school.name);

                return (
                  // The name's link covers the card; the bookmark sits above it.
                  <li
                    key={major.id}
                    className="group relative flex items-start gap-3 rounded-2xl border border-border-ink bg-card p-4 transition-[border-color,box-shadow] duration-200 hover:border-ink/25 hover:shadow-lift"
                  >
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold leading-snug text-ink">
                        <Link
                          href={`/university/${slug}`}
                          className="after:absolute after:inset-0 after:rounded-2xl after:content-[''] group-hover:text-accent"
                        >
                          {major.name}
                        </Link>
                      </h3>
                      {(place || major.category) && (
                        <p className="mt-0.5 text-[15px] leading-snug text-ink-3">
                          {[place, major.category].filter(Boolean).join(" · ")}
                        </p>
                      )}
                      <div className="mt-2.5 flex flex-wrap gap-2 text-sm font-bold text-ink-2">
                        {cutOff != null && (
                          <span className="rounded-lg bg-ink/[0.06] px-2.5 py-1">Босго: {cutOff}</span>
                        )}
                        {major.tuitionFee != null && (
                          <span className="rounded-lg bg-ink/[0.06] px-2.5 py-1">{formatMajorTuition(major)}</span>
                        )}
                      </div>
                    </div>
                    <div className="relative z-10">
                      <MajorBookmarkButton
                        majorId={major.id}
                        initialSaved={major.isSaved}
                        majorName={major.name}
                        size="sm"
                        className="h-10 w-10"
                      />
                    </div>
                  </li>
                );
              })}
            </ul>

            <MajorNotes majors={data.majors.items} />
            <Pager page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
