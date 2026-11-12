"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import { ChartColumn, School, ShieldAlert, Users } from "lucide-react";
import { useState } from "react";
import { useQuery } from "urql";
import { SchoolManager } from "@/components/admin/SchoolManager";
import { SiteStatsPanel } from "@/components/admin/SiteStatsPanel";
import { UserList } from "@/components/admin/UserList";
import { useClerkUserSync } from "@/components/providers/ClerkUserSync";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  USER_PROFILE_CACHE,
  VIEWER_QUERY,
  type ViewerQueryResult,
} from "@/lib/graphql/documents";
import { getErrorMessage } from "@/lib/graphql/errors";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type AdminTab = "catalog" | "users" | "visits";

/** Labels: messages "admin.tabs.<id>". */
const TABS: { id: AdminTab; icon: typeof School }[] = [
  { id: "catalog", icon: School },
  { id: "users", icon: Users },
  { id: "visits", icon: ChartColumn },
];

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-96 w-full rounded-2xl" />
    </div>
  );
}

export function AdminDashboard() {
  const { isLoaded, isSignedIn } = useAuth();
  const t = useTranslations("admin");
  const tp = useTranslations("profile");
  const tc = useTranslations("common");
  const tErrors = useTranslations("errors");
  const { status: syncStatus, errorMessage: syncError, retry: retrySync } =
    useClerkUserSync();
  const [tab, setTab] = useState<AdminTab>("catalog");
  const [{ data, fetching, stale, error }, reexecute] = useQuery<ViewerQueryResult>({
    query: VIEWER_QUERY,
    pause: !isSignedIn,
    context: USER_PROFILE_CACHE,
  });

  if (!isLoaded) return <DashboardSkeleton />;
  if (!isSignedIn) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title={t("signInTitle")}
        description={t("signInText")}
        action={
          <SignInButton mode="modal">
            <Button variant="solid" size="md" className="mt-2">
              {tc("signIn")}
            </Button>
          </SignInButton>
        }
      />
    );
  }
  if (error) {
    return (
      <ErrorState
        description={getErrorMessage(tErrors, error)}
        onRetry={() => reexecute({ requestPolicy: "network-only" })}
      />
    );
  }
  if (!data?.me) {
    if (syncStatus === "error") {
      return (
        <ErrorState
          title={tp("syncError")}
          description={syncError ?? undefined}
          onRetry={retrySync}
        />
      );
    }
    if (syncStatus === "synced" && !fetching && !stale && data) {
      return (
        <ErrorState
          title={tp("notFoundTitle")}
          description={tp("notFoundText")}
          onRetry={retrySync}
        />
      );
    }
    return <DashboardSkeleton />;
  }
  if (data.me.role !== "ADMIN") {
    return (
      <EmptyState
        icon={ShieldAlert}
        title={t("forbiddenTitle")}
        description={t("forbiddenText")}
      />
    );
  }

  return (
    <div>
      <div className="inline-flex max-w-full flex-wrap rounded-xl border border-ink/10 bg-card p-1">
        {TABS.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 max-lg:py-3.5",
                active ? "bg-ink text-paper" : "text-ink/60 hover:text-ink",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t(`tabs.${item.id}`)}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {tab === "catalog" ? <SchoolManager /> : tab === "users" ? <UserList currentUserId={data.me.id} /> : <SiteStatsPanel />}
      </div>
    </div>
  );
}
