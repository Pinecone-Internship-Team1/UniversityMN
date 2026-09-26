"use client";

import Link from "next/link";

const FOOTER_NAV_LINKS = [
  { label: "Сургууль", href: "#discovery" },
  { label: "Мэргэжил", href: "#major" },
  { label: "Тэтгэлэг", href: "#scholarships" },
  { label: "Элсэлт", href: "#deadlines" },
  { label: "Харьцуулах", href: "#compare" },
];

const FOOTER_INFO_LINKS = [
  { label: "Бидний тухай", href: "#what-we-do" },
  { label: "Манай баг", href: "#team" },
  { label: "Холбоо барих", href: "#contact" },
];

export function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-paper">
      <div className="mx-auto max-w-[1440px] px-6 py-16 sm:px-8 sm:py-20">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Brand & Description */}
          <div className="lg:col-span-5">
            <Link
              href="#top"
              className="inline-flex items-baseline gap-1.5 text-xl font-bold tracking-tight text-ink"
            >
              Oyutan
              <span className="text-accent">MN</span>
            </Link>
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-ink/70 sm:text-sm">
              Монголын их, дээд сургуулиудыг нэг дороос.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="lg:col-span-3 lg:col-start-7">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink/50">
              Хэсгүүд
            </p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {FOOTER_NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-block text-xs font-medium text-ink/70 transition-all duration-200 hover:translate-x-1 hover:text-accent sm:text-sm"
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
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="inline-block text-xs font-medium text-ink/70 transition-all duration-200 hover:translate-x-1 hover:text-accent sm:text-sm"
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
