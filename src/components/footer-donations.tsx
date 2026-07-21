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
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function FooterDonations() {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(id: string, address: string) {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(id);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
      {DONATIONS.map((d) => {
        const isCopied = copied === d.id;
        return (
          <div
            key={d.id}
            className="footer-donate-row group flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-2.5 py-2 sm:min-w-[14rem]"
            title={`${d.label}: ${d.address}`}
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-black/35 ring-1 ring-white/10 transition duration-300 group-hover:ring-white/20">
              {d.id === "sol" ? <SolanaIcon /> : <EthereumIcon />}
            </span>

            <a
              href={d.href}
              target="_blank"
              rel="noopener noreferrer"
              className="min-w-0 flex-1 leading-tight"
            >
              <span className="block text-[0.78rem] font-semibold tracking-[-0.02em] text-snow transition group-hover:text-white">
                {d.label}
              </span>
              <span className="block font-mono text-[0.68rem] text-mute transition group-hover:text-cloud">
                {shortAddress(d.address)}
              </span>
            </a>

            <button
              type="button"
              onClick={() => void copy(d.id, d.address)}
              aria-label={isCopied ? `${d.label} copied` : `Copy ${d.label} address`}
              className={`inline-flex h-9 min-w-[4.25rem] shrink-0 items-center justify-center rounded-lg text-[0.72rem] font-semibold tracking-[-0.01em] transition duration-300 ${
                isCopied
                  ? "bg-[#ff8caa]/22 text-sakura-mist ring-1 ring-[#ff8caa]/35"
                  : "bg-white/[0.06] text-cloud ring-1 ring-white/10 hover:bg-white/[0.1] hover:text-snow"
              }`}
            >
              {isCopied ? "Copied ✓" : "Copy"}
            </button>
          </div>
        );
      })}
    </div>
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
      <path
        fill="#8A92B2"
        d="M127.961 0 125.167 9.5v275.527l2.794 2.79 127.963-75.638z"
      />
      <path fill="#62688F" d="M127.962 0 0 212.179l127.962 75.638V154.338z" />
      <path
        fill="#8A92B2"
        d="m127.961 312.187-1.575 1.92v98.199l1.575 4.601 128.039-180.32z"
      />
      <path fill="#62688F" d="M127.962 416.905v-104.72L0 236.185z" />
      <path
        fill="#454A75"
        d="m127.961 287.958 127.96-75.637-127.96-58.162z"
      />
      <path fill="#8A92B2" d="m.001 212.321 127.96 75.637V154.159z" />
    </svg>
  );
}
