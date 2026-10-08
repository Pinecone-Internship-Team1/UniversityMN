"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { useClient } from "urql";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatDate } from "@/lib/format";
import {
  USER_BY_CLERK_ID_QUERY,
  type UserByClerkIdResult,
  type UserByClerkIdVariables,
} from "@/lib/graphql/documents";
import { getErrorMessage } from "@/lib/graphql/errors";

type LookupState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done"; user: UserByClerkIdResult["userByClerkId"] };

export function UserLookup() {
  const client = useClient();
  const [clerkUserId, setClerkUserId] = useState("");
  const [state, setState] = useState<LookupState>({ status: "idle" });

  async function handleLookup() {
    const id = clerkUserId.trim();
    if (!id) {
      setState({ status: "error", message: "Clerk хэрэглэгчийн ID оруулна уу." });
      return;
    }
    setState({ status: "loading" });
    const result = await client
      .query<UserByClerkIdResult, UserByClerkIdVariables>(
        USER_BY_CLERK_ID_QUERY,
        { clerkUserId: id },
        { requestPolicy: "network-only" },
      )
      .toPromise();
    if (result.error) {
      setState({ status: "error", message: getErrorMessage(result.error) });
      return;
    }
    setState({ status: "done", user: result.data?.userByClerkId ?? null });
  }

  return (
    <div className="max-w-2xl rounded-2xl border border-ink/10 bg-card p-6">
      <h2 className="text-lg font-bold text-ink">Хэрэглэгч хайх</h2>
      <p className="mt-1 text-xs text-ink/60">
        Clerk хэрэглэгчийн ID-аар (жишээ: user_...) системд бүртгэлтэй эсэх, оноо,
        хадгалсан зүйлсийг нь харна.
      </p>
      <form
        className="mt-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          void handleLookup();
        }}
      >
        <Input
          value={clerkUserId}
          onChange={(event) => setClerkUserId(event.target.value)}
          placeholder="user_..."
          aria-label="Clerk хэрэглэгчийн ID"
        />
        <Button type="submit" variant="solid" size="md" disabled={state.status === "loading"}>
          <Search className="h-3.5 w-3.5" />
          Хайх
        </Button>
      </form>

      <div className="mt-5" aria-live="polite">
        {state.status === "error" && (
          <p className="text-xs font-medium text-destructive">{state.message}</p>
        )}
        {state.status === "done" && !state.user && (
          <p className="text-sm text-ink/60">Ийм ID-тай хэрэглэгч бүртгэгдээгүй байна.</p>
        )}
        {state.status === "done" && state.user && (
          <div className="space-y-3 rounded-xl border border-ink/10 bg-paper p-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-bold text-ink">{state.user.name ?? "Нэр тодорхойгүй"}</p>
              <Badge variant={state.user.role === "ADMIN" ? "accent" : "default"}>
                {state.user.role === "ADMIN" ? "Админ" : "Сурагч"}
              </Badge>
            </div>
            <p className="text-xs text-ink/70">{state.user.email}</p>
            <p className="text-xs text-ink/60">
              Бүртгүүлсэн: {formatDate(state.user.createdAt)} · Шинэчилсэн:{" "}
              {formatDate(state.user.updatedAt)}
            </p>
            <p className="text-xs text-ink/70">
              <span className="font-semibold text-ink">Оноо: </span>
              {Object.entries(state.user.scores ?? {})
                .map(([subject, score]) => `${subject} ${score}`)
                .join(", ") || "Оруулаагүй"}
            </p>
            <p className="text-xs text-ink/70">
              <span className="font-semibold text-ink">Хадгалсан сургууль: </span>
              {state.user.savedSchools.map((school) => school.name).join(", ") || "Байхгүй"}
            </p>
            <p className="text-xs text-ink/70">
              <span className="font-semibold text-ink">Хадгалсан мэргэжил: </span>
              {state.user.savedMajors.map((major) => major.name).join(", ") || "Байхгүй"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
