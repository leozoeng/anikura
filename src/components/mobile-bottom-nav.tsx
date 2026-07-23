"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  {
    href: "/",
    label: "Home",
    match: (p: string) => p === "/",
    icon: HomeIcon,
  },
  {
    href: "/browse",
    label: "Browse",
    match: (p: string) =>
      p.startsWith("/browse") ||
      p.startsWith("/ghibli") ||
      p.startsWith("/one-piece") ||
      p.startsWith("/shinkai"),
    icon: BrowseIcon,
  },
  {
    href: "/genres",
    label: "Genres",
    match: (p: string) => p.startsWith("/genres"),
    icon: GenresIcon,
  },
  {
    href: "/manga",
    label: "Manga",
    match: (p: string) => p.startsWith("/manga"),
    icon: MangaIcon,
  },
  {
    href: "/profile",
    label: "Social",
    match: (p: string) =>
      p.startsWith("/profile") || p.startsWith("/u/") || p.startsWith("/@"),
    icon: ProfileIcon,
  },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/watch") ||
    pathname.startsWith("/login") ||
    /\/manga\/[^/]+\/read\//.test(pathname)
  ) {
    return null;
  }

  return (
    <nav
      aria-label="Mobile primary"
      className="site-chrome mobile-bottom-nav mobile-tab-bar fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] md:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-1.5 pb-[max(0.2rem,env(safe-area-inset-bottom))] pt-1.5">
        {items.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={`pressable flex min-h-[3.15rem] flex-col items-center justify-center gap-0.5 px-1 text-[0.625rem] font-semibold tracking-[-0.01em] transition-colors duration-200 ${
                  active ? "text-snow" : "text-mute"
                }`}
              >
                <span
                  className={`grid h-7 w-12 place-items-center rounded-full transition duration-200 ${
                    active ? "bg-white/[0.12]" : "bg-transparent"
                  }`}
                >
                  <Icon active={active} />
                </span>
                <span className={active ? "text-snow" : "text-mute"}>
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.6}
        strokeLinejoin="round"
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.18 : 0}
      />
    </svg>
  );
}

function BrowseIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect
        x="4"
        y="4"
        width="7"
        height="7"
        rx="1.5"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.6}
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.18 : 0}
      />
      <rect
        x="13"
        y="4"
        width="7"
        height="7"
        rx="1.5"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.6}
      />
      <rect
        x="4"
        y="13"
        width="7"
        height="7"
        rx="1.5"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.6}
      />
      <rect
        x="13"
        y="13"
        width="7"
        height="7"
        rx="1.5"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.6}
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.18 : 0}
      />
    </svg>
  );
}

function GenresIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h16M4 12h16M4 17h10"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.6}
        strokeLinecap="round"
      />
    </svg>
  );
}

function MangaIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 4.5h5.2c.9 0 1.7.4 2.3 1.1.6-.7 1.4-1.1 2.3-1.1H20V19h-5.2c-.9 0-1.7.3-2.3.9-.6-.6-1.4-.9-2.3-.9H5V4.5Z"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.6}
        strokeLinejoin="round"
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.18 : 0}
      />
      <path
        d="M12 5.5V20"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.6}
        strokeLinecap="round"
      />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle
        cx="12"
        cy="9"
        r="3.5"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.6}
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.18 : 0}
      />
      <path
        d="M5.5 19.5c1.6-3.2 4-4.8 6.5-4.8s4.9 1.6 6.5 4.8"
        stroke="currentColor"
        strokeWidth={active ? 2 : 1.6}
        strokeLinecap="round"
      />
    </svg>
  );
}
