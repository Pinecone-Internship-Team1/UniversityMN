"use client";

import { GraduationCap, School } from "lucide-react";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { MajorsExplorer } from "./MajorsExplorer";
import { SchoolsExplorer } from "./SchoolsExplorer";

export type SearchMode = "schools" | "majors";

const TABS: TabItem<SearchMode>[] = [
  { id: "schools", label: "Сургууль", icon: School, href: "/schools" },
  { id: "majors", label: "Мэргэжил", icon: GraduationCap, href: "/schools?tab=majors" },
];

/** Lets visitors pivot the same search experience between schools (location/tuition/dorm) and majors (category/cutoff score). */
export function SearchExplorer({ mode, score = null }: { mode: SearchMode; score?: number | null }) {
  return (
    <div>
      <Tabs
        items={TABS}
        value={mode}
        label="Хайлтын төрөл"
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
