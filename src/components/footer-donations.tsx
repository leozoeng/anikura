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
  return `${address.slice(0, 4)}…${address.slice(-3)}`;
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
    <div className="inline-flex w-full max-w-full flex-col gap-2.5 rounded-2xl border border-[#ff8caa]/28 bg-[linear-gradient(135deg,rgba(255,140,170,0.16),rgba(255,255,255,0.04)_55%,rgba(255,179,199,0.1))] p-2.5 shadow-[inset_0_1px_0_rgba(255,232,238,0.12)] sm:w-auto sm:flex-row sm:items-center sm:gap-3 sm:py-1.5 sm:pl-2.5 sm:pr-1.5">
      <div className="inline-flex min-w-0 items-center gap-2.5 px-0.5 sm:pr-1">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#ff8caa]/18 ring-1 ring-[#ff8caa]/30">
          <HeartPetal />
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block text-[0.7rem] font-semibold tracking-[-0.02em] text-sakura-mist">
            Keep Anikura cozy
          </span>
          <span className="block text-[0.62rem] tracking-[-0.01em] text-[#ffb3c7]/85">
            Donations keep the lights on ♡
          </span>
        </span>
      </div>

      <span
        aria-hidden
        className="hidden h-7 w-px shrink-0 bg-[#ff8caa]/22 sm:block"
      />

      <div className="flex min-w-0 flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-1.5">
        {DONATIONS.map((d) => (
          <div
            key={d.id}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/[0.08] bg-black/25 py-1 pl-2 pr-1 transition hover:border-white/15 hover:bg-black/35"
            title={`${d.label}: ${d.address}`}
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-black/40 ring-1 ring-white/10">
              {d.id === "sol" ? <SolanaIcon /> : <EthereumIcon />}
            </span>
            <a
              href={d.href}
              target="_blank"
              rel="noopener noreferrer"
              className="min-w-0 leading-tight"
            >
              <span className="block text-[0.68rem] font-medium tracking-[-0.01em] text-snow">
                {d.label}
              </span>
              <span className="block font-mono text-[0.62rem] text-mute">
                {shortAddress(d.address)}
              </span>
            </a>
            <button
              type="button"
              onClick={() => void copy(d.id, d.address)}
              className="rounded-lg px-2 py-1 text-[0.68rem] text-mute transition hover:bg-white/[0.08] hover:text-snow"
            >
              {copied === d.id ? "Copied" : "Copy"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeartPetal() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#ffb3c7"
        d="M12 20.4c-.4 0-.7-.1-1-.4C7.2 16.4 4 13.5 4 10.1 4 7.5 6 5.6 8.5 5.6c1.4 0 2.6.6 3.5 1.7.9-1.1 2.1-1.7 3.5-1.7C17.9 5.6 20 7.5 20 10.1c0 3.4-3.2 6.3-7 9.9-.3.3-.6.4-1 .4Z"
      />
      <circle cx="9.2" cy="9.4" r="0.9" fill="#ffe8ee" opacity="0.85" />
    </svg>
  );
}

function SolanaIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 397.7 311.7" aria-hidden>
      <linearGradient
        id="sol-a"
        gradientUnits="userSpaceOnUse"
        x1="360.879"
        y1="351.455"
        x2="141.213"
        y2="-69.294"
        gradientTransform="matrix(1 0 0 -1 0 314)"
      >
        <stop offset="0" stopColor="#00FFA3" />
        <stop offset="1" stopColor="#DC1FFF" />
      </linearGradient>
      <path
        fill="url(#sol-a)"
        d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z"
      />
      <linearGradient
        id="sol-b"
        gradientUnits="userSpaceOnUse"
        x1="264.829"
        y1="401.601"
        x2="45.163"
        y2="-19.147"
        gradientTransform="matrix(1 0 0 -1 0 314)"
      >
        <stop offset="0" stopColor="#00FFA3" />
        <stop offset="1" stopColor="#DC1FFF" />
      </linearGradient>
      <path
        fill="url(#sol-b)"
        d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z"
      />
      <linearGradient
        id="sol-c"
        gradientUnits="userSpaceOnUse"
        x1="312.548"
        y1="376.688"
        x2="92.882"
        y2="-44.061"
        gradientTransform="matrix(1 0 0 -1 0 314)"
      >
        <stop offset="0" stopColor="#00FFA3" />
        <stop offset="1" stopColor="#DC1FFF" />
      </linearGradient>
      <path
        fill="url(#sol-c)"
        d="M333.1 120.9c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z"
      />
    </svg>
  );
}

function EthereumIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 256 417" aria-hidden>
      <path fill="#8A92B2" d="M127.961 0 125.167 9.5v275.527l2.794 2.79 127.963-75.638z" />
      <path fill="#62688F" d="M127.962 0 0 212.179l127.962 75.638V154.338z" />
      <path fill="#8A92B2" d="m127.961 312.187-1.575 1.92v98.199l1.575 4.601 128.039-180.32z" />
      <path fill="#62688F" d="M127.962 416.905v-104.72L0 236.185z" />
      <path fill="#454A75" d="m127.961 287.958 127.96-75.637-127.96-58.162z" />
      <path fill="#8A92B2" d="m.001 212.321 127.96 75.637V154.159z" />
    </svg>
  );
}
