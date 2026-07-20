"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  LIST_STATUSES,
  type AnimeListEntry,
  type ListStatus,
} from "@/lib/anime-list";
import { displayName, type PublicProfile } from "@/lib/profile";
import { ProfileEditPanel } from "@/components/profile/profile-edit-panel";

type Props = {
  profile: PublicProfile;
  list: AnimeListEntry[];
  isOwner: boolean;
};

export function ProfileView({ profile, list, isOwner }: Props) {
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<ListStatus | "favorites" | "all">("all");
  const [live, setLive] = useState(profile);

  const filtered = useMemo(() => {
    if (tab === "all") return list;
    if (tab === "favorites") return list.filter((x) => x.is_favorite);
    return list.filter((x) => x.status === tab);
  }, [list, tab]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: list.length, favorites: 0 };
    for (const s of LIST_STATUSES) c[s.id] = 0;
    for (const item of list) {
      c[item.status] = (c[item.status] ?? 0) + 1;
      if (item.is_favorite) c.favorites += 1;
    }
    return c;
  }, [list]);

  const name = displayName(live);

  return (
    <div className="pb-24">
      <div className="relative h-44 overflow-hidden border-b border-white/[0.06] sm:h-56">
        {live.banner_url ? (
          <Image
            src={live.banner_url}
            alt=""
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(800px_280px_at_20%_40%,rgba(255,140,170,0.18),transparent_60%),linear-gradient(180deg,#121218,#050507)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-void via-void/40 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-[1100px] px-3 sm:px-4">
        <div className="-mt-12 flex flex-wrap items-end gap-4 sm:-mt-14">
          <div className="relative h-24 w-24 overflow-hidden rounded-full bg-raised ring-2 ring-void sm:h-28 sm:w-28">
            {live.avatar_url ? (
              <Image
                src={live.avatar_url}
                alt=""
                fill
                className="object-cover"
                sizes="112px"
              />
            ) : (
              <div className="grid h-full w-full place-items-center bg-white/[0.06] text-2xl text-sakura-soft">
                {name.slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 pb-1">
            <h1 className="truncate text-[clamp(1.6rem,3vw,2.2rem)] font-semibold tracking-[-0.04em] text-snow">
              {name}
            </h1>
            {live.bio ? (
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-cloud">
                {live.bio}
              </p>
            ) : isOwner ? (
              <p className="mt-1 text-sm text-mute">Add a short bio.</p>
            ) : null}
          </div>

          {isOwner ? (
            <button
              type="button"
              onClick={() => setEditing((v) => !v)}
              className="mb-1 rounded-full bg-snow px-4 py-2 text-sm font-medium text-void transition hover:bg-white"
            >
              {editing ? "Close editor" : "Edit profile"}
            </button>
          ) : null}
        </div>

        {editing && isOwner ? (
          <div className="mt-8">
            <ProfileEditPanel
              profile={live}
              onSaved={(next) => {
                setLive(next);
                setEditing(false);
              }}
            />
          </div>
        ) : null}

        <section className="mt-10">
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: "all" as const, label: "All" },
                { id: "favorites" as const, label: "Favorites" },
                ...LIST_STATUSES.map((s) => ({ id: s.id, label: s.label })),
              ] satisfies { id: ListStatus | "favorites" | "all"; label: string }[]
            ).map((t) => {
              const count = counts[t.id] ?? 0;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`rounded-full px-3.5 py-1.5 text-[0.8rem] transition ${
                    active
                      ? "bg-snow text-void"
                      : "border border-white/12 text-cloud hover:border-white/25 hover:text-snow"
                  }`}
                >
                  {t.label}
                  <span className="ml-1.5 opacity-60">{count}</span>
                </button>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <p className="mt-10 text-sm text-mute">
              {isOwner
                ? "Nothing here yet — mark titles from Browse or a series page."
                : "No titles in this list."}
            </p>
          ) : (
            <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {filtered.map((item) => (
                <Link
                  key={item.id}
                  href={`/anime/${item.anime_id}/${item.slug}`}
                  className="group block"
                >
                  <div className="relative aspect-[2/3] overflow-hidden rounded-[1.1rem] bg-raised ring-1 ring-white/8 transition duration-500 group-hover:-translate-y-1 group-hover:ring-white/25">
                    {item.poster ? (
                      <Image
                        src={item.poster}
                        alt=""
                        fill
                        className="object-cover transition duration-700 group-hover:scale-[1.04]"
                        sizes="180px"
                      />
                    ) : null}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-2.5 pb-2.5 pt-8">
                      <p className="text-[0.65rem] uppercase tracking-[0.12em] text-cloud">
                        {item.is_favorite ? "★ " : ""}
                        {item.status.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2.5 line-clamp-2 text-sm tracking-[-0.02em] text-snow transition group-hover:text-sakura-soft">
                    {item.title}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
