"use client";

import { GraduationCap, School } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { MajorsExplorer } from "./MajorsExplorer";
import { SchoolsExplorer } from "./SchoolsExplorer";

export type SearchMode = "schools" | "majors";

const TABS: { id: SearchMode; label: string; icon: typeof School; href: string }[] = [
  { id: "schools", label: "Сургууль", icon: School, href: "/schools" },
  { id: "majors", label: "Мэргэжил", icon: GraduationCap, href: "/schools?tab=majors" },
];

/** Lets visitors pivot the same search experience between schools (location/tuition/dorm) and majors (category/cutoff score). */
export function SearchExplorer({ mode }: { mode: SearchMode }) {
  return (
    <div>
      <div className="inline-flex rounded-xl border border-ink/10 bg-card p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = mode === tab.id;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              replace
              scroll={false}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200",
                active
                  ? "bg-ink text-paper"
                  : "text-ink/60 hover:text-ink",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-6">
        {mode === "schools" ? <SchoolsExplorer /> : <MajorsExplorer />}
      </div>
    </div>
  );
}
