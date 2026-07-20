"use client";

import Image from "next/image";
import { useMemo, useRef, useState, useTransition } from "react";
import {
  resetMoodArtOverride,
  saveMoodArtOverride,
} from "@/app/admin/mood-art-actions";
import {
  MOOD_ART,
  adminMoodSlugs,
  moodLabel,
} from "@/lib/genre-moods";
import { createClient } from "@/lib/supabase/client";

type MoodArtManagerProps = {
  initialOverrides: Record<string, string>;
};

export function MoodArtManager({ initialOverrides }: MoodArtManagerProps) {
  const [overrides, setOverrides] = useState(initialOverrides);
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const slugs = useMemo(() => adminMoodSlugs(), []);

  async function uploadFile(slug: string, file: File) {
    setBusySlug(slug);
    setError(null);
    setMessage(null);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext)
        ? ext === "jpeg"
          ? "jpg"
          : ext
        : "jpg";
      const path = `${slug}.${safeExt}`;
      const { error: upErr } = await supabase.storage
        .from("moods")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;

      const { data } = supabase.storage.from("moods").getPublicUrl(path);
      const url = `${data.publicUrl}?v=${Date.now()}`;

      await saveMoodArtOverride(slug, url);

      startTransition(() => {
        setOverrides((prev) => ({ ...prev, [slug]: url }));
        setMessage(`Updated ${moodLabel(slug)}`);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusySlug(null);
    }
  }

  async function onReset(slug: string) {
    setBusySlug(slug);
    setError(null);
    setMessage(null);
    try {
      await resetMoodArtOverride(slug);
      startTransition(() => {
        setOverrides((prev) => {
          const next = { ...prev };
          delete next[slug];
          return next;
        });
        setMessage(`Reset ${moodLabel(slug)} to default`);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setBusySlug(null);
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg tracking-[-0.02em] text-snow">Mood art</h2>
          <p className="text-sm text-mute">
            Upload or replace genre tile images. Defaults live in{" "}
            <code className="text-cloud">/moods</code>; overrides persist in
            Storage.
          </p>
        </div>
        {(message || error) && (
          <p
            className={`text-sm ${error ? "text-sakura" : "text-cloud"}`}
            role="status"
          >
            {error ?? message}
          </p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {slugs.map((slug) => {
          const defaultArt = MOOD_ART[slug];
          const override = overrides[slug];
          const src = override ?? defaultArt?.src ?? null;
          const isCustom = Boolean(override);
          const busy = busySlug === slug || pending;

          return (
            <div
              key={slug}
              className="overflow-hidden rounded-xl border border-white/[0.08] bg-black/30"
            >
              <div className="relative aspect-[16/10] bg-elevated">
                {src ? (
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="280px"
                    className={`object-cover ${defaultArt?.position ?? "object-center"}`}
                    unoptimized={isCustom}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-mute">
                    No default art
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-2 left-3 right-3">
                  <p className="text-sm font-medium tracking-[-0.02em] text-snow">
                    {moodLabel(slug)}
                  </p>
                  <p className="text-[0.65rem] uppercase tracking-[0.12em] text-mute">
                    {isCustom
                      ? "Custom"
                      : defaultArt
                        ? "Default"
                        : "Catalog fallback"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3">
                <input
                  ref={(el) => {
                    inputRefs.current[slug] = el;
                  }}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) void uploadFile(slug, file);
                  }}
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => inputRefs.current[slug]?.click()}
                  className="flex-1 rounded-full border border-white/12 bg-white/[0.06] px-3 py-1.5 text-xs text-snow transition hover:border-white/20 hover:bg-white/[0.1] disabled:opacity-50"
                >
                  {busy ? "Working…" : isCustom ? "Replace" : "Upload"}
                </button>
                {isCustom ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onReset(slug)}
                    className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-mute transition hover:border-white/20 hover:text-snow disabled:opacity-50"
                  >
                    Reset
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
