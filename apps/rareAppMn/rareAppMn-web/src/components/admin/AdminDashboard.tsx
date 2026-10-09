"use client";

import { SignInButton, useAuth } from "@clerk/nextjs";
import { School, ShieldAlert, Users } from "lucide-react";
import { useState } from "react";
import { useQuery } from "urql";
import { SchoolManager } from "@/components/admin/SchoolManager";
import { UserLookup } from "@/components/admin/UserLookup";
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
import { cn } from "@/lib/utils";

type AdminTab = "catalog" | "users";

const TABS: { id: AdminTab; label: string; icon: typeof School }[] = [
  { id: "catalog", label: "Их, дээд сургууль, мэргэжил", icon: School },
  { id: "users", label: "Хэрэглэгч", icon: Users },
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
        title="Админ самбарт нэвтэрнэ үү"
        description="Энэ хэсгийг зөвхөн админ эрхтэй хэрэглэгч ашиглах боломжтой."
        action={
          <SignInButton mode="modal">
            <Button variant="solid" size="md" className="mt-2">
              Нэвтрэх
            </Button>
          </SignInButton>
        }
      />
    );
  }
  if (error) {
    return (
      <ErrorState
        description={getErrorMessage(error)}
        onRetry={() => reexecute({ requestPolicy: "network-only" })}
      />
    );
  }
  if (!data?.me) {
    if (syncStatus === "error") {
      return (
        <ErrorState
          title="Профайлыг холбож чадсангүй"
          description={syncError ?? undefined}
          onRetry={retrySync}
        />
      );
    }
    if (syncStatus === "synced" && !fetching && !stale && data) {
      return (
        <ErrorState
          title="Профайл олдсонгүй"
          description="Таны профайл серверт үүсээгүй байна. Дахин оролдоно уу."
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
        title="Админ эрх шаардлагатай"
        description="Таны бүртгэлд админ эрх олгогдоогүй байна. Эрх авах бол системийн админд хандана уу."
      />
    );
  }

  return (
    <div>
      <div className="inline-flex rounded-xl border border-ink/10 bg-card p-1">
        {TABS.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200",
                active ? "bg-ink text-paper" : "text-ink/60 hover:text-ink",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6">{tab === "catalog" ? <SchoolManager /> : <UserLookup />}</div>
    </div>
  );
}
