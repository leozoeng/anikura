"use client";

import { SafeImage } from "@/components/safe-image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { animeHref } from "@/lib/anikoto";

export type FeaturedPoster = {
  id: number;
  slug: string;
  title: string;
  year: number;
  poster: string;
};

export type FeaturedSlide = {
  id: "ghibli" | "onepiece" | "shinkai";
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
  heroSrc: string | null;
  posters: FeaturedPoster[];
  totalLabel: string;
};

const ROTATE_MS = 7000;

const THEMES: Record<
  FeaturedSlide["id"],
  {
    border: string;
    veil: string;
    cloudA: string;
    cloudB: string;
    eyebrow: string;
    title: string;
    body: string;
    cta: string;
    ring: string;
    year: string;
    more: string;
    accentLine: string;
    titleFont?: string;
    decor: "meadow" | "sea" | "sky";
  }
> = {
  ghibli: {
    border: "border-[#c5d4b8]/22",
    veil: `
      linear-gradient(115deg, rgba(8,14,11,0.96) 0%, rgba(12,22,16,0.88) 38%, rgba(10,18,14,0.62) 100%),
      radial-gradient(520px 260px at 85% 35%, rgba(160,205,175,0.28), transparent 62%),
      radial-gradient(420px 220px at 10% 80%, rgba(232,210,150,0.1), transparent 60%)
    `,
    cloudA: "bg-white/12",
    cloudB: "bg-[#c5dce8]/18",
    eyebrow: "text-[#a8c4a0]",
    title: "text-[#f7f3e8]",
    body: "text-[#b4c6ac]",
    cta: "bg-[#e8f0dc] text-[#1a2618] hover:bg-[#f4f8ea]",
    ring: "ring-[#c5d4b8]/20 group-hover:ring-[#e8f0dc]/45",
    year: "text-[#e8f0dc]",
    more: "border-[#c5d4b8]/35 bg-[#c5d4b8]/10 text-[#c5d4b8] hover:border-[#e8f0dc]/55",
    accentLine: "via-[#c5d4b8]/35",
    titleFont: "var(--font-ghibli), var(--font-sans)",
    decor: "meadow",
  },
  onepiece: {
    border: "border-[#f0a35a]/28",
    veil: `
      linear-gradient(118deg, rgba(6,18,32,0.97) 0%, rgba(12,36,58,0.9) 42%, rgba(28,22,14,0.72) 100%),
      radial-gradient(540px 280px at 88% 30%, rgba(255,140,60,0.28), transparent 60%),
      radial-gradient(480px 240px at 12% 85%, rgba(40,140,210,0.22), transparent 58%)
    `,
    cloudA: "bg-[#3aa0e8]/16",
    cloudB: "bg-[#ff9a3c]/14",
    eyebrow: "text-[#7ec8ff]",
    title: "text-[#fff6e8]",
    body: "text-[#b8d4ea]",
    cta: "bg-gradient-to-b from-[#ffd28a] to-[#f0a035] text-[#1a1208] hover:from-[#ffe0a8] hover:to-[#f5b04a]",
    ring: "ring-[#f0a35a]/25 group-hover:ring-[#ffd28a]/50",
    year: "text-[#ffe8c4]",
    more: "border-[#f0a35a]/40 bg-[#f0a35a]/12 text-[#ffd28a] hover:border-[#ffd28a]/55",
    accentLine: "via-[#f0a35a]/40",
    decor: "sea",
  },
  shinkai: {
    border: "border-[#8bb4e8]/28",
    veil: `
      linear-gradient(120deg, rgba(8,12,28,0.97) 0%, rgba(18,28,52,0.9) 40%, rgba(42,24,38,0.7) 100%),
      radial-gradient(560px 300px at 82% 28%, rgba(120,170,255,0.32), transparent 62%),
      radial-gradient(440px 240px at 18% 78%, rgba(255,140,120,0.16), transparent 58%)
    `,
    cloudA: "bg-[#9ec4ff]/14",
    cloudB: "bg-[#ffb4a0]/12",
    eyebrow: "text-[#a8c8ff]",
    title: "text-[#f4f7ff]",
    body: "text-[#b4c4e0]",
    cta: "bg-gradient-to-b from-[#e8f0ff] to-[#c8d8f8] text-[#121828] hover:from-[#f4f8ff] hover:to-[#d8e4ff]",
    ring: "ring-[#8bb4e8]/25 group-hover:ring-[#c8d8f8]/45",
    year: "text-[#dce8ff]",
    more: "border-[#8bb4e8]/35 bg-[#8bb4e8]/12 text-[#b8d0f8] hover:border-[#c8d8f8]/50",
    accentLine: "via-[#8bb4e8]/40",
    decor: "sky",
  },
};

type Props = {
  slides: FeaturedSlide[];
};

