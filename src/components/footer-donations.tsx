"use client";

import { useState } from "react";

const DONATIONS = [
  {
    id: "sol",
    label: "Solana",
    address: "41MB8nvY2FXsVDdvoZduzu9LPBCSBWK2kgF2pdyPPRNQ",
    href: "https://solscan.io/account/41MB8nvY2FXsVDdvoZduzu9LPBCSBWK2kgF2pdyPPRNQ",
  },
  {
    id: "eth",
    label: "Ethereum",
    address: "0x19847Db64d929E711597195c8756e68FD4348Ff2",
    href: "https://etherscan.io/address/0x19847Db64d929E711597195c8756e68FD4348Ff2",
  },
] as const;

function shortAddress(address: string) {
  if (address.length < 16) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function FooterDonations() {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(id: string, address: string) {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(id);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      // ignore
    }
  }

  return (
    <div className="mt-4 border-t border-white/[0.06] pt-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <p className="max-w-md text-[0.75rem] leading-relaxed text-mute">
          Donations help keep Anikura online — thank you for supporting the
          theater.
        </p>
        <div className="flex flex-wrap gap-2">
          {DONATIONS.map((d) => (
            <div
              key={d.id}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.03] py-1 pl-3 pr-1"
            >
              <a
                href={d.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[0.75rem] tracking-[-0.01em] text-cloud transition hover:text-snow"
                title={d.address}
              >
                <span className="text-mute">{d.label}</span>{" "}
                <span className="font-medium text-snow">
                  {shortAddress(d.address)}
                </span>
              </a>
              <button
                type="button"
                onClick={() => void copy(d.id, d.address)}
                className="rounded-full px-2.5 py-1 text-[0.7rem] text-mute transition hover:bg-white/[0.08] hover:text-snow"
              >
                {copied === d.id ? "Copied" : "Copy"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
