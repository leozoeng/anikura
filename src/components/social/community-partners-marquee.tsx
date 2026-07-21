"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  DISCORD_PARTNERS,
  formatMemberCount,
  type DiscordPartner,
} from "@/lib/discord-partners";

const PARTNER_BADGE = "/discord/partner-badge.png";

type Props = {
  partners?: DiscordPartner[];
};

export function CommunityPartnersMarquee({
  partners = DISCORD_PARTNERS,
}: Props) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const strip = useMemo(() => {
    if (partners.length === 0) return [];
    // Enough copies so one half of the track fills wide viewports.
    const copies = Math.max(3, Math.ceil(8 / partners.length));
    return Array.from({ length: copies }, () => partners).flat();
  }, [partners]);

  if (partners.length === 0) return null;

  return (
    <section
      className="mt-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] via-[#111214]/80 to-[#0a0b0e] sm:mt-8"
      aria-label="Communities that trust Anikura"
    >
      <div className="border-b border-white/[0.06] px-3.5 py-3 sm:px-4 sm:py-3.5">
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-mute">
          Discord
        </p>
        <h2 className="mt-1 text-base font-semibold tracking-[-0.02em] text-snow sm:text-[1.05rem]">
          Communities that trust Anikura
        </h2>
        <p className="mt-0.5 text-[0.8125rem] text-[#949ba4]">
          Partner servers sharing quiet nights and loud episodes with us.
        </p>
      </div>

      <div className="community-marquee relative py-3.5">
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-8 bg-gradient-to-r from-[#0a0b0e] to-transparent sm:w-12"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-[1] w-8 bg-gradient-to-l from-[#0a0b0e] to-transparent sm:w-12"
          aria-hidden
        />

        {reducedMotion ? (
          <div className="scrollbar-none flex gap-2.5 overflow-x-auto px-3.5 sm:px-4">
            {partners.map((partner) => (
              <PartnerChip key={partner.id} partner={partner} />
            ))}
          </div>
        ) : (
          <div className="community-marquee__viewport">
            <div className="community-marquee__track">
              <div className="community-marquee__group">
                {strip.map((partner, i) => (
                  <PartnerChip
                    key={`${partner.id}-a-${i}`}
                    partner={partner}
                  />
                ))}
              </div>
              <div className="community-marquee__group" aria-hidden>
                {strip.map((partner, i) => (
                  <PartnerChip
                    key={`${partner.id}-b-${i}`}
                    partner={partner}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function PartnerChip({ partner }: { partner: DiscordPartner }) {
  return (
    <a
      href={partner.inviteUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="community-partner-chip pressable group inline-flex shrink-0 items-center gap-2.5 rounded-2xl border border-white/[0.08] bg-[#1a1b1e]/90 px-2.5 py-2 pr-3.5 transition hover:border-sakura/35 hover:bg-[#222428] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sakura/60"
    >
      <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-[#111214] ring-1 ring-white/10">
        <Image
          src={partner.iconUrl}
          alt=""
          fill
          className="object-cover"
          sizes="36px"
        />
      </span>
      <span className="min-w-0">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-[0.8125rem] font-semibold tracking-[-0.02em] text-snow">
            {partner.name}
          </span>
          <Image
            src={PARTNER_BADGE}
            alt=""
            width={16}
            height={16}
            className="h-4 w-4 shrink-0"
            title="Discord Partner"
          />
        </span>
        <span className="mt-0.5 block text-[0.7rem] tabular-nums text-[#949ba4]">
          {formatMemberCount(partner.memberCount)} members
        </span>
      </span>
    </a>
  );
}