export function BrowseFeatured({ slides }: Props) {
  const valid = slides.filter((s) => s.posters.length > 0);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    if (valid.length < 2 || paused) return;
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % valid.length);
    }, ROTATE_MS);
    return () => window.clearInterval(t);
  }, [valid.length, paused]);

  if (!valid.length) return null;

  const slide = valid[Math.min(index, valid.length - 1)]!;
  const theme = THEMES[slide.id];
  const preview = slide.posters.slice(0, 7);

  function go(next: number) {
    setIndex(((next % valid.length) + valid.length) % valid.length);
  }

  return (
    <section
      className={`featured-teaser relative mt-10 overflow-hidden rounded-[1.6rem] border ${theme.border}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
      onTouchStart={(e) => {
        touchX.current = e.changedTouches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchX.current;
        const end = e.changedTouches[0]?.clientX;
        touchX.current = null;
        if (start == null || end == null) return;
        const dx = end - start;
        if (Math.abs(dx) < 48) return;
        go(index + (dx < 0 ? 1 : -1));
      }}
      aria-roledescription="carousel"
      aria-label="Featured collections"
    >
      <div aria-hidden className="absolute inset-0">
        {slide.heroSrc ? (
          <SafeImage
            key={slide.heroSrc}
            src={slide.heroSrc}
            alt=""
            fill
            className="object-cover opacity-40 transition-opacity duration-700"
            sizes="1200px"
            priority={index === 0}
          />
        ) : null}
        <div className="absolute inset-0" style={{ background: theme.veil }} />
        <div
          className={`featured-cloud absolute -left-[6%] top-[18%] h-24 w-[40%] rounded-full blur-3xl ${theme.cloudA}`}
        />
        <div
          className={`featured-cloud-slow absolute right-[-8%] top-[28%] h-20 w-[34%] rounded-full blur-3xl ${theme.cloudB}`}
        />
        {theme.decor === "sea" ? (
          <>
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0a2840]/55 to-transparent" />
            <div className="featured-wave absolute -bottom-6 left-[-10%] h-16 w-[60%] rounded-[100%] bg-[#2a7ec0]/15 blur-2xl" />
            <div className="featured-wave-slow absolute -bottom-4 right-[-8%] h-14 w-[50%] rounded-[100%] bg-[#f0a35a]/12 blur-2xl" />
          </>
        ) : null}
        {theme.decor === "sky" ? (
          <>
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#6a9fff]/12 to-transparent" />
            <div className="featured-ray absolute left-[55%] top-[-20%] h-[140%] w-24 rotate-[18deg] bg-gradient-to-b from-white/10 to-transparent blur-xl" />
          </>
        ) : null}
      </div>

      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${theme.accentLine} to-transparent`}
      />

      <div
        key={slide.id}
        className="relative flex flex-col gap-7 p-5 animate-rise sm:p-6 lg:flex-row lg:items-end lg:justify-between lg:gap-10 lg:p-7"
        style={{ animationDuration: "0.45s" }}
      >
        <div className="max-w-md shrink-0">
          <p
            className={`text-[0.65rem] font-semibold uppercase tracking-[0.26em] ${theme.eyebrow}`}
          >
            {slide.eyebrow}
          </p>
          <h2
            className={`mt-2 text-[clamp(1.85rem,3.8vw,2.5rem)] font-semibold leading-[1.05] tracking-[-0.03em] ${theme.title}`}
            style={theme.titleFont ? { fontFamily: theme.titleFont } : undefined}
          >
            {slide.title}
          </h2>
          <p className={`mt-2.5 text-sm leading-relaxed ${theme.body}`}>
            {slide.body}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link
              href={slide.href}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold shadow-[0_10px_28px_rgba(0,0,0,0.35)] transition hover:shadow-[0_14px_36px_rgba(0,0,0,0.4)] ${theme.cta}`}
            >
              {slide.cta}
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="scrollbar-none -mx-1 flex snap-x snap-mandatory items-end gap-2.5 overflow-x-auto px-1 pb-1 sm:gap-3">
            {preview.map((item, i) => (
              <Link
                key={`${slide.id}-${item.id}`}
                href={animeHref(item)}
                className="group relative w-[5.5rem] shrink-0 snap-start sm:w-[5.35rem] md:w-[5.85rem]"
                style={{
                  transform: `translateY(${(i % 3) * 5}px) rotate(${((i % 2) * 2 - 1) * 1.4}deg)`,
                }}
                title={`${item.title} (${item.year})`}
              >
                <div
                  className={`relative aspect-[2/3] overflow-hidden rounded-[0.95rem] bg-black/40 shadow-[0_14px_32px_rgba(0,0,0,0.5)] ring-1 transition duration-400 group-hover:rotate-0 ${theme.ring}`}
                >
                  <SafeImage
                    src={item.poster}
                    alt={item.title}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-[1.06]"
                    sizes="94px"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent opacity-55 transition duration-300 group-hover:opacity-100" />
                  <span
                    className={`absolute bottom-1.5 left-1.5 z-[1] rounded bg-black/35 px-1 py-0.5 text-[0.55rem] font-medium tabular-nums backdrop-blur-[2px] ${theme.year}`}
                  >
                    {item.year}
                  </span>
                </div>
              </Link>
            ))}
            <Link
              href={slide.href}
              className={`flex w-[4.6rem] shrink-0 flex-col items-center justify-center gap-1 rounded-[0.95rem] border border-dashed text-center transition sm:w-[5.35rem] md:w-[5.85rem] ${theme.more}`}
              style={{ aspectRatio: "2/3" }}
            >
              <span className="text-xl leading-none opacity-80">+</span>
              <span className="px-1.5 text-[0.62rem] font-medium leading-tight">
                {slide.totalLabel}
              </span>
            </Link>
          </div>
        </div>
      </div>

      {valid.length > 1 ? (
        <div className="relative z-10 flex items-center justify-center gap-2 pb-4 pt-0">
          {valid.map((s, i) => {
            const active = i === index;
            return (
              <button
                key={s.id}
                type="button"
                aria-label={`Show ${s.title}`}
                aria-current={active ? "true" : undefined}
                onClick={() => go(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  active
                    ? "w-7 bg-white/90"
                    : "w-1.5 bg-white/30 hover:bg-white/50"
                }`}
              />
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
