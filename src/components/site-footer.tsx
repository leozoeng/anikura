import Link from "next/link";
import { AnikuraLogo } from "@/components/anikura-logo";
import { FooterDonations } from "@/components/footer-donations";

const explore = [
  { href: "/", label: "Home" },
  { href: "/browse", label: "Browse" },
  { href: "/browse?sort=score", label: "Top rated" },
  { href: "/genres", label: "Genres" },
  { href: "/search", label: "Search" },
  { href: "/ghibli", label: "Ghibli" },
];

const DISCORD = "https://discord.gg/cm72gXTASn";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-chrome site-footer relative z-10 mt-14 pb-[calc(4.25rem+env(safe-area-inset-bottom))] sm:mt-16 md:pb-0">
      <div className="relative overflow-hidden border-t border-white/[0.07]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute -left-[8%] top-[-40%] h-[18rem] w-[18rem] rounded-full bg-[radial-gradient(circle,rgba(255,140,170,0.12),transparent_68%)] blur-3xl" />
          <div className="absolute -right-[6%] bottom-[-35%] h-[16rem] w-[16rem] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.05),transparent_70%)] blur-3xl" />
          <div className="site-footer-sheen absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#ffb3c7]/35 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-[1400px] px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          {/* Brand */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-md">
              <AnikuraLogo size={30} withWordmark href="/" />
              <p className="mt-3 text-[1.05rem] font-medium tracking-[-0.03em] text-snow/90">
                Quiet nights. Loud stories.
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-cloud/80">
                A soft theater for the next episode — settle in, stay a while.
              </p>
            </div>

            <a
              href={DISCORD}
              target="_blank"
              rel="noopener noreferrer"
              className="group footer-discord inline-flex w-full items-center justify-between gap-4 rounded-2xl px-4 py-3.5 sm:w-auto sm:min-w-[17rem]"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#5865F2]/18 text-[#aab0ff] ring-1 ring-[#5865F2]/30 transition duration-300 group-hover:bg-[#5865F2]/28 group-hover:text-[#c5caff]">
                  <DiscordIcon />
                </span>
                <span className="min-w-0 leading-tight">
                  <span className="block text-sm font-semibold tracking-[-0.02em] text-snow">
                    Join the lobby
                  </span>
                  <span className="block text-[0.72rem] text-mute">
                    Feedback, bugs & cozy chat
                  </span>
                </span>
              </span>
              <span className="header-auth-cta inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold tracking-[-0.02em] text-[#0a0a0c] transition duration-300 group-hover:brightness-[1.04]">
                Open
                <span
                  aria-hidden
                  className="text-black/35 transition duration-300 group-hover:translate-x-0.5 group-hover:text-black/55"
                >
                  →
                </span>
              </span>
            </a>
          </div>

          {/* Interactive strips */}
          <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
            <nav
              aria-label="Footer"
              className="footer-panel rounded-2xl p-4 sm:p-5"
            >
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-mute">
                Explore
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {explore.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="footer-chip">
                      {item.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <a
                    href={DISCORD}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="footer-chip"
                  >
                    Community
                  </a>
                </li>
              </ul>
            </nav>

            <div className="footer-panel rounded-2xl p-4 sm:p-5">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-mute">
                Keep the lights on
              </p>
              <p className="mt-1.5 text-sm tracking-[-0.02em] text-cloud/85">
                Optional tips help Anikura stay cozy — thank you.
              </p>
              <div className="mt-3.5">
                <FooterDonations />
              </div>
            </div>
          </div>

          {/* Legal */}
          <div className="mt-8 flex flex-col gap-3 border-t border-white/[0.06] pt-5 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
            <p className="max-w-2xl text-[0.75rem] leading-relaxed text-mute/90">
              Anikura aggregates listings and does not host media. Streams are
              from third parties — DMCA and copyright requests go to those
              providers.
            </p>
            <p className="shrink-0 text-[0.75rem] tracking-[-0.01em] text-mute/80">
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
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}
