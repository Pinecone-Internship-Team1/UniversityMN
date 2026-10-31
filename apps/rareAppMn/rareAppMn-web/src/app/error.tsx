"use client"; // Error boundaries must be Client Components

import Link from "next/link";
import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { PageShell } from "@/components/layout/PageShell";
import { StatusPage } from "@/components/layout/StatusPage";
import { buttonClassName } from "@/components/ui/Button";

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageShell>
      <title>Алдаа гарлаа — Oyutan MN</title>
      <StatusPage
        code="Өө!"
        title="Уучлаарай, алдаа гарлаа"
        description="Хуудсыг ачаалах үед асуудал гарлаа. Дахин оролдох эсвэл нүүр хуудас руу буцна уу."
        actions={
          <>
            <button type="button" onClick={() => retry()} className={buttonClassName({})}>
              <RotateCcw />
              Дахин оролдох
            </button>
            <Link href="/" className={buttonClassName({ variant: "secondary" })}>
              Нүүр хуудас
            </Link>
          </>
        }
      />
    </PageShell>
  );
}
