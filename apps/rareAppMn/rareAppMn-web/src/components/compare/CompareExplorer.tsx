"use client";

import { ArrowDown, GraduationCap, MoveHorizontal, Scale, School, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "urql";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { MAX_COMPARE_ITEMS, compareHref, type CompareMode } from "@/lib/compare";
import {
  examSubjectLines,
  formatAmount,
  formatAvailability,
  formatDegreeType,
  formatMajorPlace,
  formatMajorTuition,
  formatSchoolTuition,
  formatCutOff,
} from "@/lib/format";
import {
  COMPARE_ITEMS_QUERY,
  type CompareItemsResult,
  type CompareItemsVariables,
  type CompareMajor,
  type CompareSchool,
} from "@/lib/graphql/documents";
import { getErrorMessage } from "@/lib/graphql/errors";
import { getUniversityBySchoolId, getUniversitySlug } from "@/lib/university-logos";
import { MajorPicker } from "./MajorPicker";
import {
  SchoolCardPicker,
  SchoolCardPickerSkeleton,
  SchoolOptionsState,
  useSchoolOptions,
} from "./SchoolOptions";

export interface CompareExplorerProps {
  mode: CompareMode;
  ids: string[];
}

interface Selection {
  mode: CompareMode;
  ids: string[];
}

interface CompareRow<T> {
  label: string;
  render: (item: T) => ReactNode;
}

const MODES: TabItem<CompareMode>[] = [
  { id: "schools", label: "Сургууль", icon: School },
  { id: "majors", label: "Мэргэжил", icon: GraduationCap },
];

/** The table shows once this many are picked. */
const MIN_COMPARE_ITEMS = 2;

function schoolShortName(school: { id: string; name: string }): string {
  return getUniversityBySchoolId(school.id)?.short ?? school.name;
}

function universityHref(school: { id: string }): string {
  return `/university/${getUniversitySlug(school.id) ?? school.id}`;
}

const SCHOOL_ROWS: CompareRow<CompareSchool>[] = [
  { label: "Байршил", render: (school) => school.location ?? "—" },
  { label: "Сургалтын төлбөр", render: (school) => formatSchoolTuition(school) },
  { label: "Мэргэжлийн тоо", render: (school) => school.majors.length },
  {
    label: "Дотуур байр",
    render: (school) => {
      if (!school.dormAvailable) return formatAvailability(school.dormAvailable);
      const cheapest = (pick: (dormitory: CompareSchool["dormitories"][number]) => number | null) => {
        const fees = school.dormitories
          .filter((dormitory) => !dormitory.currency || dormitory.currency === "MNT")
          .map(pick)
          .filter((fee): fee is number => fee != null);
        return fees.length > 0 ? Math.min(...fees) : null;
      };
      const monthly = cheapest((dormitory) => dormitory.feePerMonth);
      if (monthly != null) return `Боломжтой · ${formatAmount(monthly)}/сар`;
      const yearly = cheapest((dormitory) => dormitory.feePerYear);
      return yearly != null ? `Боломжтой · ${formatAmount(yearly)}/жилээс` : "Боломжтой";
    },
  },
  {
    label: "Тэтгэлэг",
    render: (school) =>
      school.scholarshipAvailable
        ? `Боломжтой (${school.scholarships.length})`
        : formatAvailability(school.scholarshipAvailable),
  },
  {
    label: "Вэбсайт",
    render: (school) =>
      school.website ? (
        <a
          href={school.website}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-accent hover:underline max-lg:tap-target"
        >
          Нээх
        </a>
      ) : (
        "—"
      ),
  },
];

const MAJOR_ROWS: CompareRow<CompareMajor>[] = [
  {
    label: "Сургууль",
    render: (major) => (
      <Link href={universityHref(major.school)} className="font-semibold hover:text-accent max-lg:tap-target">
        {schoolShortName(major.school)}
      </Link>
    ),
  },
  { label: "Чиглэл", render: (major) => major.category ?? "—" },
  { label: "Зэрэг", render: (major) => formatDegreeType(major.degreeType) ?? "—" },
  { label: "Босго оноо", render: (major) => formatCutOff(major) ?? "—" },
  {
    label: "Шалгалтын хичээл",
    render: (major) => {
      const exams = examSubjectLines(major);
      if (exams.length === 0 && !major.examNote) return "—";
      return (
        <>
          {exams.map((exam) => (
            <span key={exam.label} className="block">
              {exam.label}: {exam.text}
            </span>
          ))}
          {major.examNote && <span className="block text-ink-3">{major.examNote}</span>}
        </>
      );
    },
  },
  { label: "Сургалтын төлбөр", render: (major) => formatMajorTuition(major) },
];

function CompareTable<T extends { id: string }>({
  items,
  rows,
  title,
  onRemove,
}: {
  items: T[];
  rows: CompareRow<T>[];
  title: (item: T) => ReactNode;
  onRemove: (id: string) => void;
}) {
  return (
    <div>
      {/* The table scrolls inside its frame (never the page); the first column stays put. */}
      <p className="mb-2 flex items-center gap-1.5 text-sm text-ink-3 lg:hidden">
        <MoveHorizontal className="h-4 w-4" aria-hidden="true" />
        Хүснэгтийг хажуу тийш гүйлгэж харна уу
      </p>
      <div className="overflow-x-auto overscroll-x-contain rounded-2xl border border-border-ink bg-card" tabIndex={0} role="region" aria-label="Харьцуулах хүснэгт">
      <table className="w-full min-w-[560px] border-collapse text-left text-[15px]">
        <thead>
          <tr className="border-b border-border-ink">
            <th className="sticky left-0 z-10 w-28 bg-card p-3 text-sm font-bold text-ink-3 shadow-[1px_0_0_var(--border-ink)] sm:w-40 sm:p-4 lg:static lg:z-auto lg:bg-transparent lg:shadow-none">
              Үзүүлэлт
            </th>
            {items.map((item) => (
              <th key={item.id} className="min-w-40 p-3 align-top sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 text-base font-bold text-ink">{title(item)}</div>
                  <button
                    type="button"
                    onClick={() => onRemove(item.id)}
                    aria-label="Харьцуулалтаас хасах"
                    className="-mt-1 -mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-destructive/10 hover:text-destructive max-lg:tap-target"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-border-ink last:border-b-0">
              <th className="sticky left-0 z-10 bg-card p-3 text-[15px] font-bold text-ink-3 shadow-[1px_0_0_var(--border-ink)] sm:p-4 lg:static lg:z-auto lg:bg-transparent lg:shadow-none">
                {row.label}
              </th>
              {items.map((item) => (
                <td key={item.id} className="p-3 align-top text-[15px] text-ink-2 sm:p-4">
                  {row.render(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}

export function CompareExplorer({ mode, ids }: CompareExplorerProps) {
  const router = useRouter();
  const [selection, setSelection] = useState<Selection>({ mode, ids });
  const [syncedProps, setSyncedProps] = useState<Selection>({ mode, ids });
  if (syncedProps.mode !== mode || syncedProps.ids.join(",") !== ids.join(",")) {
    setSyncedProps({ mode, ids });
    setSelection({ mode, ids });
  }

  const schoolOptions = useSchoolOptions();
  const isFull = selection.ids.length >= MAX_COMPARE_ITEMS;
  const canCompare = selection.ids.length >= MIN_COMPARE_ITEMS;
  const noun = selection.mode === "schools" ? "сургууль" : "мэргэжил";

  const [compareResult, reexecuteCompare] = useQuery<CompareItemsResult, CompareItemsVariables>({
    query: COMPARE_ITEMS_QUERY,
    variables: {
      ids: selection.ids,
      type: selection.mode === "schools" ? "SCHOOL" : "MAJOR",
    },
    pause: selection.ids.length === 0,
  });

  function update(next: Selection) {
    setSelection(next);
    router.replace(compareHref(next.mode, next.ids), { scroll: false });
  }

  const compareItems = compareResult.data?.compareItems ?? [];
  const compareSettled = !compareResult.fetching && !compareResult.stale && !compareResult.error;

  useEffect(() => {
    if (!compareSettled || !compareResult.data || selection.ids.length === 0) return;
    const foundIds = compareResult.data.compareItems.map((item) => item.id);
    if (!foundIds.every((id) => selection.ids.includes(id))) return;
    if (foundIds.length < selection.ids.length) {
      const remaining = selection.ids.filter((id) => foundIds.includes(id));
      setSelection({ mode: selection.mode, ids: remaining });
      router.replace(compareHref(selection.mode, remaining), { scroll: false });
    }
  }, [compareSettled, compareResult.data, selection, router]);

  const schools = compareItems.filter(
    (item): item is CompareSchool => item.__typename === "School",
  );
  const majors = compareItems.filter(
    (item): item is CompareMajor => item.__typename === "Major",
  );
  const remove = (id: string) =>
    update({ mode: selection.mode, ids: selection.ids.filter((current) => current !== id) });
  const toggle = (id: string) => {
    if (selection.ids.includes(id)) remove(id);
    else if (!isFull) update({ mode: selection.mode, ids: [...selection.ids, id] });
  };
  // Picked majors in pick order, for the chips above the list.
  const pickedMajors = selection.ids
    .map((id) => majors.find((major) => major.id === id))
    .filter((major): major is CompareMajor => major !== undefined);

  return (
    <div>
      <Tabs
        items={MODES}
        value={selection.mode}
        onChange={(next) => {
          if (next !== selection.mode) update({ mode: next, ids: [] });
        }}
        label="Юуг харьцуулах вэ"
        fullWidth
        className="sm:inline-flex sm:w-auto"
      />

      <div className="mt-6 rounded-2xl border border-border-ink bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <p className="text-sm font-bold text-ink" aria-live="polite">
            {selection.ids.length}/{MAX_COMPARE_ITEMS} сонгосон
          </p>
          <div className="flex items-center gap-4">
            {selection.ids.length > 0 && (
              <button
                type="button"
                onClick={() => update({ mode: selection.mode, ids: [] })}
                className="text-[15px] font-semibold text-ink-3 hover:text-ink max-lg:tap-target"
              >
                Бүгдийг арилгах
              </button>
            )}
            {canCompare && (
              <a
                href="#compare-table"
                className="inline-flex items-center gap-1 text-[15px] font-bold text-accent hover:underline max-lg:tap-target lg:hidden"
              >
                Харьцуулалт
                <ArrowDown className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>
        <p className="mt-1 text-[15px] text-ink-3">
          {isFull
            ? `Дээд тал нь ${MAX_COMPARE_ITEMS}. Өөрийг сонгох бол нэгийг нь хасна уу.`
            : selection.mode === "schools"
              ? "Сургуулиа товшиж сонгоно, дахин товшвол хасна."
              : "Мэргэжлээ товшиж сонгоно, аль ч сургуулиас холиж болно."}
        </p>

        {selection.mode === "majors" && pickedMajors.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2" aria-label="Сонгосон мэргэжлүүд">
            {pickedMajors.map((major) => (
              <li
                key={major.id}
                title={`${major.name} · ${formatMajorPlace(major.faculty, schoolShortName(major.school))}`}
                className="flex min-w-0 max-w-full items-center gap-1 rounded-full border border-accent bg-accent-soft py-1 pl-3 pr-1 text-[15px] font-semibold text-ink"
              >
                <span className="truncate">
                  {major.name}
                  <span className="font-normal text-ink-3">
                    {" · "}
                    {formatMajorPlace(major.faculty, schoolShortName(major.school))}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => remove(major.id)}
                  aria-label={`${major.name}-г хасах`}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-ink-3 transition-colors hover:bg-destructive/10 hover:text-destructive max-lg:tap-target"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4">
          {selection.mode === "schools" ? (
            <SchoolOptionsState
              fetching={schoolOptions.fetching}
              error={schoolOptions.error}
              retry={schoolOptions.retry}
              skeleton={<SchoolCardPickerSkeleton />}
            >
              <SchoolCardPicker
                options={schoolOptions.options}
                selectedIds={selection.ids}
                full={isFull}
                onToggle={toggle}
              />
            </SchoolOptionsState>
          ) : (
            <MajorPicker
              schools={schoolOptions}
              selectedIds={selection.ids}
              full={isFull}
              onToggle={toggle}
            />
          )}
        </div>
      </div>

      <div id="compare-table" className="mt-8 scroll-mt-24">
        {!canCompare ? (
          <div className="flex items-center gap-3 rounded-2xl border border-dashed border-ink/15 px-5 py-6 text-sm text-ink-3">
            <Scale className="h-5 w-5 shrink-0 text-ink-3" />
            {selection.ids.length === 0
              ? `${MIN_COMPARE_ITEMS}-${MAX_COMPARE_ITEMS} ${noun} сонгоход харьцуулалт энд гарна.`
              : `Дахиад нэг ${noun} сонгоход харьцуулалт энд гарна.`}
          </div>
        ) : compareResult.error ? (
          <ErrorState
            description={getErrorMessage(compareResult.error)}
            onRetry={() => reexecuteCompare({ requestPolicy: "network-only" })}
          />
        ) : compareResult.fetching && compareItems.length === 0 ? (
          <Skeleton className="h-72 w-full rounded-2xl" />
        ) : selection.mode === "schools" ? (
          <CompareTable
            items={schools}
            rows={SCHOOL_ROWS}
            onRemove={remove}
            title={(school) => (
              <Link
                href={universityHref(school)}
                className="hover:text-accent max-lg:tap-target"
              >
                {schoolShortName(school)}
              </Link>
            )}
          />
        ) : (
          <CompareTable
            items={majors}
            rows={MAJOR_ROWS}
            onRemove={remove}
            title={(major) => (
              <>
                {major.name}
                <span className="mt-0.5 block text-sm font-normal text-ink-3">
                  {formatMajorPlace(major.faculty, schoolShortName(major.school))}
                </span>
              </>
            )}
          />
        )}
      </div>
    </div>
  );
}
