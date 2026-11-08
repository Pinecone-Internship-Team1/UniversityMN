"use client";

import { ChevronDown, ChevronLeft, ChevronRight, Search, ShieldCheck, ShieldOff } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery } from "urql";
import { InlineConfirm } from "@/components/admin/InlineConfirm";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { formatDateMn } from "@/lib/format";
import {
  ADMIN_USERS_QUERY,
  SET_USER_ROLE_MUTATION,
  USER_PROFILE_CACHE,
  type AdminUser,
  type AdminUsersResult,
  type AdminUsersVariables,
  type SetUserRoleResult,
  type SetUserRoleVariables,
} from "@/lib/graphql/documents";
import { getErrorMessage } from "@/lib/graphql/errors";
import type { UserRole } from "@/lib/graphql/types";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

const ROLE_FILTERS: { value: UserRole | null; label: string }[] = [
  { value: null, label: "Бүгд" },
  { value: "STUDENT", label: "Сурагч" },
  { value: "ADMIN", label: "Админ" },
];

function scoresText(scores: AdminUser["scores"]): string {
  return (
    Object.entries(scores ?? {})
      .map(([subject, score]) => `${subject} ${score}`)
      .join(", ") || "Оруулаагүй"
  );
}

function UserAvatar({ user }: { user: AdminUser }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-ink/10 bg-paper text-[11px] font-bold text-ink/50">
      {user.avatarUrl ? (
        // Plain <img>: an arbitrary user-provided avatar URL, not a local/static asset.
        <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        (user.name ?? user.email).slice(0, 2).toUpperCase()
      )}
    </span>
  );
}

function userLabel(user: AdminUser): string {
  return user.name ? `${user.name} (${user.email})` : user.email;
}

