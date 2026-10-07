"use client";

import { GraduationCap, School } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { MajorsExplorer } from "./MajorsExplorer";
import { SchoolsExplorer } from "./SchoolsExplorer";

type SearchMode = "schools" | "majors";

const TABS: { id: SearchMode; label: string; icon: typeof School }[] = [
  { id: "schools", label: "Сургууль", icon: School },
  { id: "majors", label: "Мэргэжил", icon: GraduationCap },
];

/** Lets visitors pivot the same search experience between schools (location/tuition/dorm) and majors (category/cutoff score). */
export function SearchExplorer() {
  const [mode, setMode] = useState<SearchMode>("schools");

  return (
    <div>
      <div className="inline-flex rounded-xl border border-ink/10 bg-card p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = mode === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMode(tab.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200",
                active
                  ? "bg-ink text-paper"
                  : "text-ink/60 hover:text-ink",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {mode === "schools" ? <SchoolsExplorer /> : <MajorsExplorer />}
      </div>
    </div>
  );
}
