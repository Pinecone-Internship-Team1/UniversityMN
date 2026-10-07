"use client";

import { SignInButton, SignOutButton, useAuth } from "@clerk/nextjs";
import {
  GraduationCap,
  LogOut,
  Plus,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useMutation, useQuery } from "urql";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { MajorUnsaveButton } from "@/components/schools/MajorUnsaveButton";
import { SchoolCard } from "@/components/schools/SchoolCard";
import { formatTuition } from "@/lib/format";
import {
  ME_QUERY,
  PERSONALIZED_RECOMMENDATIONS_QUERY,
  UPDATE_USER_PROFILE_MUTATION,
  type MeQueryResult,
  type PersonalizedRecommendationsResult,
  type PersonalizedRecommendationsVariables,
  type UpdateUserProfileResult,
  type UpdateUserProfileVariables,
} from "@/lib/graphql/documents";

function SignedOutPrompt() {
  return (
    <EmptyState
      title="Профайл үзэхийн тулд нэвтэрнэ үү"
      description="Хадгалсан сургууль, мэргэжлээ хянах, мэдээллээ шинэчлэхийн тулд Clerk-ээр нэвтэрнэ үү."
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

function ProfileSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-5 rounded-2xl border border-ink/10 bg-card p-6">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}

interface ScoreRow {
  key: string;
  subject: string;
  score: string;
}

let scoreRowCounter = 0;
function createScoreRow(subject = "", score = ""): ScoreRow {
  scoreRowCounter += 1;
  return { key: `row-${scoreRowCounter}`, subject, score };
}

function scoresToRows(scores: Record<string, number> | null): ScoreRow[] {
  const entries = Object.entries(scores ?? {});
  if (entries.length === 0) return [createScoreRow()];
  return entries.map(([subject, score]) => createScoreRow(subject, String(score)));
}

function rowsToScores(rows: ScoreRow[]): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const row of rows) {
    const subject = row.subject.trim();
    const score = Number(row.score);
    if (subject && Number.isFinite(score)) {
      scores[subject] = score;
    }
  }
  return scores;
}

function RecommendationsSection({ hasScores }: { hasScores: boolean }) {
  const [{ data, fetching, error }] = useQuery<
    PersonalizedRecommendationsResult,
    PersonalizedRecommendationsVariables
  >({
    query: PERSONALIZED_RECOMMENDATIONS_QUERY,
    variables: { limit: 6 },
    pause: !hasScores,
  });

  if (!hasScores) {
    return (
      <EmptyState
        className="mt-4"
        icon={Sparkles}
        title="Оноогоо оруулаад танд тохирох мэргэжлүүдийг олоорой"
        description="Дээрх хэсэгт хичээлийн оноогоо оруулж хадгалсны дараа энд санал болгосон мэргэжлүүд харагдана."
      />
    );
  }

  if (fetching) {
    return (
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        className="mt-4"
        title="Санал болгосон мэргэжлийг ачааллаж чадсангүй"
      />
    );
  }

  const recommendations = data?.personalizedRecommendations ?? [];
  if (recommendations.length === 0) {
    return (
      <EmptyState
        className="mt-4"
        title="Тохирох мэргэжил олдсонгүй"
        description="Одоогоор системд бүртгэгдсэн мэргэжлүүдтэй тохирох оноо олдсонгүй."
      />
    );
  }

  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {recommendations.map((result) => (
        <div
          key={`${result.school.id}-${result.major.id}`}
          className="flex flex-col gap-2 rounded-xl border border-ink/10 bg-card p-4"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-bold text-ink">{result.major.name}</p>
            <Badge variant={result.eligible ? "accent" : "outline"}>
              {Math.round(result.matchScore * 100)}%
            </Badge>
          </div>
          <p className="text-xs text-ink/60">{result.school.name}</p>
          <p className="text-[11px] leading-relaxed text-ink/50">
            {result.reason}
          </p>
        </div>
      ))}
    </div>
  );
}

