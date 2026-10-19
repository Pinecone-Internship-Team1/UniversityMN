"use client";

import { useState } from "react";
import { Menu, X, Search, UserCircle } from "lucide-react";
import { Show, UserButton } from "@clerk/nextjs";
import {
  ACCOUNT_SETTINGS_PATH,
  PROFILE_PATH,
  SIGN_IN_PATH,
  SIGN_UP_PATH,
} from "@/lib/auth-routes";
import { cn } from "@/lib/utils";
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

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-paper/90 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 sm:px-8">
        {/* Logo */}
        <Link
          href="/#top"
          className="flex shrink-0 items-center transition-opacity hover:opacity-90"
        >
          <Logo eager className="h-6 sm:h-7" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-7 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[13px] font-semibold uppercase tracking-wider text-ink/70 transition-colors duration-200 hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href="/schools"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold uppercase tracking-wider text-ink/70 transition-all duration-200 hover:bg-ink/[0.04] hover:text-ink"
          >
            <Search className="h-4 w-4" strokeWidth={2.2} />
            Сургууль хайх
          </Link>

          <ThemeToggle />

          {/* Plain links (no redirect_url), so signing in from here lands on /schools */}
          <Show when="signed-out">
            <div className="ml-1 flex items-center gap-2">
              <Link
                href={SIGN_IN_PATH}
                className="rounded-full border border-ink/20 px-4 py-1.5 text-[12px] font-bold uppercase tracking-wider text-ink transition-all duration-200 hover:border-ink hover:bg-ink hover:text-paper"
              >
                Нэвтрэх
              </Link>
              <Link
                href={SIGN_UP_PATH}
                className="rounded-full border border-ink bg-ink px-4 py-1.5 text-[12px] font-bold uppercase tracking-wider text-paper transition-all duration-200 hover:border-accent hover:bg-accent"
              >
                Бүртгүүлэх
              </Link>
            </div>
          </Show>

          <Show when="signed-in">
            <div className="ml-1 flex h-10 items-center">
              <AccountButton />
            </div>
          </Show>
        </div>

        {/* Mobile: avatar button (signed in) + menu toggle */}
        <div className="flex items-center gap-2 lg:hidden">
          <Show when="signed-in">
            <div className="flex h-10 items-center">
              <AccountButton />
            </div>
          </Show>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Цэсийг хаах" : "Цэсийг нээх"}
            aria-expanded={open}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-ink/80 transition-colors hover:bg-ink/[0.04] hover:text-ink"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div
        className={cn(
          "overflow-hidden border-t border-ink/10 bg-paper transition-[max-height] duration-300 ease-in-out lg:hidden",
          open ? "max-h-[32rem]" : "max-h-0 border-t-0",
        )}
      >
        <nav className="flex flex-col gap-1 px-5 py-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-[14px] font-semibold tracking-wide text-ink/80 transition-colors hover:bg-ink/[0.03] hover:text-ink"
            >
              {link.label}
            </Link>
          ))}

          <div className="mt-3 flex flex-col gap-2.5 border-t border-ink/10 pt-4">
            <Link
              href="/schools"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 rounded-lg border border-ink/15 px-4 py-2.5 text-[13px] font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-ink/[0.03]"
            >
              <Search className="h-4 w-4" strokeWidth={2} />
              Сургууль хайх
            </Link>

            <div className="flex items-center justify-center gap-2 py-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink/50">
                Горим
              </span>
              <ThemeToggle />
            </div>

            <Show when="signed-out">
              <div className="grid grid-cols-2 gap-2.5">
                <Link
                  href={SIGN_IN_PATH}
                  onClick={() => setOpen(false)}
                  className="w-full rounded-lg border border-ink/15 px-4 py-2.5 text-center text-[13px] font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-ink/[0.03]"
                >
                  Нэвтрэх
                </Link>
                <Link
                  href={SIGN_UP_PATH}
                  onClick={() => setOpen(false)}
                  className="w-full rounded-lg bg-ink px-4 py-2.5 text-center text-[13px] font-semibold uppercase tracking-wider text-paper transition-opacity hover:opacity-95"
                >
                  Бүртгүүлэх
                </Link>
              </div>
            </Show>
          </div>
        </nav>
      </div>
    </header>
  );
}
