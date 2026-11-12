import Link from "next/link";
import { Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { FaFacebook, FaInstagram } from "react-icons/fa";
import { Container } from "@/components/ui/Container";
import { CONTACT_EMAIL, SOCIAL_LINKS } from "@/lib/site";
import { Logo } from "./Logo";

/** Titles and labels are keys in the "footer" messages (null title = the brand name). */
const FOOTER_SECTIONS = [
  {
    title: "sections",
    links: [
      { label: "searchSchools", href: "/schools" },
      { label: "searchMajors", href: "/schools?tab=majors" },
      { label: "scholarships", href: "/scholarships" },
      { label: "admissionCalendar", href: "/admissions" },
      { label: "compare", href: "/compare" },
    ],
  },
  {
    title: null,
    links: [
      { label: "about", href: "/#about" },
      { label: "team", href: "/#team" },
      { label: "faq", href: "/#faq" },
    ],
  },
] as const;

const SOCIAL_ICONS: Record<string, typeof FaInstagram> = {
  Instagram: FaInstagram,
  Facebook: FaFacebook,
};

const LINK_CLASSES =
  "inline-flex min-h-11 items-center text-base text-ink-2 transition-colors hover:text-accent lg:min-h-9";

export function Footer() {
  const t = useTranslations("footer");
  const tc = useTranslations("common");
  const socials = SOCIAL_LINKS.filter((link): link is { label: string; href: string } => link.href != null);

  return (
    <footer className="border-t border-border-ink bg-paper-deep/50">
      <Container className="pt-12 pb-safe md:pt-16">
        <div className="grid gap-10 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-5">
            <Link href="/" aria-label={tc("homeAria")} className="inline-flex h-11 items-center">
              <Logo className="h-6" />
            </Link>
            <p className="mt-3 max-w-sm text-base text-ink">
              {t("tagline")}
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-3">
              {t("disclaimer")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 md:col-span-7 md:grid-cols-3">
            {FOOTER_SECTIONS.map((section) => {
              const title = section.title ? t(section.title) : "Oyutan MN";
              return (
              <nav key={title} aria-label={title}>
                <p className="text-sm font-bold text-ink">{title}</p>
                <ul className="mt-2">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className={LINK_CLASSES}>
                        {t(link.label)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              );
            })}

            <div className="col-span-2 md:col-span-1">
              <p className="text-sm font-bold text-ink">{t("contact")}</p>
              <a href={`mailto:${CONTACT_EMAIL}`} className={`${LINK_CLASSES} mt-2 gap-2 break-all`}>
                <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                {CONTACT_EMAIL}
              </a>
              {socials.length > 0 && (
                <ul className="mt-2 flex gap-2">
                  {socials.map((link) => {
                    const Icon = SOCIAL_ICONS[link.label];
                    return (
                      <li key={link.label}>
                        <a
                          href={link.href}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={link.label}
                          className="flex h-11 w-11 items-center justify-center rounded-full border border-border-ink text-ink-2 transition-colors hover:border-accent hover:text-accent"
                        >
                          {Icon && <Icon className="h-5 w-5" aria-hidden="true" />}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border-ink py-6 text-sm text-ink-3 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Oyutan MN</p>
          <ul className="flex flex-wrap gap-x-5">
            <li>
              <Link href="/privacy" className="inline-flex min-h-11 items-center hover:text-accent">
                {t("privacy")}
              </Link>
            </li>
            <li>
              <Link href="/terms" className="inline-flex min-h-11 items-center hover:text-accent">
                {t("terms")}
              </Link>
            </li>
          </ul>
        </div>
      </Container>
    </footer>
  );
}
