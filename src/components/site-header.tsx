"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
      className={`site-chrome fixed inset-x-0 top-0 z-40 transition-[background,box-shadow,backdrop-filter] duration-300 ${
        solid
          ? "bg-black/75 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
          : "bg-gradient-to-b from-black/80 via-black/40 to-transparent"
      }`}
    >
      <div className="flex h-14 w-full items-center gap-5 px-3 sm:h-16 sm:gap-8 sm:px-4">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5"
          aria-label="Anikura home"
        >
          <span
            aria-hidden
            className="grid h-7 w-7 place-items-center rounded-[0.55rem] bg-snow text-[0.7rem] font-bold tracking-[-0.06em] text-void transition group-hover:scale-[1.04]"
          >
            A
          </span>
          <span className="text-[1.05rem] font-semibold tracking-[-0.045em] text-snow transition group-hover:opacity-85 sm:text-[1.125rem]">
            Anikura
          </span>
        </Link>

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
                className={`relative rounded-full px-3.5 py-1.5 text-[0.8125rem] tracking-[-0.01em] transition ${
                  active
                    ? "bg-white/[0.1] text-snow"
                    : "text-mute hover:bg-white/[0.05] hover:text-snow"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
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
