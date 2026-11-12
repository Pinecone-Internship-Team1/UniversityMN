"use client";

import { SignInButton, SignOutButton, useAuth } from "@clerk/nextjs";
import {
  GraduationCap,
  LogOut,
  Plus,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
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
import { useClerkUserSync } from "@/components/providers/ClerkUserSync";
import { buttonClassName } from "@/components/ui/Button";
import { ACCOUNT_SETTINGS_PATH } from "@/lib/auth-routes";
import { useTranslations } from "next-intl";
import { formatMajorPlace, formatTuition, formatVerdict, isScoredVerdict } from "@/lib/format";
import {
  ME_QUERY,
  PERSONALIZED_RECOMMENDATIONS_QUERY,
  UPDATE_USER_PROFILE_MUTATION,
  USER_PROFILE_CACHE,
  type MeQueryResult,
  type PersonalizedRecommendationsResult,
  type PersonalizedRecommendationsVariables,
  type UpdateUserProfileResult,
  type UpdateUserProfileVariables,
} from "@/lib/graphql/documents";
import { getErrorMessage } from "@/lib/graphql/errors";
import type { Region } from "@/lib/graphql/types";
import { getUniversityBySchoolId, getUniversitySlug } from "@/lib/university-logos";
import { parseScoreEntries } from "@/lib/validation";

function SignedOutPrompt() {
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  return (
    <EmptyState
      title={t("signedOutTitle")}
      description={t("signedOutText")}
      action={
        <SignInButton>
          <Button variant="solid" size="md" className="mt-2">
            {tc("signIn")}
          </Button>
        </SignInButton>
      }
    />
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-5 rounded-2xl border border-border-ink bg-card p-6">
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

function universityHref(school: { id: string; name: string }): string {
  return `/university/${getUniversitySlug(school.id) ?? school.id}`;
}

// Branch schools have lower cut-offs (e.g. 430 vs 490), so ranking them together
// with Ulaanbaatar would always put branches first; each region is ranked on its own.
// Labels: messages "profile.region.<value>".
const REGIONS: Region[] = ["ULAANBAATAR", "OUTSIDE_ULAANBAATAR"];

function RecommendationsSection({ hasScores }: { hasScores: boolean }) {
  const t = useTranslations("profile");
  const [region, setRegion] = useState<Region>("ULAANBAATAR");

  if (!hasScores) {
    return (
      <EmptyState
        className="mt-4"
        icon={Sparkles}
        title={t("noScoresTitle")}
        description={t("noScoresText")}
      />
    );
  }

  return (
    <div className="mt-4">
      <div role="group" aria-label={t("regionLabel")} className="inline-flex rounded-full bg-ink/5 p-1">
        {REGIONS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={region === option}
            onClick={() => setRegion(option)}
            className={
              region === option
                ? "rounded-full bg-card px-3.5 py-1.5 text-[15px] font-semibold text-ink shadow-sm"
                : "rounded-full px-3.5 py-1.5 text-[15px] font-semibold text-ink-3 hover:text-ink"
            }
          >
            {t(`region.${option}`)}
          </button>
        ))}
      </div>
      <RecommendationList region={region} />
    </div>
  );
}

function RecommendationList({ region }: { region: Region }) {
  const t = useTranslations("profile");
  const tFormat = useTranslations("format");
  const tErrors = useTranslations("errors");
  const [{ data, fetching, error }, reexecute] = useQuery<
    PersonalizedRecommendationsResult,
    PersonalizedRecommendationsVariables
  >({
    query: PERSONALIZED_RECOMMENDATIONS_QUERY,
    variables: { limit: 6, region },
    context: USER_PROFILE_CACHE,
  });

  if (fetching) {
    return (
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
        title={t("recommendationsError")}
        description={getErrorMessage(tErrors, error)}
        onRetry={() => reexecute({ requestPolicy: "network-only" })}
      />
    );
  }

  const recommendations = data?.personalizedRecommendations ?? [];
  if (recommendations.length === 0) {
    return (
      <EmptyState
        className="mt-4"
        title={t("noMatchesTitle")}
        description={t("noMatchesText")}
      />
    );
  }

  return (
    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {recommendations.map((result) => (
        <Link
          key={`${result.school.id}-${result.major.id}`}
          href={universityHref(result.school)}
          className="flex flex-col gap-2 rounded-xl border border-border-ink bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-sm"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-base font-bold text-ink">{result.major.name}</p>
            <Badge
              variant={
                result.verdict === "ELIGIBLE"
                  ? "accent"
                  : result.verdict === "CHECK_WITH_SCHOOL"
                    ? "default"
                    : "outline"
              }
            >
              {isScoredVerdict(result.verdict)
                ? `${Math.round(result.matchScore * 100)}%`
                : formatVerdict(tFormat, result.verdict)}
            </Badge>
          </div>
          <p className="text-[15px] text-ink-3">
            {formatMajorPlace(
              result.major.faculty,
              getUniversityBySchoolId(result.school.id)?.short ?? result.school.name,
            )}
          </p>
          <p className="text-sm leading-relaxed text-ink-3">
            {result.reason}
          </p>
        </Link>
      ))}
    </div>
  );
}

export function ProfileView() {
  const { isLoaded, isSignedIn } = useAuth();
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const tFormat = useTranslations("format");
  const tErrors = useTranslations("errors");
  const tValidation = useTranslations("validation");
  const tAdmin = useTranslations("admin");
  const { status: syncStatus, errorMessage: syncError, retry: retrySync } =
    useClerkUserSync();

  const [{ data, fetching, stale, error }, reexecuteMe] = useQuery<MeQueryResult>({
    query: ME_QUERY,
    pause: !isSignedIn,
    context: USER_PROFILE_CACHE,
  });

  const [{ fetching: savingProfile }, updateUserProfile] = useMutation<
    UpdateUserProfileResult,
    UpdateUserProfileVariables
  >(UPDATE_USER_PROFILE_MUTATION);

  const me = data?.me ?? null;
  const [scoreRows, setScoreRows] = useState<ScoreRow[]>([createScoreRow()]);
  const [formUserId, setFormUserId] = useState<string | null>(null);
  const [hiddenSchoolIds, setHiddenSchoolIds] = useState<Set<string>>(new Set());
  const [hiddenMajorIds, setHiddenMajorIds] = useState<Set<string>>(new Set());

  if (me && formUserId !== me.id) {
    setFormUserId(me.id);
    setScoreRows(scoresToRows(me.scores));
    setHiddenSchoolIds(new Set());
    setHiddenMajorIds(new Set());
  }

  const visibleSavedSchools = useMemo(
    () => me?.savedSchools.filter((school) => !hiddenSchoolIds.has(school.id)) ?? [],
    [me, hiddenSchoolIds],
  );

  const visibleSavedMajors = useMemo(
    () => me?.savedMajors.filter((major) => !hiddenMajorIds.has(major.id)) ?? [],
    [me, hiddenMajorIds],
  );

  const hasSavedScores = Object.keys(me?.scores ?? {}).length > 0;

  function updateScoreRow(key: string, patch: Partial<Omit<ScoreRow, "key">>) {
    setScoreRows((rows) =>
      rows.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  }

  async function handleSaveProfile() {
    const parsedScores = parseScoreEntries(tValidation, scoreRows);
    if (!parsedScores.ok) {
      toast.error(t("cannotSave"), { description: parsedScores.error });
      return;
    }

    // Name and photo come from the account (Clerk) and are synced by
    // ClerkUserSync, so this form only saves scores.
    const result = await updateUserProfile({
      input: { scores: parsedScores.value },
    });

    if (result.error) {
      toast.error(t("saveFailed"), {
        description: getErrorMessage(tErrors, result.error),
      });
      return;
    }

    const updated = result.data?.updateUserProfile;
    if (updated) {
      setScoreRows(scoresToRows(updated.scores));
    }
    toast.success(t("saved"));
  }

  if (!isLoaded) return <ProfileSkeleton />;
  if (!isSignedIn) return <SignedOutPrompt />;
  if (error) {
    return (
      <ErrorState
        title={t("loadError")}
        description={getErrorMessage(tErrors, error)}
        onRetry={() => reexecuteMe({ requestPolicy: "network-only" })}
      />
    );
  }
  if (!me) {
    if (syncStatus === "error") {
      return (
        <ErrorState
          title={t("syncError")}
          description={syncError ?? undefined}
          onRetry={retrySync}
        />
      );
    }
    if (syncStatus === "synced" && !fetching && !stale && data) {
      return (
        <ErrorState
          title={t("notFoundTitle")}
          description={t("notFoundText")}
          onRetry={retrySync}
        />
      );
    }
    return <ProfileSkeleton />;
  }

  return (
    <div className="space-y-10">
      {/* Identity header */}
      <div className="flex flex-col gap-6 rounded-2xl border border-border-ink bg-card p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-ink bg-paper text-xl font-bold text-ink-3">
            {me.avatarUrl ? (
              // Plain <img>: an arbitrary user-provided avatar URL, not a local/static asset.
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
                {me.name ?? t("noName")}
              </h2>
              <Badge variant={me.role === "ADMIN" ? "accent" : "default"}>
                {me.role === "ADMIN" ? t("roleAdmin") : t("roleStudent")}
              </Badge>
            </div>
            <p className="text-sm text-ink-3">{me.email}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {me.role === "ADMIN" && (
            <Link href="/admin" className={buttonClassName({ variant: "solid", size: "sm" })}>
              <ShieldCheck className="h-3.5 w-3.5" />
              {tAdmin("title")}
            </Link>
          )}
          <SignOutButton>
            <Button variant="outline" size="sm">
              <LogOut className="h-3.5 w-3.5" />
              {tc("signOut")}
            </Button>
          </SignOutButton>
        </div>
      </div>

      {/* Edit form */}
      <section className="rounded-2xl border border-border-ink bg-card p-5 md:p-8">
        <h3 className="text-base font-bold text-ink">{t("editTitle")}</h3>

        {/* Name and photo: read-only here, edited in the account tab */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <p className="text-[15px] font-semibold text-ink-2">{t("name")}</p>
            <p className="flex h-11 items-center rounded-xl border border-border-ink bg-paper px-4 text-sm text-ink">
              {me.name ?? <span className="text-ink-3">{t("nameMissing")}</span>}
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="text-[15px] font-semibold text-ink-2">{t("photo")}</p>
            <div className="flex h-11 items-center gap-3 rounded-xl border border-border-ink bg-paper px-4 text-sm text-ink-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-ink bg-card text-[10px] font-bold text-ink-3">
                {me.avatarUrl ? (
                  // Plain <img>: an arbitrary user-provided avatar URL, not a local/static asset.
                  <img src={me.avatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  (me.name ?? me.email).slice(0, 2).toUpperCase()
                )}
              </span>
              {me.avatarUrl ? t("currentPhoto") : t("noPhoto")}
            </div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          <p className="text-[15px] text-ink-3">
            {t("editHint")}
          </p>
          <Link
            href={ACCOUNT_SETTINGS_PATH}
            className="inline-flex items-center gap-1.5 text-[15px] font-bold text-ink-2 transition-colors hover:text-accent max-lg:tap-target"
          >
            <Settings className="h-3.5 w-3.5" />
            {tc("accountSettings")}
          </Link>
        </div>

        {/* Scores editor */}
        <div className="mt-6 border-t border-border-ink pt-5">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-accent" />
            <h4 className="text-base font-bold text-ink">
              {t("scoresTitle")}
            </h4>
          </div>
          <p className="mt-1 text-[15px] text-ink-3">
            {t("scoresHint")}
          </p>
          <div className="mt-4 space-y-2.5">
            {scoreRows.map((row) => (
              <div key={row.key} className="flex items-center gap-2">
                <Input
                  value={row.subject}
                  onChange={(event) =>
                    updateScoreRow(row.key, { subject: event.target.value })
                  }
                  placeholder={t("subjectPlaceholder")}
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
                  placeholder={t("scorePlaceholder")}
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
                  aria-label={t("removeRow")}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-3 transition-colors hover:bg-destructive/10 hover:text-destructive max-lg:tap-target"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setScoreRows((rows) => [...rows, createScoreRow()])}
            className="mt-3 inline-flex items-center gap-1.5 text-[15px] font-bold text-ink-3 transition-colors hover:text-accent max-lg:relative max-lg:after:absolute max-lg:after:inset-x-0 max-lg:after:-top-3 max-lg:after:-bottom-4"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("addSubject")}
          </button>
        </div>

        <div className="mt-6 flex items-center gap-3 border-t border-border-ink pt-5">
          <Button
            variant="solid"
            size="md"
            onClick={handleSaveProfile}
            disabled={savingProfile}
          >
            <Save className="h-3.5 w-3.5" />
            {savingProfile ? t("saving") : tc("save")}
          </Button>
        </div>
      </section>

      {/* Personalized recommendations */}
      <section>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <h3 className="text-base font-bold text-ink">
            {t("recommendationsTitle")}
          </h3>
        </div>
        <RecommendationsSection hasScores={hasSavedScores} />
      </section>

      {/* Saved schools */}
      <section>
        <h3 className="text-base font-bold text-ink">
          {t("savedSchools", { count: visibleSavedSchools.length })}
        </h3>
        {visibleSavedSchools.length === 0 ? (
          <EmptyState
            className="mt-4"
            title={t("noSavedSchools")}
            description={t("noSavedSchoolsText")}
          />
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {visibleSavedSchools.map((school) => (
              <SchoolCard
                key={school.id}
                school={school}
                className="w-full"
                onToggled={(saved) => {
                  if (saved) return;
                  setHiddenSchoolIds((current) => new Set(current).add(school.id));
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Saved majors */}
      <section>
        <h3 className="text-base font-bold text-ink">
          {t("savedMajors", { count: visibleSavedMajors.length })}
        </h3>
        {visibleSavedMajors.length === 0 ? (
          <EmptyState
            className="mt-4"
            title={t("noSavedMajors")}
            description={t("noSavedMajorsText")}
          />
        ) : (
          <ul className="mt-4 space-y-2.5">
            {visibleSavedMajors.map((major) => (
              <li
                key={major.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-border-ink bg-card px-4 py-3"
              >
                <Link href={universityHref(major.school)} className="group min-w-0">
                  <p className="truncate text-base font-bold text-ink transition-colors group-hover:text-accent">
                    {major.name}
                  </p>
                  <p className="mt-0.5 text-[15px] text-ink-3">
                    {[
                      formatMajorPlace(
                        major.faculty,
                        getUniversityBySchoolId(major.school.id)?.short ?? major.school.name,
                      ),
                      major.category,
                      formatTuition(tFormat, major.tuitionFee),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </Link>
                <MajorUnsaveButton
                  majorId={major.id}
                  majorName={major.name}
                  onUnsaved={() =>
                    setHiddenMajorIds((current) => new Set(current).add(major.id))
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
