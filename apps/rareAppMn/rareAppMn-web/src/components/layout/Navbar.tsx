"use client";

import { useState } from "react";
import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import { Menu, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Сургууль", href: "#discovery" },
  { label: "Мэргэжил", href: "#major" },
  { label: "Тэтгэлэг", href: "#scholarships" },
  { label: "Элсэлт", href: "#deadlines" },
  { label: "Харьцуулах", href: "#compare" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { isLoaded, isSignedIn } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-ink/10 bg-paper/90 backdrop-blur-[2px]">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-5 sm:px-8">
        <a
          href="#top"
          className="flex items-baseline gap-2 font-display text-lg font-semibold tracking-tight text-ink"
        >
          Oyutan
          <span className="text-accent">MN</span>
        </a>

        <nav className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[13px] font-medium uppercase tracking-[0.08em] text-ink/70 transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <a
            href="#search"
            className="flex items-center gap-1.5 text-[13px] font-medium uppercase tracking-[0.08em] text-ink/70 transition-colors hover:text-ink"
          >
            <Search className="h-3.5 w-3.5" strokeWidth={2} />
            Сургууль хайх
          </a>
          {isLoaded && isSignedIn ? (
            <UserButton />
          ) : (
            <SignInButton mode="modal">
              <button
                type="button"
                className="rounded-sm border border-ink px-4 py-2 text-[13px] font-medium uppercase tracking-[0.08em] text-ink transition-colors hover:bg-ink hover:text-paper"
              >
                Нэвтрэх
              </button>
            </SignInButton>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Цэсийг хаах" : "Цэсийг нээх"}
          aria-expanded={open}
          className="flex h-9 w-9 items-center justify-center text-ink lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={cn(
          "overflow-hidden border-t border-ink/10 bg-paper transition-[max-height] duration-300 ease-in-out lg:hidden",
          open ? "max-h-96" : "max-h-0 border-t-0"
        )}
      >
        <nav className="flex flex-col gap-1 px-5 py-4">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="py-2.5 text-[15px] font-medium text-ink/80 transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ))}
          <div className="mt-2 flex flex-col gap-2 border-t border-ink/10 pt-4">
            <a
              href="#search"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1.5 rounded-sm border border-ink/20 px-4 py-2.5 text-[13px] font-medium uppercase tracking-[0.08em] text-ink"
            >
              <Search className="h-3.5 w-3.5" strokeWidth={2} />
              Сургууль хайх
            </a>
            {isLoaded && isSignedIn ? (
              <div className="flex justify-center py-2">
                <UserButton />
              </div>
            ) : (
              <SignInButton mode="modal">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-sm border border-ink bg-ink px-4 py-2.5 text-center text-[13px] font-medium uppercase tracking-[0.08em] text-paper"
                >
                  Нэвтрэх
                </button>
              </SignInButton>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
