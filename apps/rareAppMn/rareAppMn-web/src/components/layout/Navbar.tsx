"use client";

import { useState } from "react";
import { Menu, X, Search } from "lucide-react";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import Link from "next/link";

const NAV_LINKS = [
  { label: "Сургууль", href: "#discovery" },
  { label: "Мэргэжил", href: "#major" },
  { label: "Тэтгэлэг", href: "#scholarships" },
  { label: "Элсэлт", href: "#deadlines" },
  { label: "Харьцуулах", href: "#compare" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-paper/90 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 sm:px-8">
        {/* Logo */}
        <Link
          href="#top"
          className="flex items-baseline gap-1 text-xl font-bold tracking-tight text-ink transition-opacity hover:opacity-90"
        >
          Oyutan
          <span className="text-accent font-extrabold">MN</span>
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
        <div className="hidden items-center gap-4 lg:flex">
          <Link
            href="#search"
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold uppercase tracking-wider text-ink/70 transition-all duration-200 hover:bg-ink/[0.04] hover:text-ink"
          >
            <Search className="h-4 w-4" strokeWidth={2.2} />
            Сургууль хайх
          </Link>

          <Show when="signed-out">
            <SignInButton mode="modal">
              <button
                type="button"
                className="rounded-full border border-ink/20 px-4 py-1.5 text-[12px] font-bold uppercase tracking-wider text-ink transition-all duration-200 hover:border-ink hover:bg-ink hover:text-paper"
              >
                Нэвтрэх
              </button>
            </SignInButton>
          </Show>

          <Show when="signed-in">
            <div className="flex items-center">
              <UserButton />
            </div>
          </Show>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Цэсийг хаах" : "Цэсийг нээх"}
          aria-expanded={open}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-ink/80 transition-colors hover:bg-ink/[0.04] hover:text-ink lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      <div
        className={cn(
          "overflow-hidden border-t border-ink/10 bg-paper transition-[max-height] duration-300 ease-in-out lg:hidden",
          open ? "max-h-96" : "max-h-0 border-t-0",
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
              href="#search"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 rounded-lg border border-ink/15 px-4 py-2.5 text-[13px] font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-ink/[0.03]"
            >
              <Search className="h-4 w-4" strokeWidth={2} />
              Сургууль хайх
            </Link>

            <Show when="signed-out">
              <SignInButton mode="modal">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-full rounded-lg bg-ink px-4 py-2.5 text-center text-[13px] font-semibold uppercase tracking-wider text-paper transition-opacity hover:opacity-95"
                >
                  Нэвтрэх
                </button>
              </SignInButton>
            </Show>

            <Show when="signed-in">
              <div className="flex justify-center py-2">
                <UserButton />
              </div>
            </Show>
          </div>
        </nav>
      </div>
    </header>
  );
}
