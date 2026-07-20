import Link from "next/link";
import { AnikuraLogo, AnikuraMark } from "@/components/anikura-logo";

const explore = [
  { href: "/", label: "Home" },
  { href: "/browse", label: "Browse" },
  { href: "/genres", label: "Genres" },
  { href: "/search", label: "Search" },
];

const evenings = [
  { href: "/browse", label: "Catalog" },
  { href: "/browse?sort=score", label: "Top rated" },
  { href: "/genres", label: "Moods & genres" },
];

const DISCORD = "https://discord.gg/cm72gXTASn";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-chrome relative z-10 mt-32 overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-32 h-32 bg-gradient-to-t from-void via-void/80 to-transparent"
      />

      <div className="relative border-t border-white/[0.07]">
        {/* Atmosphere */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 bottom-0 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(255,140,170,0.16),transparent_68%)] blur-2xl" />
          <div className="absolute right-[-10%] top-[-20%] h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.07),transparent_70%)] blur-3xl" />
          <div className="absolute inset-0 opacity-[0.035] [background-image:radial-gradient(rgba(255,255,255,0.9)_0.6px,transparent_0.6px)] [background-size:18px_18px]" />
          <div className="footer-petal absolute left-[12%] top-16 h-3 w-3 rotate-12 rounded-[40%_60%_55%_45%] bg-[#ff8caa]/35 blur-[0.5px]" />
          <div className="footer-petal-slow absolute right-[22%] top-28 h-2.5 w-2.5 -rotate-6 rounded-[45%_55%_40%_60%] bg-[#ffb3c7]/30" />
          <div className="footer-petal absolute bottom-40 left-[48%] h-2 w-2 rotate-45 rounded-[50%_40%_60%_50%] bg-[#ff8caa]/25" />
        </div>

        <div className="relative px-3 pb-10 pt-16 sm:px-4">
          {/* Brand closing statement */}
          <div className="w-full">
            <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium tracking-[0.18em] text-mute uppercase">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#ff8caa] shadow-[0_0_12px_rgba(255,140,170,0.8)]" />
                  Night mode, always on
                </div>
                <div className="mt-6 flex items-center gap-4">
                  <AnikuraMark
                    size={44}
                    className="shadow-[0_12px_40px_rgba(255,140,170,0.18)] ring-1 ring-white/10"
                  />
                  <p className="text-[clamp(2.4rem,6vw,4.25rem)] font-semibold leading-[0.92] tracking-[-0.06em] text-snow">
                    Anikura
                  </p>
                </div>
                <p className="mt-5 max-w-md text-[1.05rem] leading-relaxed tracking-[-0.015em] text-cloud">
                  A quiet theater for loud stories — sakura glow, soft nights,
                  and the next episode waiting when you are.
                </p>
              </div>

              <a
                href={DISCORD}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-white px-5 py-3.5 text-sm font-semibold tracking-[-0.02em] text-black transition duration-300 hover:scale-[1.02] hover:bg-[#ffe8ee]"
              >
                <span
                  aria-hidden
                  className="absolute inset-0 opacity-0 transition duration-500 group-hover:opacity-100"
                  style={{
                    background:
                      "linear-gradient(120deg, transparent 20%, rgba(255,140,170,0.35) 50%, transparent 80%)",
                  }}
                />
                <DiscordIcon />
                <span className="relative">Join the Discord</span>
                <span
                  aria-hidden
                  className="relative text-black/45 transition group-hover:translate-x-0.5 group-hover:text-black/70"
                >
                  →
                </span>
              </a>
            </div>

            {/* Link lattice */}
            <div className="mt-16 grid gap-10 border-y border-white/[0.08] py-12 sm:grid-cols-2 lg:grid-cols-[1.1fr_1fr_1fr]">
              <div>
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-mute">
                  Explore
                </p>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {explore.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="footer-link inline-flex rounded-full border border-white/10 bg-white/[0.02] px-3.5 py-2 text-sm text-cloud transition hover:border-[#ff8caa]/35 hover:bg-[#ff8caa]/10 hover:text-snow"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-mute">
                  For the evening
                </p>
                <ul className="mt-5 space-y-3">
                  {evenings.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="group inline-flex items-center gap-2 text-[0.95rem] tracking-[-0.02em] text-cloud transition hover:text-snow"
                      >
                        <span
                          aria-hidden
                          className="h-px w-4 bg-white/20 transition group-hover:w-7 group-hover:bg-[#ff8caa]/70"
                        />
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="sm:col-span-2 lg:col-span-1">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-mute">
                  Community
                </p>
                <p className="mt-5 max-w-xs text-sm leading-relaxed text-cloud">
                  Drop episode takes, find watch buddies, and catch site updates
                  as they bloom.
                </p>
                <a
                  href={DISCORD}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium tracking-[-0.01em] text-[#ffb3c7] transition hover:text-[#ffd0dc]"
                >
                  discord.gg/anikura
                  <span aria-hidden>↗</span>
                </a>
              </div>
            </div>

            {/* Quiet legal note — not a heavy boxed card */}
            <aside
              className="mt-10 max-w-3xl"
              aria-label="Important disclaimer"
            >
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-mute">
                Note
              </p>
              <p className="mt-3 text-[0.8125rem] leading-relaxed text-mute">
                Anikura is a content aggregator and does not host media files.
                Streams come from third-party providers — for copyright or DMCA
                requests, contact those providers directly.
              </p>
            </aside>

            <div className="mt-12 flex flex-col gap-4 border-t border-white/[0.07] pt-7 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <AnikuraLogo size={22} withWordmark={false} href="/" />
                <p className="text-xs tracking-[-0.01em] text-mute">
                  © {year} Anikura · Built for watching
                </p>
              </div>
              <p className="text-xs tracking-[-0.01em] text-mute/80">
                See you under the sakura
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function DiscordIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className="relative"
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}
