"use client";

import { useAuth } from "@clerk/nextjs";
import { Calculator } from "lucide-react";
import { useState } from "react";
import { useClient, useQuery } from "urql";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  ANALYZE_SCORE_MATCH_QUERY,
  USER_PROFILE_CACHE,
  VIEWER_QUERY,
  type AnalyzeScoreMatchResult,
  type AnalyzeScoreMatchVariables,
  type ViewerQueryResult,
} from "@/lib/graphql/documents";
import { VERDICT_LABELS, examSubjectLines, formatCutOff, isScoredVerdict } from "@/lib/format";
import { getErrorMessage } from "@/lib/graphql/errors";
import type { Major } from "@/lib/graphql/types";
import { MAX_EXAM_SCORE, parseScoreEntries } from "@/lib/validation";

type CheckableMajor = Pick<
  Major,
  | "id"
  | "name"
  | "requiredSubjects"
  | "primarySubjects"
  | "secondarySubjects"
  | "examNote"
  | "cutOffScore"
  | "secondaryCutOffScore"
>;

/** Run by the school itself, so there is no ЭЕШ score to enter for it. */
const SKILL_EXAM = "Ур чадварын шалгалт";

/** The ЭЕШ subjects a student can enter scores for. */
function scorableSubjects(major: CheckableMajor): string[] {
  const subjects =
    (major.primarySubjects ?? []).length > 0
      ? [...(major.primarySubjects ?? []), ...(major.secondarySubjects ?? [])]
      : (major.requiredSubjects ?? []);
  return [...new Set(subjects)].filter((subject) => subject !== SKILL_EXAM);
}

export interface MajorScoreCheckProps {
  majors: CheckableMajor[];
}

type Outcome = AnalyzeScoreMatchResult["analyzeScoreMatch"];

