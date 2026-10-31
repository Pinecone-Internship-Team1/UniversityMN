"use client";

import { useMemo, useState } from "react";
import { useQuery } from "urql";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { SchoolCardSkeletonGrid } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  SCHOOLS_QUERY,
  type SchoolsQueryResult,
  type SchoolsQueryVariables,
} from "@/lib/graphql/documents";
import type { SchoolFilterInput } from "@/lib/graphql/types";
import { cn } from "@/lib/utils";
import { CheckboxField, Filters, Pager, ResultCount, SearchField } from "./ExplorerParts";
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

  const activeCount = [
    filters.location,
    filters.maxTuitionFee,
    filters.dormAvailable,
    filters.scholarshipAvailable,
  ].filter(Boolean).length;

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
          placeholder="МУИС, shutis…"
          label="Сургуулийн нэрээр хайх"
        />
        <Filters
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          activeCount={activeCount}
          resultCount={pageInfo?.totalCount ?? null}
          onClear={clearFilters}
        >
          <Field label="Байршил" htmlFor="filter-location">
            <Input
              id="filter-location"
              value={filters.location}
              onChange={(event) => updateFilter("location", event.target.value)}
              placeholder="жишээ: Сүхбаатар дүүрэг"
            />
          </Field>
          <Field label="Жилийн төлбөр хүртэл (сая ₮)" htmlFor="filter-tuition">
            <Input
              id="filter-tuition"
              type="number"
              min={0}
              inputMode="decimal"
              value={filters.maxTuitionFee}
              onChange={(event) => updateFilter("maxTuitionFee", event.target.value)}
              placeholder="жишээ: 5"
            />
          </Field>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1.5 text-[15px] font-bold text-ink">Нэмэлт</legend>
            <CheckboxField
              label="Дотуур байртай"
              checked={filters.dormAvailable}
              onChange={(checked) => updateFilter("dormAvailable", checked)}
            />
            <CheckboxField
              label="Тэтгэлэгтэй"
              checked={filters.scholarshipAvailable}
              onChange={(checked) => updateFilter("scholarshipAvailable", checked)}
            />
          </fieldset>
        </Filters>
      </div>

      <div className="mt-6">
        {error ? (
          <ErrorState onRetry={() => reexecuteQuery({ requestPolicy: "network-only" })} />
        ) : fetching && !data ? (
          <SchoolCardSkeletonGrid count={6} />
        ) : !data || data.schools.items.length === 0 ? (
          <EmptyState
            title="Тохирох сургууль олдсонгүй"
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
            <ResultCount>{data.schools.pageInfo.totalCount} сургууль олдлоо</ResultCount>
            <ul
              className={cn(
                "grid grid-cols-1 gap-3 transition-opacity duration-200 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3",
                fetching && "opacity-60",
              )}
            >
              {data.schools.items.map((school) => (
                <li key={school.id}>
                  <SchoolCard school={school} className="h-full" />
                </li>
              ))}
            </ul>
            <Pager page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
