import Link from "next/link";
import { AnikuraLogo } from "@/components/anikura-logo";

const explore = [
  { href: "/", label: "Home" },
  { href: "/browse", label: "Browse" },
  { href: "/genres", label: "Genres" },
  { href: "/search", label: "Search" },
];

const discover = [
  { href: "/browse", label: "Catalog" },
  { href: "/genres", label: "All genres" },
  { href: "/browse", label: "Top rated" },
];

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-chrome relative z-10 mt-28">
      <div className="pointer-events-none absolute inset-x-0 -top-24 h-24 bg-gradient-to-t from-void to-transparent" />

      <div className="border-t border-white/[0.08]">
        <div className="grid gap-12 px-3 py-16 sm:px-4 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="max-w-sm">
            <AnikuraLogo size={28} />
            <p className="mt-4 text-[0.9375rem] leading-relaxed text-mute">
              A calm, cinematic place to watch anime — designed for quiet,
              focused evenings.
            </p>
          </div>

          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-mute">
              Explore
            </p>
            <ul className="mt-4 space-y-3">
              {explore.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-cloud transition hover:text-snow"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-mute">
              Discover
            </p>
            <ul className="mt-4 space-y-3">
              {discover.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-cloud transition hover:text-snow"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="px-3 pb-10 sm:px-4">
          <aside
            className="rounded-2xl border border-white/12 bg-white/[0.03] px-5 py-5 sm:px-6 sm:py-6"
            aria-label="Important disclaimer"
          >
            <div className="flex items-start gap-3">
              <span
                aria-hidden
                className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/15 text-cloud"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M8 1.6 14.4 13.2H1.6L8 1.6Z"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8 6.2v3.2M8 11.2h.01"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-[0.95rem] font-semibold tracking-[-0.02em] text-snow">
                  Important disclaimer
                </h2>
                <p className="mt-2 max-w-4xl text-[0.875rem] leading-relaxed text-cloud">
                  Anikura operates as a content aggregator and does not host any
                  media files on our servers. All content is sourced from
                  third-party providers and embedded services. For any copyright
                  concerns or DMCA takedown requests, please contact the
                  respective content providers directly.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 text-[11px] font-medium tracking-[-0.01em] text-mute">
                    Third-party content
                  </span>
                  <span className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 text-[11px] font-medium tracking-[-0.01em] text-mute">
                    No file hosting
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div className="border-t border-white/[0.06]">
          <div className="flex flex-col gap-3 px-3 py-6 text-xs text-mute sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <p>© {year} Anikura. Built for watching.</p>
            <p className="tracking-[-0.01em]">
              Catalog powered by Anikoto · Metadata from AniList
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
