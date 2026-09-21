"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Universities", href: "/admin/universities" },
  { label: "Faculties", href: "/admin/faculties" },
  { label: "Programs", href: "/admin/programs" },
  { label: "Admission Requirements", href: "/admin/admission-requirements" },
  { label: "Subjects", href: "/admin/subjects" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-paper text-ink">
      <aside className="flex w-64 shrink-0 flex-col border-r border-border-ink bg-card px-4 py-6">
        <Link
          href="/admin"
          className="mb-8 px-2 font-display text-lg font-semibold tracking-tight"
        >
          Oyutan <span className="text-accent">Admin</span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-sm px-3 py-2 text-[13px] font-medium uppercase tracking-[0.06em] transition-colors",
                  active
                    ? "bg-ink text-paper"
                    : "text-ink-soft hover:bg-paper-deep hover:text-ink"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex items-center justify-between border-t border-border-ink pt-4">
          <Link
            href="/"
            className="text-[12px] font-medium uppercase tracking-[0.06em] text-ink-soft hover:text-ink"
          >
            ← Site
          </Link>
          <UserButton />
        </div>
      </aside>

      <main className="flex-1 overflow-x-hidden px-8 py-8">{children}</main>
    </div>
  );
}
