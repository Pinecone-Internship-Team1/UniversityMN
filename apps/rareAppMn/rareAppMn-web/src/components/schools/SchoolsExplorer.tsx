"use client";

import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery } from "urql";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SchoolCardSkeletonGrid } from "@/components/ui/Skeleton";
import { Input } from "@/components/ui/Input";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  SCHOOLS_QUERY,
  type SchoolsQueryResult,
  type SchoolsQueryVariables,
} from "@/lib/graphql/documents";
import type { SchoolFilterInput } from "@/lib/graphql/types";
import { cn } from "@/lib/utils";
import { SchoolCard } from "./SchoolCard";

const PAGE_SIZE = 9;

interface FilterState {
  search: string;
  location: string;
  maxTuitionFee: string;
  dormAvailable: boolean;
  scholarshipAvailable: boolean;
}

const INITIAL_FILTERS: FilterState = {
  search: "",
  location: "",
  maxTuitionFee: "",
  dormAvailable: false,
  scholarshipAvailable: false,
};

function buildFilter(filters: FilterState, page: number): SchoolFilterInput {
  const filter: SchoolFilterInput = {
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  };
  if (filters.search.trim()) filter.search = filters.search.trim();
  if (filters.location.trim()) filter.location = filters.location.trim();
  if (filters.dormAvailable) filter.dormAvailable = true;
  if (filters.scholarshipAvailable) filter.scholarshipAvailable = true;
  const maxTuition = Number(filters.maxTuitionFee);
  if (filters.maxTuitionFee.trim() && Number.isFinite(maxTuition) && maxTuition > 0) {
    filter.maxTuitionFee = maxTuition * 1_000_000;
  }
  return filter;
}

export function SchoolsExplorer() {
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const debouncedFilters = useDebouncedValue(filters, 350);

  const variables = useMemo<SchoolsQueryVariables>(
    () => ({ filter: buildFilter(debouncedFilters, page) }),
    [debouncedFilters, page],
  );

  const [{ data, fetching, error }, reexecuteQuery] = useQuery<
    SchoolsQueryResult,
    SchoolsQueryVariables
  >({ query: SCHOOLS_QUERY, variables });

  function updateFilter<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  }

  const pageInfo = data?.schools.pageInfo;
  const totalPages = pageInfo ? Math.max(1, Math.ceil(pageInfo.totalCount / PAGE_SIZE)) : 1;
  const hasActiveFilters =
    filters.search || filters.location || filters.maxTuitionFee || filters.dormAvailable || filters.scholarshipAvailable;

  return (
    <div>
      {/* Search bar + filter toggle */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
          <Input
            value={filters.search}
            onChange={(event) => updateFilter("search", event.target.value)}
            placeholder="Сургуулийн нэрээр хайх..."
            className="pl-11"
            aria-label="Сургуулийн нэрээр хайх"
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

      {/* Filter panel */}
      {filtersOpen && (
        <div className="mt-4 grid gap-4 rounded-2xl border border-ink/10 bg-card p-5 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink/70">
            Байршил
            <Input
              value={filters.location}
              onChange={(event) => updateFilter("location", event.target.value)}
              placeholder="жишээ: Сүхбаатар дүүрэг"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink/70">
            Дээд сургалтын төлбөр (сая ₮)
            <Input
              type="number"
              min={0}
              inputMode="decimal"
              value={filters.maxTuitionFee}
              onChange={(event) => updateFilter("maxTuitionFee", event.target.value)}
              placeholder="жишээ: 5"
            />
          </label>
          <div className="flex flex-col gap-2.5 text-xs font-semibold text-ink/70">
            <span>Нэмэлт</span>
            <label className="flex items-center gap-2 font-medium text-ink/80">
              <input
                type="checkbox"
                checked={filters.dormAvailable}
                onChange={(event) => updateFilter("dormAvailable", event.target.checked)}
                className="h-4 w-4 accent-accent"
              />
              Дотуур байртай
            </label>
            <label className="flex items-center gap-2 font-medium text-ink/80">
              <input
                type="checkbox"
                checked={filters.scholarshipAvailable}
                onChange={(event) => updateFilter("scholarshipAvailable", event.target.checked)}
                className="h-4 w-4 accent-accent"
              />
              Тэтгэлэгтэй
            </label>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="mt-8">
        {error ? (
          <ErrorState onRetry={() => reexecuteQuery({ requestPolicy: "network-only" })} />
        ) : fetching && !data ? (
          <SchoolCardSkeletonGrid count={PAGE_SIZE} />
        ) : !data || data.schools.items.length === 0 ? (
          <EmptyState
            title="Тохирох сургууль олдсонгүй"
            description="Хайлт эсвэл шүүлтүүрээ өөрчилж дахин оролдоно уу."
          />
        ) : (
          <>
            <p className="mb-5 text-xs font-semibold uppercase tracking-wider text-ink/50">
              {data.schools.pageInfo.totalCount} сургууль олдлоо
            </p>
            <div
              className={cn(
                "grid grid-cols-1 gap-5 transition-opacity duration-200 sm:grid-cols-2 lg:grid-cols-3",
                fetching && "opacity-50",
              )}
            >
              {data.schools.items.map((school) => (
                <SchoolCard key={school.id} school={school} className="w-full" />
              ))}
            </div>

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
