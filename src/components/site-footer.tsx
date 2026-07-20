import Link from "next/link";
import { AnikuraLogo } from "@/components/anikura-logo";
import { FooterDonations } from "@/components/footer-donations";

const links = [
  { href: "/", label: "Home" },
  { href: "/browse", label: "Browse" },
  { href: "/browse?sort=score", label: "Top rated" },
  { href: "/genres", label: "Genres" },
  { href: "/search", label: "Search" },
];

const DISCORD = "https://discord.gg/cm72gXTASn";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-chrome relative z-10 mt-12 sm:mt-14">
      <div className="relative border-t border-white/[0.07]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <div className="absolute -left-12 bottom-0 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(255,140,170,0.1),transparent_70%)] blur-2xl" />
        </div>

        <div className="relative px-3 py-6 sm:px-4 sm:py-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <AnikuraLogo size={26} withWordmark href="/" />
              <span
                aria-hidden
                className="hidden h-3 w-px bg-white/15 sm:block"
              />
              <p className="hidden text-sm tracking-[-0.02em] text-mute sm:block">
                Quiet nights. Loud stories.
              </p>
            </div>

            <div className="flex flex-col gap-2 self-start sm:flex-row sm:items-center sm:self-auto">
              <FooterDonations />
              <a
                href={DISCORD}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex h-[3.25rem] shrink-0 items-center gap-3 rounded-2xl border border-white/[0.1] bg-white/[0.04] px-3.5 transition hover:border-white/20 hover:bg-white/[0.07]"
              >
                <span className="flex min-w-0 flex-col leading-tight">
                  <span className="text-sm font-semibold tracking-[-0.02em] text-snow">
                    Join Discord
                  </span>
                  <span className="text-[0.7rem] tracking-[-0.01em] text-mute">
                    Feedback, bugs & updates
                  </span>
                </span>
                <span className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/90 bg-[linear-gradient(180deg,#ffffff_0%,#f4f4f6_48%,#e8e8ec_100%)] px-3.5 text-sm font-semibold tracking-[-0.02em] text-[#0a0a0c] shadow-[0_1.5px_0_rgba(255,255,255,0.95)_inset,0_4px_12px_rgba(0,0,0,0.35)] transition group-hover:brightness-[1.03]">
                  <DiscordIcon />
                  Open
                  <span aria-hidden className="text-black/35">
                    →
                  </span>
                </span>
              </a>
            </div>
          </div>

          <nav
            aria-label="Footer"
            className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/[0.06] pt-4"
          >
            {links.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm tracking-[-0.02em] text-cloud transition hover:text-snow"
              >
                {item.label}
              </Link>
            ))}
            <a
              href={DISCORD}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm tracking-[-0.02em] text-cloud transition hover:text-snow"
            >
              Community
            </a>
          </nav>

          <div className="mt-4 flex flex-col gap-2 border-t border-white/[0.06] pt-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <p className="max-w-2xl text-[0.75rem] leading-relaxed text-mute">
              Anikura aggregates listings and does not host media. Streams are
              from third parties — DMCA and copyright requests go to those
              providers.
            </p>
            <p className="shrink-0 text-[0.75rem] tracking-[-0.01em] text-mute">
              © {year} Anikura
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function DiscordIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}