/** Make admin / remove admin, behind an "are you sure?" step. Hidden for yourself. */
function RoleControl({ user, isSelf }: { user: AdminUser; isSelf: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [{ fetching }, setUserRole] = useMutation<SetUserRoleResult, SetUserRoleVariables>(
    SET_USER_ROLE_MUTATION,
  );
  const isAdmin = user.role === "ADMIN";

  if (isSelf) {
    return <p className="text-ink/60">Та өөрийн эрхийг өөрчлөх боломжгүй.</p>;
  }

  async function handleConfirm() {
    setErrorMessage(null);
    const result = await setUserRole(
      { userId: user.id, role: isAdmin ? "STUDENT" : "ADMIN" },
      USER_PROFILE_CACHE,
    );
    if (result.error) {
      setErrorMessage(getErrorMessage(result.error));
      return;
    }
    setConfirming(false);
  }

  return (
    <div className="space-y-2">
      {confirming ? (
        <InlineConfirm
          tone={isAdmin ? "danger" : "accent"}
          message={
            isAdmin
              ? `“${userLabel(user)}” хэрэглэгчийн админ эрхийг хасахдаа итгэлтэй байна уу?`
              : `“${userLabel(user)}” хэрэглэгчийг админ болгохдоо итгэлтэй байна уу? Админ сургууль, мэргэжил засах, хэрэглэгчийн эрх өөрчлөх боломжтой болно.`
          }
          confirmLabel={isAdmin ? "Тийм, эрхийг хасах" : "Тийм, админ болгох"}
          busyLabel="Хадгалж байна..."
          busy={fetching}
          onConfirm={handleConfirm}
          onCancel={() => {
            setConfirming(false);
            setErrorMessage(null);
          }}
        />
      ) : (
        <Button variant={isAdmin ? "outline" : "primary"} size="sm" onClick={() => setConfirming(true)}>
          {isAdmin ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
          {isAdmin ? "Админ эрхийг хасах" : "Админ болгох"}
        </Button>
      )}
      {errorMessage && (
        <p role="alert" className="text-destructive">
          {errorMessage}
        </p>
      )}
    </div>
  );
}

function UserDetails({ user, isSelf }: { user: AdminUser; isSelf: boolean }) {
  return (
    <dl className="grid gap-x-6 gap-y-2.5 border-t border-ink/[0.07] bg-paper px-4 py-4 text-xs sm:grid-cols-[9rem_1fr]">
      <dt className="font-semibold text-ink sm:pt-1">Эрх</dt>
      <dd>
        <RoleControl user={user} isSelf={isSelf} />
      </dd>
      <dt className="font-semibold text-ink">Clerk ID</dt>
      <dd className="select-all break-all font-mono text-ink/70">{user.clerkUserId}</dd>
      <dt className="font-semibold text-ink">ЭЕШ оноо</dt>
      <dd className="text-ink/70">{scoresText(user.scores)}</dd>
      <dt className="font-semibold text-ink">Хадгалсан сургууль</dt>
      <dd className="text-ink/70">
        {user.savedSchools.map((school) => school.name).join(", ") || "Байхгүй"}
      </dd>
      <dt className="font-semibold text-ink">Хадгалсан мэргэжил</dt>
      <dd className="text-ink/70">
        {user.savedMajors.map((major) => major.name).join(", ") || "Байхгүй"}
      </dd>
      <dt className="font-semibold text-ink">Шинэчилсэн</dt>
      <dd className="text-ink/70">{formatDateMn(user.updatedAt)}</dd>
    </dl>
  );
}

/** Admin panel: every registered user, newest first, with search, a role filter and role changes. */
export function UserList({ currentUserId }: { currentUserId: string }) {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<UserRole | null>(null);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const [{ data, fetching, error }, reexecute] = useQuery<
    AdminUsersResult,
    AdminUsersVariables
  >({
    query: ADMIN_USERS_QUERY,
    variables: {
      filter: {
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(role ? { role } : {}),
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      },
    },
    requestPolicy: "cache-and-network",
    context: USER_PROFILE_CACHE,
  });

  const users = data?.users.items ?? [];
  const totalCount = data?.users.pageInfo.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1 lg:max-w-md">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Нэр, имэйл эсвэл Clerk ID-аар хайх..."
            className="pl-11"
            aria-label="Хэрэглэгч хайх"
          />
        </div>
        <div role="group" aria-label="Эрх" className="inline-flex self-start rounded-full bg-ink/5 p-1">
          {ROLE_FILTERS.map((option) => (
            <button
              key={option.label}
              type="button"
              aria-pressed={role === option.value}
              onClick={() => {
                setRole(option.value);
                setPage(1);
              }}
              className={
                role === option.value
                  ? "rounded-full bg-card px-3.5 py-1.5 text-xs font-semibold text-ink shadow-sm max-lg:tap-target"
                  : "rounded-full px-3.5 py-1.5 text-xs font-semibold text-ink/60 hover:text-ink max-lg:tap-target"
              }
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="text-xs font-semibold text-ink/60 lg:ml-auto" aria-live="polite">
          Нийт {totalCount} хэрэглэгч
        </p>
      </div>

      {error ? (
        <ErrorState
          title="Хэрэглэгчдийг ачааллаж чадсангүй"
          description={getErrorMessage(error)}
          onRetry={() => reexecute({ requestPolicy: "network-only" })}
        />
      ) : fetching && !data ? (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : users.length === 0 ? (
        <EmptyState title="Хэрэглэгч олдсонгүй" />
      ) : (
        <>
          <ul className="divide-y divide-ink/[0.07] overflow-hidden rounded-xl border border-ink/10 bg-card">
            {users.map((user) => {
              const expanded = expandedId === user.id;
              return (
                <li key={user.id}>
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : user.id)}
                    aria-expanded={expanded}
                    className="grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-4 py-3 text-left transition-colors hover:bg-ink/[0.03] md:grid-cols-[minmax(0,1fr)_6rem_10rem_7rem_1rem]"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <UserAvatar user={user} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-ink">
                          {user.name ?? "Нэр тодорхойгүй"}
                        </span>
                        <span className="block truncate text-xs text-ink/60">{user.email}</span>
                      </span>
                    </span>
                    <span className="flex items-center gap-2 md:contents">
                      <Badge
                        variant={user.role === "ADMIN" ? "accent" : "default"}
                        className="md:justify-self-start"
                      >
                        {user.role === "ADMIN" ? "Админ" : "Сурагч"}
                      </Badge>
                      <span className="hidden text-xs text-ink/60 md:block">
                        {user.savedSchools.length} сургууль · {user.savedMajors.length} мэргэжил
                      </span>
                      <span className="hidden text-xs text-ink/60 md:block">
                        {formatDateMn(user.createdAt)}
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-ink/40 transition-transform",
                          expanded && "rotate-180",
                        )}
                      />
                    </span>
                  </button>
                  {expanded && <UserDetails user={user} isSelf={user.id === currentUserId} />}
                </li>
              );
            })}
          </ul>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
                aria-label="Өмнөх хуудас"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40 max-lg:tap-target"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-bold text-ink/60">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page >= totalPages}
                aria-label="Дараагийн хуудас"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:border-ink disabled:cursor-not-allowed disabled:opacity-40 max-lg:tap-target"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