export function MajorScoreCheck({ majors }: MajorScoreCheckProps) {
  // A program with only an exam note (e.g. unknown суурь/дагалдах split) is listed so the
  // student sees why it can't be checked, instead of it silently missing.
  const checkable = majors.filter(
    (major) => scorableSubjects(major).length > 0 || Boolean(major.examNote),
  );
  const { isSignedIn } = useAuth();
  const client = useClient();

  const [{ data: viewerData }] = useQuery<ViewerQueryResult>({
    query: VIEWER_QUERY,
    pause: !isSignedIn,
    context: USER_PROFILE_CACHE,
  });
  const savedScores = viewerData?.me?.scores ?? null;

  const [majorId, setMajorId] = useState(checkable[0]?.id ?? "");
  const [scores, setScores] = useState<Record<string, string>>({});
  const [prefilledFrom, setPrefilledFrom] = useState<Record<string, number> | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  if (savedScores && prefilledFrom !== savedScores) {
    setPrefilledFrom(savedScores);
    setScores((current) => {
      const next = { ...current };
      for (const [subject, value] of Object.entries(savedScores)) {
        if (!next[subject]) next[subject] = String(value);
      }
      return next;
    });
  }

  const selected = checkable.find((major) => major.id === majorId) ?? checkable[0];
  if (!selected) return null;
  const subjects = scorableSubjects(selected);
  const exams = examSubjectLines(selected);

  async function handleCheck() {
    if (!selected) return;
    setErrorMessage(null);
    setOutcome(null);

    const parsed = parseScoreEntries(
      subjects.map((subject) => ({ subject, score: scores[subject] ?? "" })),
    );
    if (!parsed.ok) {
      setErrorMessage(parsed.error);
      return;
    }
    if (Object.keys(parsed.value).length === 0) {
      setErrorMessage("Дор хаяж нэг хичээлийн оноо оруулна уу.");
      return;
    }

    setChecking(true);
    const result = await client
      .query<AnalyzeScoreMatchResult, AnalyzeScoreMatchVariables>(
        ANALYZE_SCORE_MATCH_QUERY,
        { majorId: selected.id, scores: parsed.value },
        { requestPolicy: "network-only" },
      )
      .toPromise();
    setChecking(false);

    if (result.error) {
      setErrorMessage(getErrorMessage(result.error));
      return;
    }
    setOutcome(result.data?.analyzeScoreMatch ?? null);
  }

  return (
    <section className="rounded-2xl border border-ink/10 bg-card p-6 sm:p-8">
      <div className="flex items-center gap-2 text-ink">
        <Calculator className="h-5 w-5 text-accent" />
        <h2 className="text-xl font-bold tracking-tight">Оноогоо шалгах</h2>
      </div>
      <p className="mt-2 text-sm text-ink/60">
        Мэргэжлээ сонгоод ЭЕШ-ийн оноогоо оруулбал босго оноог хангаж буй эсэхийг харуулна.
        {isSignedIn ? " Профайлдаа хадгалсан оноо автоматаар бөглөгдөнө." : ""}
      </p>

      <label className="mt-5 flex flex-col gap-1.5 text-xs font-semibold text-ink/70">
        Мэргэжил
        <Select
          value={selected.id}
          onChange={(event) => {
            setMajorId(event.target.value);
            setOutcome(null);
            setErrorMessage(null);
          }}
        >
          {checkable.map((major) => (
            <option key={major.id} value={major.id}>
              {major.name}
              {major.cutOffScore != null ? ` (босго ${formatCutOff(major)})` : ""}
            </option>
          ))}
        </Select>
      </label>

      {((selected.primarySubjects ?? []).length > 0 || selected.examNote) && (
        <div className="mt-3 rounded-lg bg-ink/[0.03] px-3 py-2 text-[11px] leading-relaxed text-ink/60">
          {exams.map((exam) => (
            <p key={exam.label}>
              <span className="font-semibold text-ink/70">{exam.label}:</span> {exam.text}
            </p>
          ))}
          {(selected.primarySubjects ?? []).length > 0 && (
            <p className="mt-1">
              Суурь жагсаалтаас нэг, дагалдахаас нэг шалгалт өгнө. Оноо = 0.7 × суурь + 0.3 ×
              дагалдах.
            </p>
          )}
          {selected.examNote && <p className="mt-1">{selected.examNote}</p>}
        </div>
      )}

      {subjects.length === 0 ? (
        <div className="mt-4 flex items-center gap-3">
          <Badge variant="default">{VERDICT_LABELS.CHECK_WITH_SCHOOL}</Badge>
          <p className="text-xs text-ink/60">Энэ хөтөлбөрийн оноог тооцох боломжгүй.</p>
        </div>
      ) : (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {subjects.map((subject) => (
              <label
                key={subject}
                className="flex flex-col gap-1.5 text-xs font-semibold text-ink/70"
              >
                {subject}
                <Input
                  type="number"
                  min={0}
                  max={MAX_EXAM_SCORE}
                  inputMode="numeric"
                  value={scores[subject] ?? ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    setScores((current) => ({ ...current, [subject]: value }));
                    setOutcome(null);
                  }}
                  placeholder={`0-${MAX_EXAM_SCORE}`}
                />
              </label>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button variant="solid" size="md" onClick={handleCheck} disabled={checking}>
              {checking ? "Шалгаж байна..." : "Шалгах"}
            </Button>
            {errorMessage && <p className="text-xs font-medium text-destructive">{errorMessage}</p>}
          </div>

          {outcome && (
            <div className="mt-5 rounded-xl border border-ink/10 bg-paper p-4" aria-live="polite">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-ink">{outcome.major.name}</p>
                <Badge
                  variant={
                    outcome.verdict === "ELIGIBLE"
                      ? "accent"
                      : outcome.verdict === "CHECK_WITH_SCHOOL"
                        ? "default"
                        : "outline"
                  }
                >
                  {VERDICT_LABELS[outcome.verdict]}
                  {isScoredVerdict(outcome.verdict) &&
                    ` · ${Math.round(outcome.matchScore * 100)}%`}
                </Badge>
              </div>
              {isScoredVerdict(outcome.verdict) && (
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink/[0.06]">
                  <div
                    className={outcome.eligible ? "h-full bg-accent" : "h-full bg-ink/40"}
                    style={{ width: `${Math.min(outcome.matchScore, 1) * 100}%` }}
                  />
                </div>
              )}
              <p className="mt-3 text-xs leading-relaxed text-ink/70">{outcome.reason}</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
