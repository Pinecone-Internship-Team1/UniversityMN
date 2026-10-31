import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";
import { SITE_NAME } from "@/lib/site";

// A draft: kept out of search results until the final text is written.
export const metadata: Metadata = {
  title: `Нууцлалын бодлого — ${SITE_NAME}`,
  robots: { index: false },
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Нууцлалын бодлого">
      <p>
        Энэ бол нууцлалын бодлогын урьдчилсан төсөл. Эцсийн хувилбар гарахаас
        өмнө агуулга нь өөрчлөгдөж болно.
      </p>
      <h2>Бид ямар мэдээлэл хадгалдаг вэ</h2>
      <p>
        Бүртгүүлэхэд таны и-мэйл хаяг ашиглагдана. Нэвтэрсний дараа таны хадгалсан
        сургууль, мэргэжил, профайлдаа оруулсан ЭЕШ оноо хадгалагдана.
      </p>
      <p>
        Сайтын хандалтыг тоолохын тулд хөтөч бүрт хувийн мэдээлэл агуулаагүй
        санамсаргүй дугаар үүсгэдэг.
      </p>
      <h2>Мэдээллийг юунд ашигладаг вэ</h2>
      <p>
        Зөвхөн танд хадгалсан зүйлсийг тань харуулах, оноонд тохирох мэргэжлийг
        санал болгоход ашиглана. Бид таны мэдээллийг худалдахгүй.
      </p>
    </LegalPage>
  );
}
