"use client";

import { useState } from "react";
import { useQuery } from "urql";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDateMn } from "@/lib/format";
import {
  SITE_STATS_QUERY,
  type SiteStatsResult,
  type SiteStatsVariables,
} from "@/lib/graphql/documents";
import { getErrorMessage } from "@/lib/graphql/errors";
import type { DailyVisits, PageVisits } from "@/lib/graphql/types";
import { UNIVERSITIES } from "@/lib/university-logos";
import { cn } from "@/lib/utils";

const RANGES = [
  { days: 7, label: "7 хоног" },
  { days: 30, label: "30 хоног" },
  { days: 90, label: "90 хоног" },
];

const PAGE_LABELS: Record<string, string> = {
  "/": "Нүүр хуудас",
  "/schools": "Сургуулиуд",
  "/scholarships": "Тэтгэлэг",
  "/admissions": "Элсэлт",
  "/compare": "Харьцуулах",
  "/profile": "Миний профайл",
  "/profile/account": "Бүртгэлийн тохиргоо",
  "/sign-in": "Нэвтрэх",
  "/sign-up": "Бүртгүүлэх",
};

const PLOT_HEIGHT = 220;

function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

/** "2026-10-19" -> "10.19" for the x-axis. */
function shortDay(day: string): string {
  return `${day.slice(5, 7)}.${day.slice(8, 10)}`;
}

function pageLabel(path: string): string {
  const known = PAGE_LABELS[path];
  if (known) return known;
  const university = /^\/university\/([^/]+)$/.exec(path);
  if (university?.[1]) return UNIVERSITIES[university[1]]?.short ?? "Сургуулийн хуудас";
  return path;
}

/** A y-axis top and its ticks on clean whole-number steps (0, step, 2·step, …). */
function yScale(max: number): { top: number; ticks: number[] } {
  if (max <= 4) return { top: 4, ticks: [0, 1, 2, 3, 4] };
  const rough = max / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const fraction = rough / magnitude;
  const step = (fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10) * magnitude;
  const steps = Math.ceil(max / step);
  return { top: steps * step, ticks: Array.from({ length: steps + 1 }, (_, i) => i * step) };
}

function StatTile({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-card p-4 sm:p-5">
      <p className="text-xs font-semibold text-ink/60">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">{value}</p>
      <p className="mt-1 text-xs text-ink/50">{note}</p>
    </div>
  );
}

