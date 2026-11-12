"use client"; // Error boundaries must be Client Components

import Link from "next/link";
import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("status");
  const tc = useTranslations("common");
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PageShell>
      <title>{`${t("errorTabTitle")} — Oyutan MN`}</title>
      <StatusPage
        code={t("errorCode")}
        title={t("errorTitle")}
        description={t("errorText")}
        actions={
          <>
            <button type="button" onClick={() => retry()} className={buttonClassName({})}>
              <RotateCcw />
              {tc("retry")}
            </button>
            <Link href="/" className={buttonClassName({ variant: "secondary" })}>
              {tc("home")}
            </Link>
          </>
        }
      />
    </PageShell>
  );
}
