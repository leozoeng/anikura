"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnikuraLogo } from "@/components/anikura-logo";
import { SearchCommand } from "@/components/search-command";

const links = [
  { href: "/", label: "Home" },
  { href: "/browse", label: "Browse" },
  { href: "/genres", label: "Genres" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setSearchOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const solid = scrolled || searchOpen || menuOpen;

  return (
    <header
      className={`site-chrome fixed inset-x-0 top-0 z-40 transition-[background,box-shadow] duration-300 ${
        solid
          ? "bg-void shadow-[0_12px_40px_rgba(0,0,0,0.55)]"
          : "bg-gradient-to-b from-black/80 via-black/40 to-transparent"
      }`}
    >
      <div className="flex h-14 w-full items-center gap-5 px-3 sm:h-16 sm:gap-8 sm:px-4">
        <AnikuraLogo size={28} />

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative rounded-full px-3.5 py-1.5 text-[0.8125rem] tracking-[-0.01em] transition duration-300 ${
                  active
                    ? "bg-white/[0.08] text-snow shadow-[inset_0_0_0_1px_rgba(255,140,170,0.22)]"
                    : "text-mute hover:bg-white/[0.05] hover:text-snow"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <a
            href="https://discord.gg/cm72gXTASn"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Join Anikura Discord"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-cloud transition duration-300 hover:bg-[#ff8caa]/12 hover:text-[#ffb3c7]"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden
            >
              <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
          </a>

          <SearchCommand open={searchOpen} onOpenChange={setSearchOpen} />

          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="grid h-9 w-9 place-items-center rounded-full text-cloud transition hover:bg-white/10 hover:text-snow md:hidden"
          >
            <span className="relative block h-3.5 w-4" aria-hidden>
              <span
                className={`absolute left-0 top-0 h-[1.5px] w-full origin-center rounded-full bg-current transition duration-300 ${
                  menuOpen ? "translate-y-[5.5px] rotate-45" : ""
                }`}
              />
              <span
                className={`absolute left-0 top-[5.5px] h-[1.5px] w-full rounded-full bg-current transition duration-300 ${
                  menuOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`absolute left-0 top-[11px] h-[1.5px] w-full origin-center rounded-full bg-current transition duration-300 ${
                  menuOpen ? "-translate-y-[5.5px] -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>
      </div>

      <div
        className={`overflow-hidden bg-black/90 backdrop-blur-2xl transition-[max-height,opacity] duration-300 md:hidden ${
          menuOpen
            ? "max-h-72 border-t border-white/[0.06] opacity-100"
            : "max-h-0 opacity-0"
        }`}
      >
        <nav className="flex w-full flex-col gap-1 px-3 py-4 sm:px-4" aria-label="Mobile">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-xl px-4 py-3 text-[0.95rem] tracking-[-0.02em] transition ${
                  active
                    ? "bg-white/[0.1] text-snow"
                    : "text-cloud hover:bg-white/[0.05] hover:text-snow"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/search"
            className="rounded-xl px-4 py-3 text-[0.95rem] tracking-[-0.02em] text-cloud transition hover:bg-white/[0.05] hover:text-snow"
          >
            Search
          </Link>
        </nav>
      </div>
    </header>
  );
}
