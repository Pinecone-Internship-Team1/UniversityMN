"use client";

import { Check, Plus, Search, X } from "lucide-react";
import { useState } from "react";
import { useQuery } from "urql";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatDegreeType, formatMajorPlace } from "@/lib/format";
import {
  COMPARE_SCHOOL_MAJORS_QUERY,
  MAJORS_QUERY,
  type CompareSchoolMajorsResult,
  type CompareSchoolMajorsVariables,
  type MajorsQueryResult,
  type MajorsQueryVariables,
} from "@/lib/graphql/documents";
import { getErrorMessage } from "@/lib/graphql/errors";
import { cn } from "@/lib/utils";
import {
  SchoolChips,
  SchoolChipsSkeleton,
  SchoolOptionsState,
  type SchoolOptions,
} from "./SchoolOptions";

/** Search results shown at first across every university, and how many more a tap adds. */
const ALL_MAJORS_PAGE = 20;
/** The API's page limit. */
const MAX_ALL_MAJORS = 100;
/** One university's majors shown at first (МУИС has 300+), and how many more a tap adds. */
const SCHOOL_MAJORS_PAGE = 20;

interface MajorRow {
  id: string;
  name: string;
  detail: string | null;
}

interface MajorPickerProps {
  schools: SchoolOptions;
  selectedIds: string[];
  full: boolean;
  onToggle: (id: string) => void;
}

/**
 * University chips plus a search box: with "Бүх сургууль" the box searches
 * every major; with a university it lists that university's majors and the
 * box filters them. Rows toggle like the school cards.
 */
export function MajorPicker({ schools, selectedIds, full, onToggle }: MajorPickerProps) {
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const query = useDebouncedValue(search.trim(), 300);
  const school = schools.options.find((option) => option.id === schoolId) ?? null;

  const listKey = `${schoolId ?? ""}|${query}`;
  const pageSize = schoolId ? SCHOOL_MAJORS_PAGE : ALL_MAJORS_PAGE;
  const [shown, setShown] = useState({ key: listKey, count: pageSize });
  const visible = shown.key === listKey ? shown.count : pageSize;

  const [allMajors] = useQuery<MajorsQueryResult, MajorsQueryVariables>({
    query: MAJORS_QUERY,
    variables: { filter: { search: query, limit: Math.min(visible, MAX_ALL_MAJORS) } },
    pause: schoolId !== null || !query,
  });
  const [schoolMajors] = useQuery<CompareSchoolMajorsResult, CompareSchoolMajorsVariables>({
    query: COMPARE_SCHOOL_MAJORS_QUERY,
    variables: { id: schoolId ?? "", ...(query ? { search: query } : {}) },
    pause: schoolId === null,
  });

  const shortName = (id: string, fallback: string) =>
    schools.options.find((option) => option.id === id)?.short ?? fallback;
  const result = schoolId ? schoolMajors : allMajors;
  let rows: MajorRow[] = [];
  let total = 0;
  if (schoolId) {
    // A search comes back best match first; the full list reads best A–Я.
    const found = schoolMajors.data?.school?.majors ?? [];
    const majors = query ? found : [...found].sort((a, b) => a.name.localeCompare(b.name, "mn"));
    total = majors.length;
    rows = majors.slice(0, visible).map((major) => ({
      id: major.id,
      name: major.name,
      detail: [formatMajorPlace(major.faculty), formatDegreeType(major.degreeType)]
        .filter(Boolean)
        .join(" · "),
    }));
  } else if (query) {
    total = allMajors.data?.majors.pageInfo.totalCount ?? 0;
    rows = (allMajors.data?.majors.items ?? []).map((major) => ({
      id: major.id,
      name: major.name,
      detail: [
        formatMajorPlace(major.faculty, shortName(major.school.id, major.school.name)),
        formatDegreeType(major.degreeType),
      ]
        .filter(Boolean)
        .join(" · "),
    }));
  }
  const canShowMore = rows.length < total && (schoolId !== null || visible < MAX_ALL_MAJORS);

  return (
    <div className="space-y-4">
      <SchoolOptionsState
        fetching={schools.fetching}
        error={schools.error}
        retry={schools.retry}
        skeleton={<SchoolChipsSkeleton />}
      >
        <SchoolChips options={schools.options} activeId={schoolId} onChange={setSchoolId} />
      </SchoolOptionsState>

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={school ? "Хайх: программ хангамж, huuli…" : "Хайх: muis, программ хангамж…"}
          aria-label={school ? `${school.short}-ийн мэргэжлээс хайх` : "Мэргэжил хайх"}
          className="pl-11 pr-10"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            aria-label="Хайлтыг цэвэрлэх"
            className="absolute right-3 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-ink-3 hover:bg-ink/[0.06] hover:text-ink max-lg:tap-area"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {!schoolId && !query ? (
        <p className="text-[15px] leading-relaxed text-ink-3">
          Дээрээс сургуулиа сонгоод жагсаалтаас нь сонгоорой, эсвэл бүх сургуулийн мэргэжлээс
          хайгаарай. Латин үсгээр бичиж болно: “muis”, “programm hangamj”.
        </p>
      ) : result.error ? (
        <p className="text-[15px] font-medium text-destructive">{getErrorMessage(result.error)}</p>
      ) : result.fetching && !result.data ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="text-[15px] text-ink-3">
          {query ? `“${query}” олдсонгүй.` : "Энэ сургуульд мэргэжил бүртгэгдээгүй байна."}
        </p>
      ) : (
        <div className={cn("transition-opacity duration-200", result.fetching && "opacity-60")}>
          <p className="mb-2 text-sm font-semibold text-ink-3">
            {school ? `${school.short} · ` : ""}
            {total} мэргэжил{query ? " олдлоо" : ""}
          </p>
          <ul className="space-y-2">
            {rows.map((row) => {
              const selected = selectedIds.includes(row.id);
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    disabled={!selected && full}
                    onClick={() => onToggle(row.id)}
                    className={cn(
                      "flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border px-4 py-2.5 text-left transition-colors duration-150",
                      selected
                        ? "border-accent bg-accent-soft"
                        : "border-border-ink bg-paper hover:border-ink/30",
                      "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border-ink",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-ink">{row.name}</span>
                      {row.detail && (
                        <span className="mt-0.5 block text-[15px] text-ink-3">{row.detail}</span>
                      )}
                    </span>
                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-sm font-bold",
                        selected
                          ? "border-accent bg-accent text-accent-foreground"
                          : "border-ink/20 text-ink",
                      )}
                    >
                      {selected ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                      {selected ? "Сонгосон" : "Нэмэх"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {canShowMore && (
            <button
              type="button"
              onClick={() => setShown({ key: listKey, count: visible + pageSize })}
              className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-dashed border-ink/20 text-[15px] font-bold text-ink-2 transition-colors hover:border-ink/40 hover:text-ink lg:min-h-10"
            >
              Дахиад харах ({total - rows.length} үлдсэн)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
