"use client";

import Link from "next/link";
import { SafeImage } from "@/components/safe-image";
import type { HotListItem } from "@/lib/admin-hot-paths";

function EmptyHot({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex min-h-[9rem] flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-black/20 px-4 py-8 text-center">
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
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 transition duration-300 hover:border-white/[0.12]">
      <h3 className="text-base tracking-[-0.02em] text-snow">{title}</h3>
      <p className="mb-4 text-sm text-mute">{subtitle}</p>
      {items.length === 0 ? (
        <EmptyHot title={emptyTitle} body={emptyBody} />
      ) : (
        <ol className="space-y-0.5">
          {items.map((item, index) => (
            <li key={`${item.path}-${index}`}>
              <Link
                href={item.href}
                className="group flex items-center gap-3 rounded-xl px-1.5 py-2 transition hover:bg-white/[0.04] focus-visible:bg-white/[0.04] focus-visible:outline-none"
              >
                <span className="w-5 shrink-0 text-right text-[0.7rem] tabular-nums text-mute group-hover:text-cloud">
                  {index + 1}
                </span>
                <span className="relative h-11 w-8 shrink-0 overflow-hidden rounded-md bg-white/[0.06] ring-1 ring-white/[0.08]">
                  {item.poster ? (
                    <SafeImage
                      src={item.poster}
                      alt=""
                      fill
                      className="object-cover transition duration-300 group-hover:scale-[1.04]"
                      sizes="32px"
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
                  <span className="block truncate text-[0.7rem] text-mute">
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
