"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Menu, Search, Settings, UserCircle, X } from "lucide-react";
import { Show, SignOutButton, UserButton } from "@clerk/nextjs";
import {
  ACCOUNT_SETTINGS_PATH,
  PROFILE_PATH,
  SIGN_IN_PATH,
  SIGN_UP_PATH,
} from "@/lib/auth-routes";
import { cn } from "@/lib/utils";
import { buttonClassName } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import Link from "next/link";

const NAV_LINKS = [
  { label: "Сургууль", href: "/schools" },
  { label: "Мэргэжил", href: "/schools?tab=majors" },
  { label: "Тэтгэлэг", href: "/scholarships" },
  { label: "Элсэлт", href: "/admissions" },
  { label: "Харьцуулах", href: "/compare" },
];

/** Which nav link the current URL belongs to (/schools vs its majors tab, school pages count as schools). */
function isActive(href: string, pathname: string, tab: string | null): boolean {
  const [path, query] = href.split("?");
  if (path === "/schools") {
    const wantsMajors = query === "tab=majors";
    if (pathname.startsWith("/university/")) return !wantsMajors;
    return pathname === "/schools" && (tab === "majors") === wantsMajors;
  }
  return pathname === path || pathname.startsWith(`${path}/`);
}

/**
 * The one avatar button: its menu goes to our two profile tabs (the
 * "manage account" item navigates to /profile/account instead of opening
 * Clerk's pop-up; its label comes from lib/clerk-ui.ts) plus sign-out.
 */
function AccountButton() {
  return (
    <UserButton userProfileUrl={ACCOUNT_SETTINGS_PATH} userProfileMode="navigation">
      <UserButton.MenuItems>
        <UserButton.Link
          label="Миний профайл"
          labelIcon={<UserCircle className="h-4 w-4" strokeWidth={1.8} />}
          href={PROFILE_PATH}
        />
        <UserButton.Action label="manageAccount" />
        <UserButton.Action label="signOut" />
      </UserButton.MenuItems>
    </UserButton>
  );
}

interface NavLinksProps {
  variant: "desktop" | "mobile";
  onNavigate?: () => void;
}

function NavLinksWithState({ variant, onNavigate }: NavLinksProps) {
  const pathname = usePathname();
  const tab = useSearchParams().get("tab");
  return <NavLinkList variant={variant} onNavigate={onNavigate} isCurrent={(href) => isActive(href, pathname, tab)} />;
}

