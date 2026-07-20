"use client";

import Image from "next/image";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { displayName, type PublicProfile } from "@/lib/profile";

type Props = {
  profile: PublicProfile;
  onSaved: (profile: PublicProfile) => void;
};

export function ProfileEditPanel({ profile, onSaved }: Props) {
  const [nickname, setNickname] = useState(profile.nickname ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [bannerUrl, setBannerUrl] = useState(profile.banner_url);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(kind: "avatars" | "banners", file: File) {
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${profile.id}/${kind}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from(kind)
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) throw upErr;
    const { data } = supabase.storage.from(kind).getPublicUrl(path);
    return data.publicUrl;
  }

  async function onAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const url = await upload("avatars", file);
      setAvatarUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Avatar upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function onBanner(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const url = await upload("banners", file);
      setBannerUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Banner upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: err } = await supabase
        .from("profiles")
        .update({
          nickname: nickname.trim() || displayName(profile),
          bio: bio.trim() || null,
          avatar_url: avatarUrl,
          banner_url: bannerUrl,
        })
        .eq("id", profile.id)
        .select(
          "id, email, nickname, bio, avatar_url, banner_url, created_at, role",
        )
        .single();
      if (err) throw err;
      onSaved(data as PublicProfile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={save}
      className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-mute">Nickname</span>
          <input
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={40}
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-snow outline-none transition focus:border-white/30"
            placeholder="How others see you"
          />
        </label>

        <label className="block text-sm sm:col-span-2">
          <span className="text-mute">Bio</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={280}
            rows={3}
            className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-snow outline-none transition focus:border-white/30"
            placeholder="A quiet line about what you watch"
          />
        </label>

        <div>
          <p className="text-sm text-mute">Profile picture</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="relative h-14 w-14 overflow-hidden rounded-full bg-raised">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="" fill className="object-cover" />
              ) : null}
            </div>
            <label className="cursor-pointer rounded-full border border-white/15 px-3 py-1.5 text-sm text-cloud transition hover:border-white/30 hover:text-snow">
              Upload
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onAvatar}
                disabled={busy}
              />
            </label>
          </div>
        </div>

        <div>
          <p className="text-sm text-mute">Banner</p>
          <div className="mt-2">
            <div className="relative mb-2 h-16 overflow-hidden rounded-xl bg-raised">
              {bannerUrl ? (
                <Image src={bannerUrl} alt="" fill className="object-cover" />
              ) : null}
            </div>
            <label className="inline-flex cursor-pointer rounded-full border border-white/15 px-3 py-1.5 text-sm text-cloud transition hover:border-white/30 hover:text-snow">
              Upload
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onBanner}
                disabled={busy}
              />
            </label>
          </div>
        </div>
      </div>

      {error ? <p className="mt-4 text-sm text-[#ff8a8a]">{error}</p> : null}

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-snow px-5 py-2.5 text-sm font-medium text-void transition hover:bg-white disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save profile"}
        </button>
      </div>
    </form>
  );
}