export function ProfileView() {
  const { isLoaded, isSignedIn } = useAuth();

  const [{ data, fetching, error }, reexecuteMe] = useQuery<MeQueryResult>({
    query: ME_QUERY,
    pause: !isSignedIn,
  });

  // First-ever sign-in: ClerkUserSync's mutation may still be in flight when
  // this query first resolves `me: null`. Retry once, shortly after.
  const [hasRetriedSync, setHasRetriedSync] = useState(false);
  useEffect(() => {
    if (!isSignedIn || fetching || data?.me || hasRetriedSync) return;
    const timeout = setTimeout(() => {
      setHasRetriedSync(true);
      reexecuteMe({ requestPolicy: "network-only" });
    }, 1200);
    return () => clearTimeout(timeout);
  }, [isSignedIn, fetching, data, hasRetriedSync, reexecuteMe]);

  const [{ fetching: savingProfile }, updateUserProfile] = useMutation<
    UpdateUserProfileResult,
    UpdateUserProfileVariables
  >(UPDATE_USER_PROFILE_MUTATION);

  const me = data?.me ?? null;
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [scoreRows, setScoreRows] = useState<ScoreRow[]>([createScoreRow()]);
  const [savedSchoolIds, setSavedSchoolIds] = useState<Set<string> | null>(null);
  const [savedMajorIds, setSavedMajorIds] = useState<Set<string> | null>(null);

  useEffect(() => {
    if (!me) return;
    setName(me.name ?? "");
    setAvatarUrl(me.avatarUrl ?? "");
    setScoreRows(scoresToRows(me.scores));
    setSavedSchoolIds(new Set(me.savedSchools.map((school) => school.id)));
    setSavedMajorIds(new Set(me.savedMajors.map((major) => major.id)));
  }, [me]);

  const visibleSavedSchools = useMemo(() => {
    if (!me || !savedSchoolIds) return [];
    return me.savedSchools.filter((school) => savedSchoolIds.has(school.id));
  }, [me, savedSchoolIds]);

  const visibleSavedMajors = useMemo(() => {
    if (!me || !savedMajorIds) return [];
    return me.savedMajors.filter((major) => savedMajorIds.has(major.id));
  }, [me, savedMajorIds]);

  const hasScores = Object.keys(rowsToScores(scoreRows)).length > 0;

  function updateScoreRow(key: string, patch: Partial<Omit<ScoreRow, "key">>) {
    setScoreRows((rows) =>
      rows.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  }

  async function handleSaveProfile() {
    const result = await updateUserProfile({
      input: {
        name: name.trim() || undefined,
        avatarUrl: avatarUrl.trim() || undefined,
        scores: rowsToScores(scoreRows),
      },
    });

    if (result.error) {
      toast.error("Профайл хадгалахад алдаа гарлаа", {
        description: result.error.message,
      });
      return;
    }
    toast.success("Профайл амжилттай хадгаллаа");
  }

  if (!isLoaded) return <ProfileSkeleton />;
  if (!isSignedIn) return <SignedOutPrompt />;
  if (error) {
    return (
      <ErrorState
        title="Профайл ачааллаж чадсангүй"
        onRetry={() => reexecuteMe({ requestPolicy: "network-only" })}
      />
    );
  }
  if (!me) return <ProfileSkeleton />;

  return (
    <div className="space-y-10">
      {/* Identity header */}
      <div className="flex flex-col gap-6 rounded-2xl border border-ink/10 bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-ink/10 bg-paper text-xl font-bold text-ink/50">
            {me.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- arbitrary user-provided avatar URL, not a local/static asset
              <img
                src={me.avatarUrl}
                alt={me.name ?? me.email}
                className="h-full w-full object-cover"
              />
            ) : (
              (me.name ?? me.email).slice(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-ink">
                {me.name ?? "Нэр тодорхойгүй"}
              </h2>
              <Badge variant={me.role === "ADMIN" ? "accent" : "default"}>
                {me.role === "ADMIN" ? "Админ" : "Сурагч"}
              </Badge>
            </div>
            <p className="text-sm text-ink/60">{me.email}</p>
          </div>
        </div>

        <SignOutButton>
          <Button variant="outline" size="sm">
            <LogOut className="h-3.5 w-3.5" />
            Гарах
          </Button>
        </SignOutButton>
      </div>

      {/* Edit form */}
      <section className="rounded-2xl border border-ink/10 bg-card p-6 sm:p-8">
        <h3 className="text-base font-bold text-ink">Мэдээлэл засах</h3>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink/70">
            Нэр
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Таны нэр"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-ink/70">
            Профайл зургийн URL
            <Input
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
              placeholder="https://..."
            />
          </label>
        </div>

        {/* Scores editor */}
        <div className="mt-6 border-t border-ink/10 pt-5">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-accent" />
            <h4 className="text-sm font-bold text-ink">
              Миний ЭЕШ-ийн оноо
            </h4>
          </div>
          <p className="mt-1 text-xs text-ink/60">
            Хичээл бүрийн нэр болон авсан оноогоо оруулбал танд тохирох
            мэргэжлүүдийг доор санал болгоно.
          </p>
          <div className="mt-4 space-y-2.5">
            {scoreRows.map((row) => (
              <div key={row.key} className="flex items-center gap-2">
                <Input
                  value={row.subject}
                  onChange={(event) =>
                    updateScoreRow(row.key, { subject: event.target.value })
                  }
                  placeholder="жишээ: Математик"
                  className="flex-1"
                />
                <Input
                  type="number"
                  min={0}
                  max={800}
                  value={row.score}
                  onChange={(event) =>
                    updateScoreRow(row.key, { score: event.target.value })
                  }
                  placeholder="Оноо"
                  className="w-24"
                />
                <button
                  type="button"
                  onClick={() =>
                    setScoreRows((rows) =>
                      rows.length === 1
                        ? [createScoreRow()]
                        : rows.filter((r) => r.key !== row.key),
                    )
                  }
                  aria-label="Мөр хасах"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink/40 transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setScoreRows((rows) => [...rows, createScoreRow()])}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink/60 transition-colors hover:text-accent"
          >
            <Plus className="h-3.5 w-3.5" />
            Хичээл нэмэх
          </button>
        </div>

        <div className="mt-6 flex items-center gap-3 border-t border-ink/10 pt-5">
          <Button
            variant="solid"
            size="md"
            onClick={handleSaveProfile}
            disabled={savingProfile}
          >
            <Save className="h-3.5 w-3.5" />
            {savingProfile ? "Хадгалж байна..." : "Хадгалах"}
          </Button>
        </div>
      </section>

      {/* Personalized recommendations */}
      <section>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <h3 className="text-base font-bold text-ink">
            Танд санал болгох мэргэжлүүд
          </h3>
        </div>
        <RecommendationsSection hasScores={hasScores} />
      </section>

      {/* Saved schools */}
      <section>
        <h3 className="text-base font-bold text-ink">
          Хадгалсан сургуулиуд ({visibleSavedSchools.length})
        </h3>
        {visibleSavedSchools.length === 0 ? (
          <EmptyState
            className="mt-4"
            title="Хадгалсан сургууль байхгүй байна"
            description="Сургуулиудын хуудсаас зүрхэн тэмдгийг дарж хадгалаарай."
          />
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleSavedSchools.map((school) => (
              <SchoolCard
                key={school.id}
                school={school}
                className="w-full"
                onToggled={(saved) => {
                  if (saved) return;
                  setSavedSchoolIds((current) => {
                    const next = new Set(current);
                    next.delete(school.id);
                    return next;
                  });
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Saved majors */}
      <section>
        <h3 className="text-base font-bold text-ink">
          Хадгалсан мэргэжлүүд ({visibleSavedMajors.length})
        </h3>
        {visibleSavedMajors.length === 0 ? (
          <EmptyState
            className="mt-4"
            title="Хадгалсан мэргэжил байхгүй байна"
            description="Сургуулийн дэлгэрэнгүй хуудаснаас мэргэжил сонгон хадгалаарай."
          />
        ) : (
          <ul className="mt-4 space-y-2.5">
            {visibleSavedMajors.map((major) => (
              <li
                key={major.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-ink/10 bg-card px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink">
                    {major.name}
                  </p>
                  <p className="mt-0.5 text-xs text-ink/60">
                    {[major.category, formatTuition(major.tuitionFee)]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <MajorUnsaveButton
                  majorId={major.id}
                  majorName={major.name}
                  onUnsaved={() =>
                    setSavedMajorIds((current) => {
                      const next = new Set(current);
                      next.delete(major.id);
                      return next;
                    })
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
