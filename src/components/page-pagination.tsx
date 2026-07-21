import Link from "next/link";

type Props = {
  page: number;
  totalPages: number;
  hrefForPage: (page: number) => string;
};

/** Build a windowed list: first, last, current ±1, with ellipsis gaps. */
export function pageWindow(
  current: number,
  total: number,
): (number | "ellipsis")[] {
  if (total <= 1) return total === 1 ? [1] : [];
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, total]);
  for (let i = current - 1; i <= current + 1; i++) {
    if (i >= 1 && i <= total) pages.add(i);
  }
  if (current <= 3) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
  }
  if (current >= total - 2) {
    pages.add(total - 3);
    pages.add(total - 2);
    pages.add(total - 1);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | "ellipsis")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i]! - sorted[i - 1]! > 1) out.push("ellipsis");
    out.push(sorted[i]!);
  }
  return out;
}

export function PagePagination({ page, totalPages, hrefForPage }: Props) {
  if (totalPages <= 1) return null;

  const items = pageWindow(page, totalPages);

  return (
    <nav
      className="mt-14 flex flex-wrap items-center justify-center gap-2 text-sm"
      aria-label="Pagination"
    >
      {page > 1 ? (
        <Link
          href={hrefForPage(page - 1)}
          className="btn-ghost !px-3.5 !py-2 text-sm"
          rel="prev"
        >
          Previous
        </Link>
      ) : (
        <span
          className="btn-ghost pointer-events-none !px-3.5 !py-2 text-sm opacity-35"
          aria-disabled="true"
        >
          Previous
        </span>
      )}

      <ol className="flex flex-wrap items-center justify-center gap-1.5">
        {items.map((item, i) =>
          item === "ellipsis" ? (
            <li
              key={`e-${i}`}
              className="px-1.5 text-mute select-none"
              aria-hidden
            >
              …
            </li>
          ) : (
            <li key={item}>
              <Link
                href={hrefForPage(item)}
                aria-label={`Page ${item}`}
                aria-current={item === page ? "page" : undefined}
                className={
                  item === page
                    ? "inline-flex min-w-9 items-center justify-center rounded-full border border-white/90 bg-white px-2.5 py-1.5 text-sm font-semibold text-void shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_8px_20px_rgba(0,0,0,0.35)]"
                    : "inline-flex min-w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-sm text-cloud transition hover:border-white/20 hover:bg-white/[0.08] hover:text-snow"
                }
              >
                {item}
              </Link>
            </li>
          ),
        )}
      </ol>

      {page < totalPages ? (
        <Link
          href={hrefForPage(page + 1)}
          className="btn-primary !px-3.5 !py-2 text-sm"
          rel="next"
        >
          Next
        </Link>
      ) : (
        <span
          className="btn-primary pointer-events-none !px-3.5 !py-2 text-sm opacity-35"
          aria-disabled="true"
        >
          Next
        </span>
      )}
    </nav>
  );
}
