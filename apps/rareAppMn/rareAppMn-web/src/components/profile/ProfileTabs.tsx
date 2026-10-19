"use client";

import { Settings, UserCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ACCOUNT_SETTINGS_PATH, PROFILE_PATH } from "@/lib/auth-routes";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Миний профайл", href: PROFILE_PATH, icon: UserCircle },
  { label: "Бүртгэлийн тохиргоо", href: ACCOUNT_SETTINGS_PATH, icon: Settings },
];

function isAccountPath(pathname: string): boolean {
  return pathname === ACCOUNT_SETTINGS_PATH || pathname.startsWith(`${ACCOUNT_SETTINGS_PATH}/`);
}

export function ProfileTabs({ className }: { className?: string }) {
  const pathname = usePathname();
  const activeHref = isAccountPath(pathname) ? ACCOUNT_SETTINGS_PATH : PROFILE_PATH;

  return (
    <nav
      aria-label="Профайлын хэсгүүд"
      className={cn("inline-flex max-w-full rounded-full bg-ink/5 p-1", className)}
    >
      {TABS.map((tab) => {
        const active = tab.href === activeHref;
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-colors sm:text-[13px]",
              active ? "bg-card text-ink shadow-sm" : "text-ink/60 hover:text-ink",
            )}
          >
            <Icon className="h-4 w-4" strokeWidth={1.8} />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
