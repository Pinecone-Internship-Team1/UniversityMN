"use client";

import { GraduationCap, School } from "lucide-react";
import { useTranslations } from "next-intl";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { MajorsExplorer } from "./MajorsExplorer";
import { SchoolsExplorer } from "./SchoolsExplorer";

export type SearchMode = "schools" | "majors";

/** Labels are keys in the "nav" messages. */
const TABS = [
  { id: "schools", label: "schools", icon: School, href: "/schools" },
  { id: "majors", label: "majors", icon: GraduationCap, href: "/schools?tab=majors" },
] as const;

/** Lets visitors pivot the same search experience between schools (location/tuition/dorm) and majors (category/cutoff score). */
export function SearchExplorer({ mode, score = null }: { mode: SearchMode; score?: number | null }) {
  const t = useTranslations("explorer");
  const tNav = useTranslations("nav");
  return (
    <div>
      <Tabs
        items={TABS.map((tab): TabItem<SearchMode> => ({ ...tab, label: tNav(tab.label) }))}
        value={mode}
        label={t("searchType")}
        fullWidth
        className="sm:inline-flex sm:w-auto"
        linkProps={{ replace: true, scroll: false }}
      />

      <div className="mt-5">
        {mode === "schools" ? (
          <SchoolsExplorer />
        ) : (
          // Keyed by score so a new score from the homepage starts a fresh search.
          <MajorsExplorer key={score ?? "none"} initialScore={score} />
        )}
      </div>
    </div>
  );
}
