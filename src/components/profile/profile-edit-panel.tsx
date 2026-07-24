"use client";

import { SafeImage } from "@/components/safe-image";
import { ImageCropDialog } from "@/components/profile/image-crop-dialog";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";
import {
  DEFAULT_ACCENT_HEX,
  PROFILE_SELECT,
  USERNAME_MAX,
  accentAmbientEnabled,
  displayName,
  normalizeAccentHex,
  normalizeUsername,
  resolveAccentHex,
  type PublicProfile,
} from "@/lib/profile";

type Props = {
  profile: PublicProfile;
  onSaved: (profile: PublicProfile) => void;
  onCancel?: () => void;
};

type PendingCrop = {
  kind: "avatar" | "banner";
  src: string;
};

const PRESET_COLORS = [
  "#5865F2",
  "#57F287",
  "#FEE75C",
  "#EB459E",
  "#ED4245",
  "#FF8CAA",
  "#2997FF",
  "#A78BFA",
  "#F97316",
  "#14B8A6",
];

export function ProfileEditPanel({ profile, onSaved, onCancel }: Props) {
  const titleId = useId();
  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState(profile.username ?? "");
  const [nickname, setNickname] = useState(profile.nickname ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [bannerUrl, setBannerUrl] = useState(profile.banner_url);
  const [accentHex, setAccentHex] = useState(resolveAccentHex(profile));
  const [ambient, setAmbient] = useState(accentAmbientEnabled(profile));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameHint, setUsernameHint] = useState<string | null>(null);
  const [pendingCrop, setPendingCrop] = useState<PendingCrop | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keep Social partners / footer / Discord from painting through the editor.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    if (!onCancel) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy && !pendingCrop) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onCancel, pendingCrop]);

  useEffect(() => {
    return () => {
      if (pendingCrop?.src.startsWith("blob:")) {
        URL.revokeObjectURL(pendingCrop.src);
      }
    };
  }, [pendingCrop]);

  function revokePending() {
    setPendingCrop((prev) => {
      if (prev?.src.startsWith("blob:")) URL.revokeObjectURL(prev.src);
      return null;
    });
  }

  function openCropFromFile(kind: "avatar" | "banner", file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    setError(null);
    const src = URL.createObjectURL(file);
    setPendingCrop((prev) => {
      if (prev?.src.startsWith("blob:")) URL.revokeObjectURL(prev.src);
      return { kind, src };
    });
  }

  async function upload(kind: "avatars" | "banners", file: File) {
    const supabase = createClient();
    const ext =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : "jpg";
    const path = `${profile.id}/${kind}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from(kind)
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) throw upErr;
    const { data } = supabase.storage.from(kind).getPublicUrl(path);
    return data.publicUrl;
  }

  async function onCroppedFile(file: File) {
    if (!pendingCrop) return;
    const kind = pendingCrop.kind;
    const bucket = kind === "avatar" ? "avatars" : "banners";
    revokePending();
    setBusy(true);
    setError(null);
    try {
      const url = await upload(bucket, file);
      if (kind === "avatar") setAvatarUrl(url);
      else setBannerUrl(url);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : kind === "avatar"
            ? "Avatar upload failed"
            : "Banner upload failed",
      );
    } finally {
      setBusy(false);
    }
  }

  function onAvatarPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    openCropFromFile("avatar", file);
  }

  function onBannerPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    openCropFromFile("banner", file);
  }

  async function checkUsername(raw: string) {
    const normalized = normalizeUsername(raw);
    if (!normalized) {
      setUsernameHint("3–24 chars: a–z, 0–9, underscore");
      return false;
    }
    if (normalized === profile.username) {
      setUsernameHint("This is your current username");
      return true;
    }
    const supabase = createClient();
    const { data, error: err } = await supabase.rpc("username_available", {
      p_username: normalized,
      p_user_id: profile.id,
    });
    if (err) {
      setUsernameHint(err.message);
      return false;
    }
    if (!data) {
      setUsernameHint("Taken or reserved");
      return false;
    }
    setUsernameHint(`anikura.club/@${normalized} is available`);
    return true;
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const hex = normalizeAccentHex(accentHex);
      if (!hex) {
        throw new Error("Accent color must be a 6-digit hex (e.g. #5865F2)");
      }
      const handle = normalizeUsername(username);
      if (!handle) {
        throw new Error("Choose a username (3–24: letters, numbers, _)");
      }
      const ok = await checkUsername(handle);
      if (!ok && handle !== profile.username) {
        throw new Error("That username isn’t available");
      }

      const supabase = createClient();
      const { data, error: err } = await supabase
        .from("profiles")
        .update({
          username: handle,
          nickname: nickname.trim() || displayName(profile),
          bio: bio.trim() || null,
          avatar_url: avatarUrl,
          banner_url: bannerUrl,
          accent_hex: hex,
          accent_ambient: ambient,
        })
        .eq("id", profile.id)
        .select(PROFILE_SELECT)
        .single();
      if (err) throw err;
      onSaved(data as PublicProfile);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not save profile";
      if (/duplicate|unique|username/i.test(message)) {
        setError("That username is already taken");
      } else {
        setError(message);
      }
    } finally {
      setBusy(false);
    }
  }

  const previewHex = normalizeAccentHex(accentHex) ?? DEFAULT_ACCENT_HEX;

  if (!mounted) return null;

  return (
    <>
      {createPortal(
        <div className="fixed inset-0 z-[220] flex items-end justify-center p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:items-center sm:p-6">
          <button
            type="button"
            aria-label="Close edit profile"
            className="absolute inset-0 bg-black/65 backdrop-blur-[4px]"
            onClick={() => {
              if (!busy && !pendingCrop) onCancel?.();
            }}
          />
          <form
            onSubmit={save}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-[1] flex max-h-[min(92dvh,52rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[24px] border border-white/[0.12] bg-[#111214] shadow-[0_40px_100px_rgba(0,0,0,0.65)]"
          >
        <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div>
            <h2
              id={titleId}
              className="text-base font-semibold text-snow"
            >
              Edit profile
            </h2>
            <p className="text-sm text-[#949ba4]">
              Username, nickname, media, and accent.
            </p>
          </div>
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="rounded-full px-3 py-1.5 text-sm text-[#949ba4] transition hover:bg-white/[0.06] hover:text-snow disabled:opacity-60"
            >
              Cancel
            </button>
          ) : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="grid gap-6 p-5 sm:grid-cols-2 sm:p-6">
            <label className="block text-sm">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#949ba4]">
                Username
              </span>
              <div className="relative mt-2">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#6d6f78]">
                  @
                </span>
                <input
                  value={username}
                  onChange={(e) => {
                    const next = e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9_]/g, "")
                      .slice(0, USERNAME_MAX);
                    setUsername(next);
                    setUsernameHint(null);
                  }}
                  onBlur={() => {
                    if (username.trim()) void checkUsername(username);
                  }}
                  maxLength={USERNAME_MAX}
                  spellCheck={false}
                  autoComplete="off"
                  className="w-full rounded-xl border border-white/10 bg-[#1e1f22] py-2.5 pl-7 pr-3 text-snow outline-none transition focus:border-white/30"
                  placeholder="yourname"
                />
              </div>
              <p className="mt-1.5 text-[0.7rem] text-[#6d6f78]">
                {usernameHint ||
                  (username
                    ? `Public link: anikura.club/@${username}`
                    : "Unique vanity handle — once taken, it’s yours.")}
              </p>
            </label>

            <label className="block text-sm">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#949ba4]">
                Display name
              </span>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={40}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#1e1f22] px-3 py-2.5 text-snow outline-none transition focus:border-white/30"
                placeholder="How others see you"
              />
            </label>

            <label className="block text-sm sm:col-span-2">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#949ba4]">
                About Me
              </span>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                maxLength={280}
                rows={3}
                className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-[#1e1f22] px-3 py-2.5 text-snow outline-none transition focus:border-white/30"
                placeholder="A quiet line about what you watch"
              />
            </label>

            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#949ba4]">
                Profile picture
              </p>
              <div className="mt-2 flex items-center gap-3">
                <div
                  className="relative h-14 w-14 overflow-hidden rounded-full bg-[#1e1f22]"
                  style={{ boxShadow: `0 0 0 3px ${previewHex}` }}
                >
                  {avatarUrl ? (
                    <SafeImage
                      src={avatarUrl}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <label className="cursor-pointer rounded-full border border-white/15 px-3 py-1.5 text-sm text-[#dbdee1] transition hover:border-white/30 hover:text-snow">
                  {busy ? "Uploading…" : "Upload & crop"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onAvatarPick}
                    disabled={busy || pendingCrop !== null}
                  />
                </label>
              </div>
            </div>

            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#949ba4]">
                Banner
              </p>
              <div className="mt-2">
                <div className="relative mb-2 h-16 overflow-hidden rounded-xl bg-[#1e1f22]">
                  {bannerUrl ? (
                    <SafeImage
                      src={bannerUrl}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(135deg, ${previewHex}, #1a1b1e)`,
                      }}
                    />
                  )}
                </div>
                <label className="inline-flex cursor-pointer rounded-full border border-white/15 px-3 py-1.5 text-sm text-[#dbdee1] transition hover:border-white/30 hover:text-snow">
                  {busy ? "Uploading…" : "Upload & crop"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onBannerPick}
                    disabled={busy || pendingCrop !== null}
                  />
                </label>
              </div>
            </div>

            <div className="sm:col-span-2">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#949ba4]">
                Profile accent
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <input
                  type="color"
                  value={previewHex}
                  onChange={(e) => setAccentHex(e.target.value.toUpperCase())}
                  className="h-10 w-12 cursor-pointer overflow-hidden rounded-lg border border-white/10 bg-transparent"
                  aria-label="Pick accent color"
                />
                <input
                  value={accentHex}
                  onChange={(e) => setAccentHex(e.target.value)}
                  maxLength={7}
                  spellCheck={false}
                  className="w-28 rounded-xl border border-white/10 bg-[#1e1f22] px-3 py-2.5 font-mono text-sm uppercase text-snow outline-none transition focus:border-white/30"
                  placeholder="#5865F2"
                />
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      title={c}
                      onClick={() => setAccentHex(c)}
                      className="h-7 w-7 rounded-full ring-2 ring-transparent transition hover:scale-110"
                      style={{
                        background: c,
                        boxShadow:
                          previewHex.toUpperCase() === c
                            ? `0 0 0 2px #111214, 0 0 0 4px ${c}`
                            : undefined,
                      }}
                    />
                  ))}
                </div>
              </div>

              <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl bg-[#1e1f22] px-3.5 py-3 ring-1 ring-white/[0.04]">
                <input
                  type="checkbox"
                  checked={ambient}
                  onChange={(e) => setAmbient(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-white"
                />
                <span>
                  <span className="block text-sm font-medium text-snow">
                    Ambient glow
                  </span>
                  <span className="mt-0.5 block text-xs text-[#949ba4]">
                    Soft wash and avatar ring tint derived from your accent color
                    — like a theme behind the card.
                  </span>
                </span>
              </label>
            </div>
          </div>

          {error ? (
            <p className="px-5 pb-2 text-sm text-[#ff8a8a] sm:px-6" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-white/[0.06] px-5 py-4 sm:px-6">
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="rounded-full px-4 py-2.5 text-sm text-[#949ba4] transition hover:text-snow disabled:opacity-60"
            >
              Cancel
            </button>
          ) : null}
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-snow px-5 py-2.5 text-sm font-medium text-void transition hover:bg-white disabled:opacity-60"
          >
            {busy ? "Saving…" : "Save profile"}
          </button>
        </div>
      </form>
        </div>,
        document.body,
      )}
      {pendingCrop ? (
        <ImageCropDialog
          kind={pendingCrop.kind}
          imageSrc={pendingCrop.src}
          onCancel={revokePending}
          onCropped={(file) => void onCroppedFile(file)}
        />
      ) : null}
    </>
  );
}
