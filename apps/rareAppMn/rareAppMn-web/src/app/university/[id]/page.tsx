import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  GraduationCap,
  Banknote,
  BookOpen,
  Globe,
  Award,
} from "lucide-react";
import { UNIVERSITIES } from "@/lib/university-logos";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

// Data details ngam kala duɗal jaaɓi-haaɗtirde
interface UniversityDetail {
  id: string;
  category: string;
  location: string;
  avgTuition: string;
  avgEESH: string;
  website: string;
  description: string;
  majors: string[];
  scholarships: string[];
}

const UNIVERSITY_DETAILS: Record<string, UniversityDetail> = {
  muis: {
    id: "muis",
    category: "Улсын их сургууль",
    location: "Сүхбаатар дүүрэг, Улаанбаатар",
    avgTuition: "3.8 - 5.2 сая ₮",
    avgEESH: "580+",
    website: "https://www.num.edu.mn",
    description:
      "Монгол Улсын Их Сургууль нь 1942 онд байгуулагдсан Монгол улсын анхны бөгөөд тэргүүлэх их сургууль юм.",
    majors: [
      "Компьютерийн ухаан",
      "Мэдээллийн технологи",
      "Бизнесийн удирдлага",
      "Олон улсын харилцаа",
      "Физик",
    ],
    scholarships: [
      "Засгийн газрын тэтгэлэг",
      "МУИС-ийн нэрэмжит тэтгэлэг",
      "Ирээдүйн залуус тэтгэлэг",
    ],
  },
  shutis: {
    id: "shutis",
    category: "Улсын их сургууль",
    location: "Сүхбаатар дүүрэг, Улаанбаатар",
    avgTuition: "3.5 - 4.8 сая ₮",
    avgEESH: "550+",
    website: "https://www.must.edu.mn",
    description:
      "Шинжлэх Ухаан Технологийн Их Сургууль нь инженер, технологийн чиглэлээр улсдаа тэргүүлэх сургууль юм.",
    majors: [
      "Програмгамж",
      "Сүлжээний инженер",
      "Барилгын инженер",
      "Архитектур",
      "Машин үйлдвэрлэл",
    ],
    scholarships: [
      "ШУТИС-ийн захирлын нэрэмжит тэтгэлэг",
      "Инженер ирээдүй тэтгэлэг",
    ],
  },
  ashuuis: {
    id: "ashuuis",
    category: "Улсын их сургууль",
    location: "Сүхбаатар дүүрэг, Улаанбаатар",
    avgTuition: "4.2 - 6.5 сая ₮",
    avgEESH: "620+",
    website: "https://www.mnums.edu.mn",
    description:
      "Анагаахын Шинжлэх Ухааны Үндэсний Их Сургууль нь эрүүл мэнди, анагаах ухааны салбарын мэргэжилтнүүдийг бэлтгэдэг.",
    majors: [
      "Хүний эмч",
      "Нүүр ам судлал",
      "Эм зүй",
      "Нийтийн эрүүл мэнд",
      "Уламжлалт анагаах",
    ],
    scholarships: [
      "Эрүүл мэндийн яамны тэтгэлэг",
      "АШУҮИС-ийн нэрэмжит тэтгэлэг",
    ],
  },
  sezis: {
    id: "sezis",
    category: "Хувийн их сургууль",
    location: "Баянзүрх дүүрэг, Улаанбаатар",
    avgTuition: "6.5 - 9.5 сая ₮",
    avgEESH: "600+",
    website: "https://www.ufe.edu.mn",
    description:
      "Санхүү Эдийн Засгийн Их Сургууль нь бизнес, санхүү, менежментийн сургалтаар тэргүүлэгч сургуулиудын нэг юм.",
    majors: [
      "Санхүү ба банк",
      "Нягтлан бодох бүртгэл",
      "Маркетинг",
      "Бизнесийн аналитик",
    ],
    scholarships: ["UFE Merit Scholarship", "Бизнес ирээдүй тэтгэлэг"],
  },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function UniversityDetailPage({ params }: PageProps) {
  const { id } = await params;
  const baseLogo = UNIVERSITIES[id];
  const detail = UNIVERSITY_DETAILS[id];

  if (!baseLogo) {
    notFound();
  }

  const shortName = baseLogo.short;
  const fullName = baseLogo.full;
  const imageSrc = baseLogo.image;

  return (
    <div className="min-h-screen bg-paper text-ink">
      <Navbar />

      <main className="mx-auto max-w-[1440px] px-6 py-12 sm:px-8 sm:py-20">
        {/* Back Link */}
        <Link
          href="/#discovery"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink/60 transition-colors hover:text-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          Буцах
        </Link>

        {/* Header Hero Section */}
        <div className="mt-8 flex flex-col gap-8 rounded-3xl border border-ink/10 bg-card p-6 sm:p-10 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-6">
            {imageSrc && (
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-ink/10 bg-paper p-2 shadow-xs sm:h-24 sm:w-24">
                <Image
                  src={imageSrc}
                  alt={`${shortName} лого`}
                  fill
                  className="object-contain p-1"
                />
              </div>
            )}
            <div>
              <span className="rounded-full bg-ink/5 px-3 py-1 text-xs font-semibold text-ink/70">
                {detail?.category || "Их сургууль"}
              </span>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                {shortName}
              </h1>
              <p className="mt-1 text-sm font-medium text-ink/60 sm:text-base">
                {fullName}
              </p>
            </div>
          </div>

          {detail?.website && (
            <Link
              href={detail.website}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-xs font-semibold uppercase tracking-wider text-paper transition-all hover:bg-accent"
            >
              <Globe className="h-4 w-4" />
              Албан ёсны сайт
            </Link>
          )}
        </div>

        {/* Grid Content Section */}
        <div className="mt-10 grid gap-8 md:grid-cols-12">
          <div className="space-y-8 md:col-span-8">
            <section className="rounded-2xl border border-ink/10 bg-card p-6 sm:p-8">
              <h2 className="text-xl font-bold tracking-tight text-ink">
                Сургуулийн тухай
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-ink/80 sm:text-base">
                {detail?.description ||
                  `${fullName} нь салбартаа манлайлагч, чанартай боловсрол олгодог тэргүүлэгч сургуулиудын нэг юм.`}
              </p>
            </section>

            {/* Major Courses */}
            <section className="rounded-2xl border border-ink/10 bg-card p-6 sm:p-8">
              <div className="flex items-center gap-2 text-ink">
                <BookOpen className="h-5 w-5 text-accent" />
                <h2 className="text-xl font-bold tracking-tight">
                  Эрэлттэй мэргэжлүүд
                </h2>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {(
                  detail?.majors || [
                    "Компьютерийн ухаан",
                    "Инженерчлэл",
                    "Бизнес",
                  ]
                ).map((m) => (
                  <span
                    key={m}
                    className="rounded-xl border border-ink/10 bg-paper px-4 py-2 text-xs font-semibold text-ink"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </section>

            {/* Scholarships */}
            <section className="rounded-2xl border border-ink/10 bg-card p-6 sm:p-8">
              <div className="flex items-center gap-2 text-ink">
                <Award className="h-5 w-5 text-accent" />
                <h2 className="text-xl font-bold tracking-tight">
                  Тэтгэлэг ба Боломжууд
                </h2>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-ink/80">
                {(
                  detail?.scholarships || [
                    "Сургуулийн нэрэмжит тэтгэлэг",
                    "Засгийн газрын тэтгэлэг",
                  ]
                ).map((s) => (
                  <li key={s} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    {s}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Sidebar Specs */}
          <div className="md:col-span-4">
            <div className="sticky top-28 space-y-4 rounded-2xl border border-ink/10 bg-card p-6">
              <h3 className="text-base font-bold text-ink">Ерөнхий мэдээлэл</h3>

              <div className="space-y-4 pt-2 text-xs text-ink/80">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 text-ink/40" />
                  <div>
                    <p className="font-semibold text-ink">Байршил</p>
                    <p className="mt-0.5">
                      {detail?.location || "Улаанбаатар хот"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 border-t border-ink/10 pt-3">
                  <Banknote className="mt-0.5 h-4 w-4 text-ink/40" />
                  <div>
                    <p className="font-semibold text-ink">Сургалтын төлбөр</p>
                    <p className="mt-0.5">
                      {detail?.avgTuition || "3.5 - 5.0 сая ₮"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 border-t border-ink/10 pt-3">
                  <GraduationCap className="mt-0.5 h-4 w-4 text-ink/40" />
                  <div>
                    <p className="font-semibold text-ink">ЭЕШ босго оноо</p>
                    <p className="mt-0.5">{detail?.avgEESH || "500+"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
