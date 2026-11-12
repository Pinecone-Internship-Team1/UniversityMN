"use client";

import { useTranslations } from "next-intl";
import { Settings, UserCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { ACCOUNT_SETTINGS_PATH, PROFILE_PATH } from "@/lib/auth-routes";
import { cn } from "@/lib/utils";

type ProfileTab = "profile" | "account";

/** Labels are keys in the "profile" messages. */
const TABS = [
  { id: "profile", label: "tabProfile", href: PROFILE_PATH, icon: UserCircle },
  { id: "account", label: "tabAccount", href: ACCOUNT_SETTINGS_PATH, icon: Settings },
] as const;

function isAccountPath(pathname: string): boolean {
  return pathname === ACCOUNT_SETTINGS_PATH || pathname.startsWith(`${ACCOUNT_SETTINGS_PATH}/`);
}

export function ProfileTabs({ className }: { className?: string }) {
  const t = useTranslations("profile");
  const pathname = usePathname();
  return (
    <Tabs
      items={TABS.map((tab): TabItem<ProfileTab> => ({ ...tab, label: t(tab.label) }))}
      value={isAccountPath(pathname) ? "account" : "profile"}
      label={t("tabsLabel")}
      fullWidth
      className={cn("sm:inline-flex sm:w-auto", className)}
    />
  );
}
