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
import { getErrorMessage } from "@/lib/graphql/errors";
import type { Major } from "@/lib/graphql/types";
import { MAX_EXAM_SCORE, parseScoreEntries } from "@/lib/validation";

type CheckableMajor = Pick<Major, "id" | "name" | "requiredSubjects" | "cutOffScore">;

export interface MajorScoreCheckProps {
  majors: CheckableMajor[];
}

type Outcome = AnalyzeScoreMatchResult["analyzeScoreMatch"];

export function MajorScoreCheck({ majors }: MajorScoreCheckProps) {
  const checkable = majors.filter((major) => (major.requiredSubjects ?? []).length > 0);
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
  const subjects = selected.requiredSubjects ?? [];

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
              {major.cutOffScore != null ? ` (босго ${major.cutOffScore})` : ""}
            </option>
          ))}
        </Select>
      </label>

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
        <div
          className="mt-5 rounded-xl border border-ink/10 bg-paper p-4"
          aria-live="polite"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold text-ink">{outcome.major.name}</p>
            <Badge variant={outcome.eligible ? "accent" : "outline"}>
              {outcome.eligible ? "Босго хангаж байна" : "Босго хангахгүй"} ·{" "}
              {Math.round(outcome.matchScore * 100)}%
            </Badge>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink/[0.06]">
            <div
              className={outcome.eligible ? "h-full bg-accent" : "h-full bg-ink/40"}
              style={{ width: `${Math.min(outcome.matchScore, 1) * 100}%` }}
            />
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ink/70">{outcome.reason}</p>
        </div>
      )}
    </section>
  );
}
