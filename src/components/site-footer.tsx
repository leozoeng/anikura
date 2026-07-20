import Link from "next/link";

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
        <div className="mx-auto grid max-w-[1200px] gap-12 px-5 py-16 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
          <div className="max-w-sm">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <span
                aria-hidden
                className="grid h-7 w-7 place-items-center rounded-[0.55rem] bg-snow text-[0.7rem] font-bold tracking-[-0.06em] text-void"
              >
                A
              </span>
              <span className="text-[1.05rem] font-semibold tracking-[-0.045em] text-snow">
                Anikura
              </span>
            </Link>
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

        <div className="border-t border-white/[0.06]">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-3 px-5 py-6 text-xs text-mute sm:flex-row sm:items-center sm:justify-between sm:px-8">
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
