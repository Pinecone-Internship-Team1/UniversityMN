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
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5">
            <a
              href="#top"
              className="flex items-baseline gap-2 font-display text-lg font-semibold tracking-tight text-ink"
            >
              Oyuтan
              <span className="text-accent">MN</span>
            </a>
            <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-ink-soft">
              Монголын их, дээд сургуулиудыг нэг дороос.
            </p>
          </div>

          <div className="lg:col-span-3 lg:col-start-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-soft">
              Хэсгүүд
            </p>
            <ul className="mt-5 flex flex-col gap-3">
              {FOOTER_NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-[14px] text-ink-soft transition-colors hover:text-ink"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-soft">
              Тухай
            </p>
            <ul className="mt-5 flex flex-col gap-3">
              {FOOTER_INFO_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-[14px] text-ink-soft transition-colors hover:text-ink"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start gap-2 border-t border-ink/10 pt-6 text-[12px] text-ink-soft sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Oyuтan MN</p>
          <p>Made by Mongolian students 🇲🇳</p>
        </div>
      </div>
    </footer>
  );
}
