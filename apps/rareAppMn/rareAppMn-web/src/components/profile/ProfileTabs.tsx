"use client";

import { Settings, UserCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { ACCOUNT_SETTINGS_PATH, PROFILE_PATH } from "@/lib/auth-routes";
import { cn } from "@/lib/utils";

type ProfileTab = "profile" | "account";

const TABS: TabItem<ProfileTab>[] = [
  { id: "profile", label: "Миний профайл", href: PROFILE_PATH, icon: UserCircle },
  { id: "account", label: "Тохиргоо", href: ACCOUNT_SETTINGS_PATH, icon: Settings },
];

function isAccountPath(pathname: string): boolean {
  return pathname === ACCOUNT_SETTINGS_PATH || pathname.startsWith(`${ACCOUNT_SETTINGS_PATH}/`);
}

export function ProfileTabs({ className }: { className?: string }) {
  const pathname = usePathname();
  return (
    <Tabs
      items={TABS}
      value={isAccountPath(pathname) ? "account" : "profile"}
      label="Профайлын хэсгүүд"
      fullWidth
      className={cn("sm:inline-flex sm:w-auto", className)}
    />
  );
}