function NavLinkList({
  variant,
  onNavigate,
  isCurrent,
}: NavLinksProps & { isCurrent: (href: string) => boolean }) {
  return NAV_LINKS.map((link) => {
    const active = isCurrent(link.href);
    return (
      <Link
        key={link.href}
        href={link.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={
          variant === "desktop"
            ? cn(
                "relative flex h-16 items-center px-1 text-[15px] font-bold transition-colors after:absolute after:inset-x-1 after:bottom-0 after:h-0.5 after:rounded-full after:transition-colors",
                active ? "text-ink after:bg-accent" : "text-ink-2 after:bg-transparent hover:text-ink",
              )
            : cn(
                "flex min-h-14 items-center rounded-xl px-4 text-[17px] font-bold transition-colors active:bg-ink/[0.08]",
                active ? "bg-accent-soft text-accent" : "text-ink",
              )
        }
      >
        {link.label}
      </Link>
    );
  });
}

/** useSearchParams needs a Suspense boundary on static pages; the fallback is the same links, none marked. */
function NavLinks(props: NavLinksProps) {
  return (
    <Suspense fallback={<NavLinkList {...props} isCurrent={() => false} />}>
      <NavLinksWithState {...props} />
    </Suspense>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close the menu whenever the page changes (e.g. browser back).
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // While the menu is open: no page scroll behind it, Esc closes it, and
  // focus moves into it (and back to the toggle afterwards).
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    root.style.overflow = "hidden";
    menuRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    const toggle = toggleRef.current;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      root.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
      toggle?.focus({ preventScroll: true });
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-colors duration-200",
        scrolled || open ? "border-border-ink" : "border-transparent",
      )}
    >
      {/* The blur sits on its own layer: backdrop-filter on the header itself
          would make it the containing block of the fixed mobile menu. */}
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 -z-10 transition-[background-color] duration-200",
          scrolled || open ? "bg-paper/85 backdrop-blur-md" : "bg-paper",
        )}
      />
      <Container className="flex h-14 items-center justify-between gap-3 lg:h-16">
        <Link
          href="/"
          aria-label="Oyutan MN — нүүр хуудас"
          className="flex h-11 shrink-0 items-center rounded-lg"
        >
          <Logo eager className="h-4 min-[390px]:h-[18px] sm:h-5" />
        </Link>

        <nav aria-label="Үндсэн цэс" className="hidden items-center gap-6 lg:flex">
          <NavLinks variant="desktop" />
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle className="hidden lg:flex" />

          <Link
            href="/schools"
            className={buttonClassName({
              size: "sm",
              className: "px-3.5 max-[389px]:px-3 max-[389px]:text-sm max-[389px]:[&_svg]:hidden",
            })}
          >
            <Search />
            Сургууль хайх
          </Link>

          {/* Plain links (no redirect_url), so signing in from here lands on /schools */}
          <Show when="signed-out">
            <Link
              href={SIGN_IN_PATH}
              className={buttonClassName({ variant: "ghost", size: "sm", className: "hidden lg:inline-flex" })}
            >
              Нэвтрэх
            </Link>
          </Show>

          <Show when="signed-in">
            <div className="hidden h-11 w-11 items-center justify-center lg:flex">
              <AccountButton />
            </div>
          </Show>

          <button
            ref={toggleRef}
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Цэсийг хаах" : "Цэсийг нээх"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors active:bg-ink/[0.08] lg:hidden"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </Container>

      {/* Mobile menu: drops down under the header and fills the screen. */}
      <div
        id="mobile-menu"
        ref={menuRef}
        hidden={!open}
        className="fixed inset-x-0 top-14 bottom-0 overflow-y-auto overscroll-contain border-t border-border-ink bg-paper motion-safe:animate-[fade-in_150ms_ease-out] lg:hidden"
      >
        <nav aria-label="Үндсэн цэс" className="flex flex-col gap-1 px-4 pt-4 pb-safe">
          <Link href="/schools" onClick={close} className={buttonClassName({ size: "lg", className: "mb-3 w-full" })}>
            <Search />
            Сургууль хайх
          </Link>

          <NavLinks variant="mobile" onNavigate={close} />

          <div className="mt-3 flex min-h-14 items-center justify-between rounded-xl px-4">
            <span className="text-[17px] font-bold text-ink">Өнгөний горим</span>
            <ThemeToggle className="-mr-2" />
          </div>

          <div className="mt-2 border-t border-border-ink pt-4">
            <Show when="signed-out">
              <div className="grid grid-cols-2 gap-3">
                <Link href={SIGN_IN_PATH} onClick={close} className={buttonClassName({ variant: "secondary" })}>
                  Нэвтрэх
                </Link>
                <Link href={SIGN_UP_PATH} onClick={close} className={buttonClassName({ variant: "solid" })}>
                  Бүртгүүлэх
                </Link>
              </div>
            </Show>
            <Show when="signed-in">
              <Link
                href={PROFILE_PATH}
                onClick={close}
                className="flex min-h-14 items-center gap-3 rounded-xl px-4 text-[17px] font-bold text-ink active:bg-ink/[0.08]"
              >
                <UserCircle className="h-5 w-5 text-ink-2" aria-hidden="true" />
                Миний профайл
              </Link>
              <Link
                href={ACCOUNT_SETTINGS_PATH}
                onClick={close}
                className="flex min-h-14 items-center gap-3 rounded-xl px-4 text-[17px] font-bold text-ink active:bg-ink/[0.08]"
              >
                <Settings className="h-5 w-5 text-ink-2" aria-hidden="true" />
                Бүртгэлийн тохиргоо
              </Link>
              <SignOutButton>
                <button
                  type="button"
                  className={buttonClassName({ variant: "secondary", className: "mt-3 w-full" })}
                >
                  Гарах
                </button>
              </SignOutButton>
            </Show>
          </div>
        </nav>
      </div>
    </header>
  );
}
