"use client";

import React, { useState } from "react";
import {
  ArrowUpRight,
  Search,
  Compass,
  ChevronRight,
  MapPin,
  DollarSign,
  Home as HomeIcon,
  GitCompare,
} from "lucide-react";

export default function RareAppMNPage() {
  const [score, setScore] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [compareList, setCompareList] = useState<string[]>([]);

  const toggleCompare = (name: string) => {
    if (compareList.includes(name)) {
      setCompareList(compareList.filter((item) => item !== name));
    } else {
      if (compareList.length < 3) {
        setCompareList([...compareList, name]);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-[#ECEEDF] selection:bg-[#E85D3A] selection:text-white font-sans antialiased relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[15%] left-[20%] w-72 h-72 bg-[#E85D3A]/[0.04] blur-[120px] rounded-full animate-[pulse_8s_infinite_ease-in-out]" />
        <div className="absolute top-[45%] right-[15%] w-96 h-96 bg-indigo-500/[0.03] blur-[150px] rounded-full animate-[pulse_10s_infinite_ease-in-out]" />
        <div className="absolute top-[75%] left-[30%] w-80 h-80 bg-amber-500/[0.03] blur-[130px] rounded-full animate-[pulse_12s_infinite_ease-in-out]" />

        <div className="absolute top-[12%] left-[18%] w-1 h-1 bg-white/30 rounded-full animate-[bounce_7s_infinite_ease-in-out]" />
        <div className="absolute top-[28%] right-[22%] w-1.5 h-1.5 bg-white/20 rounded-full blur-[0.5px] animate-[bounce_9s_infinite_ease-in-out]" />
        <div className="absolute top-[55%] left-[8%] w-1 h-1 bg-[#E85D3A]/40 rounded-full animate-[bounce_11s_infinite_ease-in-out]" />
        <div className="absolute top-[70%] right-[30%] w-1 h-1 bg-white/25 rounded-full animate-[bounce_8s_infinite_ease-in-out]" />
        <div className="absolute top-[85%] left-[40%] w-1.5 h-1.5 bg-indigo-300/20 rounded-full blur-[0.5px] animate-[bounce_10s_infinite_ease-in-out]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8">
        <header className="py-8 flex items-center justify-between border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <span className="font-serif font-bold text-2xl tracking-tight text-white">
              RareApp
              <span className="text-[#E85D3A] font-sans font-black">MN</span>
            </span>
            <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-white/30" />
            <span className="hidden sm:inline-block text-[11px] text-white/40 tracking-widest uppercase">
              Admission Hub
            </span>
          </div>

          <nav className="flex items-center gap-6 text-xs tracking-wider uppercase font-light">
            <a
              href="#calculator"
              className="text-white/60 hover:text-white transition"
            >
              Онооны Тохироо
            </a>
            <a
              href="#universities"
              className="text-white/60 hover:text-white transition"
            >
              Сургуулиуд
            </a>
            <a
              href="#features"
              className="text-white/60 hover:text-white transition"
            >
              Боломжууд
            </a>
            <button className="px-5 py-2 border border-white/20 rounded-full hover:bg-white hover:text-black transition duration-300 font-normal">
              Нэвтрэх
            </button>
          </nav>
        </header>

        <section className="pt-24 pb-16 max-w-4xl">
          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-normal text-white leading-[1.1] tracking-tight mb-8">
            Дараагийн давтагдашгүй <br />
            <span className="italic font-light text-white/50">бүлгээ</span>{" "}
            эндээс ол.
          </h1>

          <p className="text-sm sm:text-base text-white/50 max-w-xl font-light leading-relaxed mb-12">
            ЭЕШ-ын оноо, мэргэжлийн чиглэл, сургалтын төлбөр болон дотуур байрны
            нөхцөлүүдийг нэгтгэн харьцуулах боломжтой.
          </p>

          <div
            id="calculator"
            className="bg-white/[0.03] border border-white/10 rounded-2xl p-3 backdrop-blur-xl shadow-2xl transition duration-500 hover:border-white/20"
          >
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div className="sm:col-span-5 flex items-center gap-3 px-4 py-2 bg-black/20 rounded-xl border border-white/5">
                <Search className="w-4 h-4 text-white/30" />
                <input
                  type="number"
                  placeholder="ЭЕШ дундаж оноо (200-800)"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  className="w-full bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none font-light"
                />
              </div>

              <div className="sm:col-span-4 flex items-center px-4 py-2 bg-black/20 rounded-xl border border-white/5">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-transparent text-xs text-white/70 focus:outline-none cursor-pointer font-light appearance-none"
                >
                  <option value="all" className="bg-[#07090E] text-white">
                    Бүх салбар чиглэл
                  </option>
                  <option value="it" className="bg-[#07090E] text-white">
                    Мэдээллийн технологи & IT
                  </option>
                  <option value="biz" className="bg-[#07090E] text-white">
                    Бизнес, Менежмент
                  </option>
                  <option value="eng" className="bg-[#07090E] text-white">
                    Инженерчлэл & Архитектур
                  </option>
                  <option value="med" className="bg-[#07090E] text-white">
                    Анагаах & Эрүүл мэнд
                  </option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <button className="w-full bg-white text-black hover:bg-[#E85D3A] hover:text-white font-medium text-xs py-3.5 rounded-xl transition duration-300 flex items-center justify-center gap-2 shadow-lg">
                  <span>Шүүх</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-16 border-t border-white/[0.08]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white/[0.015] border border-white/5 hover:border-white/10 transition group">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#E85D3A] mb-4">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg text-white font-normal mb-2">
                Онооны Тохироо
              </h3>
              <p className="text-xs text-white/40 font-light leading-relaxed">
                Өөрийн ЭЕШ-ын оноонд тохирох босготой сургуулиудыг автоматаар
                эрэмбэлнэ.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.015] border border-white/5 hover:border-white/10 transition group">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-amber-400 mb-4">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg text-white font-normal mb-2">
                Төлбөр & Тэтгэлэг
              </h3>
              <p className="text-xs text-white/40 font-light leading-relaxed">
                1 кредитийн төлбөр болон тэтгэлгийн нөхцлийг шууд харьцуулах
                боломж.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.015] border border-white/5 hover:border-white/10 transition group">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-sky-400 mb-4">
                <HomeIcon className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg text-white font-normal mb-2">
                Дотуур байр
              </h3>
              <p className="text-xs text-white/40 font-light leading-relaxed">
                Кампусын байршил болон дотуур байрны нөхцөл, хуваарилалтын
                мэдээлэл.
              </p>
            </div>
          </div>
        </section>

        <section
          id="universities"
          className="py-16 border-t border-white/[0.08]"
        >
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="text-[11px] uppercase tracking-widest text-white/40 block mb-2">
                Directory
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl text-white font-normal">
                Онцлох Сургуулиуд
              </h2>
            </div>
            <a
              href="#"
              className="text-xs text-white/50 hover:text-white transition flex items-center gap-1"
            >
              <span>Бүх сургуулиуд</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group bg-white/[0.02] border border-white/10 hover:border-white/20 rounded-2xl p-6 transition duration-300 flex flex-col justify-between hover:-translate-y-1">
              <div>
                <div className="flex items-start justify-between mb-6">
                  <span className="font-serif text-2xl font-normal text-white group-hover:text-[#E85D3A] transition">
                    МУИС
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-emerald-400 border border-emerald-400/20 px-2 py-0.5 rounded-md bg-emerald-400/5">
                    Бүртгэл Нээлттэй
                  </span>
                </div>

                <h3 className="font-serif text-lg text-white mb-1 font-light">
                  Монгол Улсын Их Сургууль
                </h3>
                <p className="text-xs text-white/40 font-light flex items-center gap-1.5 mb-6">
                  <MapPin className="w-3.5 h-3.5" />
                  Улаанбаатар, Сүхбаатар дүүрэг
                </p>

                <div className="space-y-2 border-t border-white/5 pt-4 text-xs font-light text-white/60">
                  <div className="flex justify-between">
                    <span className="text-white/30">Босго оноо:</span>
                    <span className="text-white font-normal">480 - 560</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/30">Жилийн төлбөр:</span>
                    <span className="text-white font-normal">
                      3.2M - 4.8M ₮
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                <button
                  onClick={() => toggleCompare("МУИС")}
                  className={`text-[11px] font-light transition ${compareList.includes("МУИС") ? "text-[#E85D3A]" : "text-white/40 hover:text-white"}`}
                >
                  {compareList.includes("МУИС")
                    ? "✓ Харьцуулж байна"
                    : "+ Харьцуулах"}
                </button>
                <button className="text-white hover:text-[#E85D3A] transition flex items-center gap-1 font-light">
                  <span>Мэдээлэл</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="group bg-white/[0.02] border border-white/10 hover:border-white/20 rounded-2xl p-6 transition duration-300 flex flex-col justify-between hover:-translate-y-1">
              <div>
                <div className="flex items-start justify-between mb-6">
                  <span className="font-serif text-2xl font-normal text-white group-hover:text-[#E85D3A] transition">
                    ШУТИС
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-emerald-400 border border-emerald-400/20 px-2 py-0.5 rounded-md bg-emerald-400/5">
                    Бүртгэл Нээлттэй
                  </span>
                </div>

                <h3 className="font-serif text-lg text-white mb-1 font-light">
                  Шинжлэх Ухаан Технологийн Их Сургууль
                </h3>
                <p className="text-xs text-white/40 font-light flex items-center gap-1.5 mb-6">
                  <MapPin className="w-3.5 h-3.5" />
                  Улаанбаатар, Баянзүрх дүүрэг
                </p>

                <div className="space-y-2 border-t border-white/5 pt-4 text-xs font-light text-white/60">
                  <div className="flex justify-between">
                    <span className="text-white/30">Босго оноо:</span>
                    <span className="text-white font-normal">450 - 520</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/30">Жилийн төлбөр:</span>
                    <span className="text-white font-normal">
                      2.8M - 4.1M ₮
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                <button
                  onClick={() => toggleCompare("ШУТИС")}
                  className={`text-[11px] font-light transition ${compareList.includes("ШУТИС") ? "text-[#E85D3A]" : "text-white/40 hover:text-white"}`}
                >
                  {compareList.includes("ШУТИС")
                    ? "✓ Харьцуулж байна"
                    : "+ Харьцуулах"}
                </button>
                <button className="text-white hover:text-[#E85D3A] transition flex items-center gap-1 font-light">
                  <span>Мэдээлэл</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="group bg-white/[0.02] border border-white/10 hover:border-white/20 rounded-2xl p-6 transition duration-300 flex flex-col justify-between hover:-translate-y-1">
              <div>
                <div className="flex items-start justify-between mb-6">
                  <span className="font-serif text-2xl font-normal text-white group-hover:text-[#E85D3A] transition">
                    ХААИС
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-amber-400 border border-amber-400/20 px-2 py-0.5 rounded-md bg-amber-400/5">
                    Элсэлт Эхлэх Гэж Буй
                  </span>
                </div>

                <h3 className="font-serif text-lg text-white mb-1 font-light">
                  Хөдөө Аж Ахуйн Их Сургууль
                </h3>
                <p className="text-xs text-white/40 font-light flex items-center gap-1.5 mb-6">
                  <MapPin className="w-3.5 h-3.5" />
                  Улаанбаатар, Хан-Уул дүүрэг
                </p>

                <div className="space-y-2 border-t border-white/5 pt-4 text-xs font-light text-white/60">
                  <div className="flex justify-between">
                    <span className="text-white/30">Босго оноо:</span>
                    <span className="text-white font-normal">420 - 480</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/30">Жилийн төлбөр:</span>
                    <span className="text-white font-normal">
                      2.2M - 3.5M ₮
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                <button
                  onClick={() => toggleCompare("ХААИС")}
                  className={`text-[11px] font-light transition ${compareList.includes("ХААИС") ? "text-[#E85D3A]" : "text-white/40 hover:text-white"}`}
                >
                  {compareList.includes("ХААИС")
                    ? "✓ Харьцуулж байна"
                    : "+ Харьцуулах"}
                </button>
                <button className="text-white hover:text-[#E85D3A] transition flex items-center gap-1 font-light">
                  <span>Мэдээлэл</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {compareList.length > 0 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-[#0C101A]/90 border border-white/20 backdrop-blur-xl px-6 py-3.5 rounded-2xl flex items-center gap-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-2">
              <GitCompare className="w-4 h-4 text-[#E85D3A]" />
              <span className="text-xs text-white font-light">
                Харьцуулалт ({compareList.length}/3):
              </span>
            </div>

            <div className="flex items-center gap-2">
              {compareList.map((item) => (
                <span
                  key={item}
                  className="px-2.5 py-1 rounded-lg bg-white/10 text-xs font-serif text-white"
                >
                  {item}
                </span>
              ))}
            </div>

            <button className="bg-white text-black hover:bg-[#E85D3A] hover:text-white text-xs px-4 py-1.5 rounded-xl font-medium transition duration-300">
              Харьцуулах
            </button>
          </div>
        )}

        <footer className="py-12 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/30 font-light">
          <div>© 2026 RareAppMN. Элсэлтийн нэгдсэн платформ.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition">
              Нууцлал
            </a>
            <a href="#" className="hover:text-white transition">
              Нөхцөл
            </a>
            <a href="#" className="hover:text-white transition">
              Холбоо барих
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
