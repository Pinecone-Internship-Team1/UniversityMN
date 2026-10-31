import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { StatusPage } from "@/components/layout/StatusPage";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: `Хуудас олдсонгүй — ${SITE_NAME}`,
};

export default function NotFound() {
  return (
    <PageShell>
      <StatusPage
        code="404"
        title="Хуудас олдсонгүй"
        description="Таны хайсан хуудас устсан, нэр нь өөрчлөгдсөн эсвэл хаяг буруу бичигдсэн байж магадгүй."
      />
    </PageShell>
  );
}
