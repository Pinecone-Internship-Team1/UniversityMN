"use client";

import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "urql";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatMajorTuition } from "@/lib/format";
import {
  MAJORS_QUERY,
  type MajorsQueryResult,
  type MajorsQueryVariables,
} from "@/lib/graphql/documents";
import type { MajorFilterInput } from "@/lib/graphql/types";
import { getUniversityByFullName, getUniversitySlug } from "@/lib/university-logos";
import { cn } from "@/lib/utils";
import { MajorBookmarkButton } from "./MajorBookmarkButton";
import { MajorNotes } from "./MajorNotes";

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
    <div className="flex items-center justify-between gap-4 rounded-xl border border-ink/10 bg-card p-4">
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
  );
}

export function MajorsExplorer() {
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
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

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
          <Input
            value={filters.search}
            onChange={(event) => updateFilter("search", event.target.value)}
            placeholder="Мэргэжлийн нэрээр хайх..."
            className="pl-11"
            aria-label="Мэргэжлийн нэрээр хайх"
          />
        </div>
        <button
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          className={cn(
            "inline-flex items-center justify-center gap-2 rounded-xl border px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-colors sm:w-auto",
            filtersOpen || hasActiveFilters
              ? "border-accent bg-accent-soft text-accent"
              : "border-ink/15 text-ink hover:border-ink",
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Шүүлтүүр
        </button>
      </div>

      {filtersOpen && (
        <div className="mt-4 grid gap-4 rounded-2xl border border-ink/10 bg-card p-5 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink/70">
            Чиглэл
            <Input
              value={filters.category}
              onChange={(event) => updateFilter("category", event.target.value)}
              placeholder="жишээ: Инженерчлэл"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink/70">
            ЭЕШ доод оноо
            <Input
              type="number"
              min={0}
              max={800}
              value={filters.minCutOffScore}
              onChange={(event) => updateFilter("minCutOffScore", event.target.value)}
              placeholder="жишээ: 500"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink/70">
            ЭЕШ дээд оноо
            <Input
              type="number"
              min={0}
              max={800}
              value={filters.maxCutOffScore}
              onChange={(event) => updateFilter("maxCutOffScore", event.target.value)}
              placeholder="жишээ: 650"
            />
          </label>
        </div>
      )}

      <div className="mt-8">
        {error ? (
          <ErrorState onRetry={() => reexecuteQuery({ requestPolicy: "network-only" })} />
        ) : fetching && !data ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <MajorResultSkeleton key={i} />
            ))}
          </div>
        ) : !data || data.majors.items.length === 0 ? (
          <EmptyState
            title="Тохирох мэргэжил олдсонгүй"
            description="Хайлт эсвэл шүүлтүүрээ өөрчилж дахин оролдоно уу."
          />
        ) : (
          <>
            <p className="mb-5 text-xs font-semibold uppercase tracking-wider text-ink/50">
              {data.majors.pageInfo.totalCount} мэргэжил олдлоо
            </p>
            <div
              className={cn(
                "space-y-3 transition-opacity duration-200",
                fetching && "opacity-50",
              )}
            >
              {data.majors.items.map((major) => {
                const university = getUniversityByFullName(major.school.name);
                const slug = getUniversitySlug(major.school.name) ?? major.school.id;

                return (
                  <Link
                    key={major.id}
                    href={`/university/${slug}`}
                    className="group flex items-center justify-between gap-4 rounded-xl border border-ink/10 bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink transition-colors group-hover:text-accent">
                        {major.name}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-ink/60">
                        {university?.short ?? major.school.name}
                        {major.category ? ` · ${major.category}` : ""}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold text-ink/70">
                        {major.cutOffScore != null && (
                          <span className="rounded-full bg-ink/5 px-2.5 py-1">
                            Босго оноо: {major.cutOffScore}
                          </span>
                        )}
                        {major.tuitionFee != null && (
                          <span className="rounded-full bg-ink/5 px-2.5 py-1">
                            {formatMajorTuition(major)}
                          </span>
                        )}
                      </div>
                    </div>
                    <MajorBookmarkButton
                      majorId={major.id}
                      initialSaved={major.isSaved}
                      majorName={major.name}
                      size="sm"
                    />
                  </Link>
                );
              })}
            </div>

            <MajorNotes majors={data.majors.items} />

            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1}
                  aria-label="Өмнөх хуудас"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:border-ink hover:bg-ink/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs font-bold uppercase tracking-wider text-ink/60">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={page >= totalPages}
                  aria-label="Дараагийн хуудас"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:border-ink hover:bg-ink/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
