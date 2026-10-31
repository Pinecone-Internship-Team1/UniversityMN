import type { ReactNode } from "react";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import { Section, SectionHeader } from "@/components/ui/Section";
import { CONTACT_EMAIL, DATA_UPDATED_AT } from "@/lib/site";

export const FAQ_ITEMS: { question: string; answer: string; content?: ReactNode }[] = [
  {
    question: "Oyutan MN гэж юу вэ?",
    answer:
      "Монголын их, дээд сургуулиудын элсэлтийн мэдээллийг — босго оноо, мэргэжил, төлбөр, тэтгэлэг, элсэлтийн хуанлийг — нэг дор цуглуулсан платформ.",
  },
  {
    question: "Үнэгүй юу?",
    answer: "Тийм, бүрэн үнэгүй. Бүртгэл ч үнэгүй.",
  },
  {
    question: "Мэдээлэл хаанаас ирдэг вэ?",
    answer: "Сургуулиудын албан ёсны сайт, элсэлтийн журам, зарлалаас цуглуулдаг.",
  },
  {
    question: "Энэ албан ёсны сайт уу?",
    answer:
      "Үгүй. Бид аль ч сургуультай холбоогүй, бие даасан платформ. Эцсийн мэдээллийг сургуулийн сайтаас шалгаарай.",
  },
  {
    question: "Хэр олон шинэчилдэг вэ?",
    answer: `Шинэ элсэлтийн мэдээлэл зарлагдах бүрт шинэчилдэг. Сүүлд шинэчилсэн: ${DATA_UPDATED_AT}.`,
  },
  {
    question: "Алдаатай мэдээллийг хэрхэн мэдэгдэх вэ?",
    answer: `${CONTACT_EMAIL} хаягаар бичээрэй, бид шалгаад засна.`,
    content: (
      <>
        <a href={`mailto:${CONTACT_EMAIL}`} className="font-bold text-accent-strong underline underline-offset-4">
          {CONTACT_EMAIL}
        </a>{" "}
        хаягаар бичээрэй, бид шалгаад засна.
      </>
    ),
  },
];

export function Faq() {
  return (
    <Section id="faq" tone="muted">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <SectionHeader eyebrow="Асуулт, хариулт" title="Түгээмэл асуултууд" />
        <Accordion>
          {FAQ_ITEMS.map((item) => (
            <AccordionItem key={item.question} title={item.question} name="faq">
              <p>{item.content ?? item.answer}</p>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  );
}
