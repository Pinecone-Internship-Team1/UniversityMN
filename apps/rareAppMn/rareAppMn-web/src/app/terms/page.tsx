import type { Metadata } from "next";
import { LegalPage } from "@/components/layout/LegalPage";
import { SITE_NAME } from "@/lib/site";

// A draft: kept out of search results until the final text is written.
export const metadata: Metadata = {
  title: `Үйлчилгээний нөхцөл — ${SITE_NAME}`,
  robots: { index: false },
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage title="Үйлчилгээний нөхцөл">
      <p>
        Энэ бол үйлчилгээний нөхцөлийн урьдчилсан төсөл. Эцсийн хувилбар гарахаас
        өмнө агуулга нь өөрчлөгдөж болно.
      </p>
      <h2>Oyutan MN гэж юу вэ</h2>
      <p>
        Oyutan MN нь их, дээд сургуулиудын элсэлтийн мэдээллийг нэг дор цуглуулсан,
        үнэгүй, бие даасан платформ. Бид аль ч сургуулийн албан ёсны сайт биш.
      </p>
      <h2>Мэдээллийн үнэн зөв байдал</h2>
      <p>
        Мэдээллийг сургуулиудын албан ёсны сайт, элсэлтийн журмаас цуглуулдаг ч
        алдаа, хоцрогдол гарч болно. Босго оноо нь элсэлтийн баталгаа биш. Бүртгүүлэхээсээ
        өмнө эцсийн мэдээллийг сургуулийн сайтаас шалгаарай.
      </p>
    </LegalPage>
  );
}
