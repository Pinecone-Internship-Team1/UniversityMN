"use client";

import Link from "next/link";
import { Logo } from "./Logo";

const FOOTER_NAV_LINKS = [
  { label: "Сургууль", href: "/schools" },
  { label: "Мэргэжил", href: "/schools?tab=majors" },
  { label: "Тэтгэлэг", href: "/scholarships" },
  { label: "Элсэлт", href: "/admissions" },
  { label: "Харьцуулах", href: "/compare" },
];

const FOOTER_INFO_LINKS = [
  { label: "Бидний тухай", href: "/#what-we-do" },
  { label: "Манай баг", href: "/#team" },
];

export function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-paper">
      <div className="mx-auto max-w-[1440px] px-6 py-16 sm:px-8 sm:py-20">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Brand & Description */}
          <div className="lg:col-span-5">
            <Link
              href="/#top"
              className="inline-flex items-center max-lg:tap-target"
            >
              <Logo className="h-6" />
            </Link>
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-ink/70 sm:text-sm">
              Монголын их, дээд сургуулиудыг нэг дороос.
            </p>
            <p className="mt-3 max-w-sm text-xs leading-relaxed text-ink/50">
              Oyutan MN нь их, дээд сургуулиудын албан ёсны сайт биш, бие даасан
              мэдээллийн платформ. Бүртгүүлэхээсээ өмнө сургуулийн сайтаас
              шалгаарай.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="lg:col-span-3 lg:col-start-7">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink/50">
              Хэсгүүд
            </p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {FOOTER_NAV_LINKS.map((link) => (
                <li key={link.href} className="max-lg:relative">
                  <Link
                    href={link.href}
                    className="inline-block text-xs font-medium text-ink/70 transition-all duration-200 hover:translate-x-1 hover:text-accent max-lg:after:absolute max-lg:after:inset-x-0 max-lg:after:-inset-y-[5px] sm:text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info Links */}
          <div className="lg:col-span-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink/50">
              Тухай
            </p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {FOOTER_INFO_LINKS.map((link) => (
                <li key={link.href} className="max-lg:relative">
                  <Link
                    href={link.href}
                    className="inline-block text-xs font-medium text-ink/70 transition-all duration-200 hover:translate-x-1 hover:text-accent max-lg:after:absolute max-lg:after:inset-x-0 max-lg:after:-inset-y-[5px] sm:text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Credits */}
        <div className="mt-14 flex flex-col items-start gap-2 border-t border-ink/10 pt-6 text-xs text-ink/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Oyutan MN</p>
          <p className="font-medium text-ink/60">
            Made for Mongolian future 🇲🇳
          </p>
        </div>
      </div>
    </footer>
  );
}
