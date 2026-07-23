"use client";

import { AnikuraLogo } from "@/components/anikura-logo";
import { FooterDonations } from "@/components/footer-donations";
import { ANIKURA_DISCORD_INVITE } from "@/lib/discord-partners";
import { usePathname } from "next/navigation";

export function SiteFooter() {
  const pathname = usePathname();
  const year = new Date().getFullYear();

  if (/\/manga\/[^/]+\/read\//.test(pathname) || /\/novels\/[^/]+\/read\//.test(pathname)) {
    return null;
  }

  return (
    <footer className="site-chrome site-footer relative z-10 mt-12 pb-[calc(4.25rem+env(safe-area-inset-bottom))] sm:mt-14 md:pb-0">
      <div className="relative overflow-hidden border-t border-white/[0.07]">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -left-10 bottom-0 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.06),transparent_70%)] blur-2xl" />
          <div className="absolute right-[8%] top-[-18%] h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.05),transparent_70%)] blur-2xl" />
          <div className="site-footer-sheen absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
        </div>

        <div className="page-shell relative py-7 sm:py-8">
          <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
            <div className="flex min-w-0 flex-col gap-1">
              <AnikuraLogo size={32} withWordmark href="/" />
              <p className="pl-[calc(32px+0.625rem)] text-[0.68rem] tracking-[-0.01em] text-mute/70">
                © {year} Anikura
              </p>
            </div>
            <span
              aria-hidden
              className="hidden h-3 w-px self-center bg-white/15 sm:block"
            />
            <p className="text-sm tracking-[-0.02em] text-mute sm:self-center">
              Quiet nights. Loud stories.
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-white/[0.06] pt-5 lg:flex-row lg:items-center lg:gap-4">
            <p className="min-w-0 flex-1 text-[0.75rem] leading-relaxed text-mute/90 lg:max-w-sm xl:max-w-md">
              Anikura aggregates listings and does not host media. Streams are
              from third parties — DMCA and copyright requests go to those
              providers.
            </p>

            <div className="flex w-full min-w-0 flex-col gap-2.5 sm:flex-row sm:items-stretch lg:w-auto lg:shrink-0 lg:justify-end">
              <FooterDonations />
              <a
                href={ANIKURA_DISCORD_INVITE}
                target="_blank"
                rel="noopener noreferrer"
                className="group footer-discord-invite pressable relative inline-flex min-h-[3.5rem] shrink-0 items-center gap-3 overflow-hidden rounded-2xl px-3 py-2.5 sm:min-w-[17.5rem]"
              >
                <span
                  aria-hidden
                  className="footer-discord-glow pointer-events-none absolute inset-0"
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_22%,rgba(255,255,255,0.14)_48%,transparent_72%)] opacity-0 transition duration-500 group-hover:translate-x-1 group-hover:opacity-100"
                />
                <span className="footer-discord-badge relative grid h-10 w-10 shrink-0 place-items-center rounded-xl text-black transition duration-300 group-hover:scale-[1.05]">
                  <DiscordIcon />
                  <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-[#57F287] ring-2 ring-black" />
                </span>
                <span className="relative min-w-0 flex-1 leading-tight">
                  <span className="block text-sm font-semibold tracking-[-0.02em] text-white">
                    Get the latest updates
                  </span>
                  <span className="block text-[0.68rem] text-white/65">
                    Feedback & bugs welcome too
                  </span>
                </span>
                <span className="footer-discord-cta relative inline-flex h-9 shrink-0 items-center gap-1 rounded-full px-3.5 text-[0.78rem] font-semibold tracking-[-0.02em] transition duration-300 group-hover:-translate-y-0.5">
                  Join Discord
                  <span
                    aria-hidden
                    className="opacity-80 transition duration-300 group-hover:translate-x-0.5 group-hover:opacity-100"
                  >
                    →
                  </span>
                </span>
              </a>
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
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}
