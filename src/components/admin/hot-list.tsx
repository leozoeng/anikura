"use client";

import Link from "next/link";
import { SafeImage } from "@/components/safe-image";
import type { HotListItem } from "@/lib/admin-hot-paths";

function EmptyHot({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex min-h-[6rem] flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-black/20 px-4 py-5 text-center">
      <p className="text-sm text-cloud">{title}</p>
      <p className="mt-1 max-w-xs text-xs leading-relaxed text-mute">{body}</p>
    </div>
  );
}

export function HotList({
  title,
  subtitle,
  items,
  emptyTitle,
  emptyBody,
}: {
  title: string;
  subtitle: string;
  items: HotListItem[];
  emptyTitle: string;
  emptyBody: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-3.5 transition duration-300 hover:border-white/[0.12] sm:p-4">
      <h3 className="text-[0.95rem] tracking-[-0.02em] text-snow">{title}</h3>
      <p className="mb-2.5 text-xs text-mute">{subtitle}</p>
      {items.length === 0 ? (
        <EmptyHot title={emptyTitle} body={emptyBody} />
      ) : (
        <ol className="space-y-0">
          {items.map((item, index) => (
            <li key={`${item.path}-${index}`}>
              <Link
                href={item.href}
                className="group flex items-center gap-2.5 rounded-lg px-1 py-1.5 transition hover:bg-white/[0.04] focus-visible:bg-white/[0.04] focus-visible:outline-none"
              >
                <span className="w-4 shrink-0 text-right text-[0.65rem] tabular-nums text-mute group-hover:text-cloud">
                  {index + 1}
                </span>
                <span className="relative h-9 w-7 shrink-0 overflow-hidden rounded-md bg-white/[0.06] ring-1 ring-white/[0.08]">
                  {item.poster ? (
                    <SafeImage
                      src={item.poster}
                      alt=""
                      fill
                      className="object-cover transition duration-300 group-hover:scale-[1.04]"
                      sizes="28px"
                    />
                  ) : (
                    <span className="grid h-full w-full place-items-center text-[0.55rem] uppercase tracking-wider text-mute">
                      —
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-snow group-hover:underline group-hover:underline-offset-2">
                    {item.label}
                  </span>
                  <span className="block truncate text-[0.65rem] text-mute">
                    {item.meta}
                  </span>
                </span>
                <span className="shrink-0 text-xs tabular-nums text-cloud">
                  {item.valueLabel}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