function DailyVisitsChart({ daily }: { daily: DailyVisits[] }) {
  const [active, setActive] = useState<number | null>(null);
  const { top, ticks } = yScale(Math.max(0, ...daily.map((d) => d.views)));
  const count = daily.length;
  const activeDay = active !== null ? daily[active] : undefined;
  const axisDays = [0, Math.floor((count - 1) / 2), count - 1].filter(
    (index, i, all) => all.indexOf(index) === i,
  );

  return (
    <div className="flex">
      {/* Y axis */}
      <div className="relative w-9 shrink-0" style={{ height: PLOT_HEIGHT }} aria-hidden="true">
        {ticks.map((tick) => (
          <span
            key={tick}
            className="absolute right-2 translate-y-1/2 text-[11px] tabular-nums text-ink/50"
            style={{ bottom: `${(tick / top) * 100}%` }}
          >
            {formatCount(tick)}
          </span>
        ))}
      </div>

      <div className="min-w-0 flex-1">
        <div className="relative" style={{ height: PLOT_HEIGHT }}>
          {ticks.map((tick) => (
            <span
              key={tick}
              className="absolute inset-x-0 border-t border-ink/10"
              style={{ bottom: `${(tick / top) * 100}%` }}
              aria-hidden="true"
            />
          ))}

          <div className="absolute inset-0 flex items-end gap-[2px]" onMouseLeave={() => setActive(null)}>
            {daily.map((day, index) => (
              <button
                key={day.day}
                type="button"
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                onBlur={() => setActive(null)}
                aria-label={`${formatDateMn(day.day)}: ${day.views} хандалт, ${day.visitors} зочин`}
                className="flex h-full min-w-0 flex-1 items-end justify-center outline-none"
              >
                <span
                  className={cn(
                    "w-full max-w-6 rounded-t-[4px] bg-accent transition-opacity",
                    active !== null && active !== index && "opacity-55",
                  )}
                  style={{ height: `${(day.views / top) * 100}%` }}
                />
              </button>
            ))}
          </div>

          {activeDay && active !== null && (
            <div
              className={cn(
                "pointer-events-none absolute top-0 z-10 rounded-lg border border-ink/10 bg-card px-3 py-2 shadow-sm",
                active < count * 0.2
                  ? "translate-x-0"
                  : active > count * 0.8
                    ? "-translate-x-full"
                    : "-translate-x-1/2",
              )}
              style={{ left: `${((active + 0.5) / count) * 100}%` }}
            >
              <p className="whitespace-nowrap text-sm font-bold text-ink">
                {formatCount(activeDay.views)} хандалт
              </p>
              <p className="whitespace-nowrap text-xs text-ink/70">
                {formatCount(activeDay.visitors)} зочин
              </p>
              <p className="mt-0.5 whitespace-nowrap text-[11px] text-ink/50">
                {formatDateMn(activeDay.day)}
              </p>
            </div>
          )}
        </div>

        {/* X axis: first, middle and last day */}
        <div className="relative mt-2 h-4 text-[11px] tabular-nums text-ink/50" aria-hidden="true">
          {axisDays.map((index, i) => (
            <span
              key={index}
              className={cn(
                "absolute",
                i === 0 ? "left-0" : i === axisDays.length - 1 ? "right-0" : "-translate-x-1/2",
              )}
              style={i > 0 && i < axisDays.length - 1 ? { left: `${((index + 0.5) / count) * 100}%` } : undefined}
            >
              {daily[index] ? shortDay(daily[index].day) : null}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function TopPagesChart({ pages }: { pages: PageVisits[] }) {
  const max = pages[0]?.views ?? 0;
  if (pages.length === 0) {
    return <EmptyState className="mt-4" title="Хандалт бүртгэгдээгүй байна" />;
  }
  return (
    <ul className="mt-4 space-y-3">
      {pages.map((page) => (
        <li key={page.path} className="grid grid-cols-[minmax(0,10rem)_1fr] items-center gap-4 sm:grid-cols-[minmax(0,14rem)_1fr]">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{pageLabel(page.path)}</p>
            <p className="truncate text-[11px] text-ink/50">{page.path}</p>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="h-3 rounded-r-[4px] bg-accent"
              style={{ width: `${Math.max((page.views / max) * 85, 1)}%` }}
            />
            <span className="shrink-0 text-xs font-semibold tabular-nums text-ink/80">
              {formatCount(page.views)}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Admin panel "Хандалт": page views and visitors from the site's own page_views table. */
export function SiteStatsPanel() {
  const [days, setDays] = useState(30);
  const [{ data, fetching, error }, reexecute] = useQuery<SiteStatsResult, SiteStatsVariables>({
    query: SITE_STATS_QUERY,
    variables: { days },
    requestPolicy: "cache-and-network",
  });
  const stats = data?.siteStats;
  const signedInShare = stats && stats.views > 0 ? Math.round((stats.signedInViews / stats.views) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Хугацаа" className="inline-flex rounded-full bg-ink/5 p-1">
          {RANGES.map((range) => (
            <button
              key={range.days}
              type="button"
              aria-pressed={days === range.days}
              onClick={() => setDays(range.days)}
              className={
                days === range.days
                  ? "rounded-full bg-card px-3.5 py-1.5 text-xs font-semibold text-ink shadow-sm max-lg:tap-target"
                  : "rounded-full px-3.5 py-1.5 text-xs font-semibold text-ink/60 hover:text-ink max-lg:tap-target"
              }
            >
              {range.label}
            </button>
          ))}
        </div>
        {stats && (
          <p className="text-xs text-ink/50">
            {formatDateMn(stats.from)} – {formatDateMn(stats.to)}
          </p>
        )}
      </div>

      {error ? (
        <ErrorState
          title="Хандалтын мэдээллийг ачааллаж чадсангүй"
          description={getErrorMessage(error)}
          onRetry={() => reexecute({ requestPolicy: "network-only" })}
        />
      ) : !stats ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
      ) : (
        <div className={cn("space-y-6 transition-opacity", fetching && "opacity-60")}>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatTile label="Хандалт" value={formatCount(stats.views)} note="Нээгдсэн хуудасны тоо" />
            <StatTile label="Зочин" value={formatCount(stats.visitors)} note="Давхардаагүй хөтөч" />
            <StatTile
              label="Өнөөдөр"
              value={formatCount(stats.todayViews)}
              note={`${formatCount(stats.todayVisitors)} зочин`}
            />
            <StatTile
              label="Нэвтэрсэн хэрэглэгч"
              value={`${signedInShare}%`}
              note={`${formatCount(stats.signedInViews)} хандалт`}
            />
          </div>

          <section className="rounded-2xl border border-ink/10 bg-card p-5 sm:p-6">
            <h3 className="text-base font-bold text-ink">Өдөр бүрийн хандалт</h3>
            <p className="mt-1 text-xs text-ink/50">
              Багана дээр хулганаа аваачиж тухайн өдрийн хандалт, зочныг харна.
            </p>
            <div className="mt-5">
              <DailyVisitsChart daily={stats.daily} />
            </div>
            {stats.views === 0 && (
              <p className="mt-3 text-xs text-ink/50">
                Хандалт бүртгэгдэж эхлэхэд энд харагдана.
              </p>
            )}
            <details className="mt-4">
              <summary className="cursor-pointer text-xs font-semibold text-ink/60 hover:text-ink max-lg:tap-target">
                Хүснэгтээр харах
              </summary>
              <table className="mt-3 w-full max-w-md text-left text-xs">
                <thead className="text-ink/50">
                  <tr>
                    <th className="py-1.5 font-semibold">Өдөр</th>
                    <th className="py-1.5 text-right font-semibold">Хандалт</th>
                    <th className="py-1.5 text-right font-semibold">Зочин</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/[0.07] tabular-nums text-ink/80">
                  {[...stats.daily].reverse().map((day) => (
                    <tr key={day.day}>
                      <td className="py-1.5">{formatDateMn(day.day)}</td>
                      <td className="py-1.5 text-right">{formatCount(day.views)}</td>
                      <td className="py-1.5 text-right">{formatCount(day.visitors)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          </section>

          <section className="rounded-2xl border border-ink/10 bg-card p-5 sm:p-6">
            <h3 className="text-base font-bold text-ink">Их үзсэн хуудсууд</h3>
            <p className="mt-1 text-xs text-ink/50">Сонгосон хугацаанд хамгийн их нээгдсэн 10 хуудас.</p>
            <TopPagesChart pages={stats.topPages} />
          </section>
        </div>
      )}
    </div>
  );
}
