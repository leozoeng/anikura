"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import Cropper, { type Area } from "react-easy-crop";
import { cropImageToFile, type PixelCrop } from "@/lib/crop-image";

export type ProfileCropKind = "avatar" | "banner";

type Props = {
  kind: ProfileCropKind;
  imageSrc: string;
  onCancel: () => void;
  onCropped: (file: File) => void;
};

const KIND_COPY: Record<
  ProfileCropKind,
  { title: string; hint: string; aspect: number; round: boolean; maxEdge: number }
> = {
  avatar: {
    title: "Crop profile picture",
    hint: "Drag to reposition · pinch or scroll to zoom",
    aspect: 1,
    round: true,
    maxEdge: 1024,
  },
  banner: {
    title: "Crop banner",
    hint: "Drag to reposition · pinch or scroll to zoom",
    // Matches the profile sidebar banner (~2:1).
    aspect: 2,
    round: false,
    maxEdge: 1920,
  },
};

export function ImageCropDialog({
  kind,
  imageSrc,
  onCancel,
  onCropped,
}: Props) {
  const titleId = useId();
  const copy = KIND_COPY[kind];
  const [mounted, setMounted] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<PixelCrop | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function apply() {
    if (!croppedAreaPixels) return;
    setBusy(true);
    setError(null);
    try {
      const file = await cropImageToFile(imageSrc, croppedAreaPixels, {
        fileName: `${kind}-${Date.now()}.jpg`,
        mimeType: "image/jpeg",
        quality: 0.9,
        maxEdge: copy.maxEdge,
      });
      onCropped(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Crop failed");
      setBusy(false);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[240] flex items-end justify-center p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Cancel crop"
        className="absolute inset-0 bg-black/75 backdrop-blur-[4px]"
        onClick={() => {
          if (!busy) onCancel();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-[1] flex w-full max-w-lg flex-col overflow-hidden rounded-[24px] border border-white/[0.12] bg-[#111214] shadow-[0_40px_100px_rgba(0,0,0,0.7)]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] px-5 py-4">
          <div className="min-w-0">
            <h2
              id={titleId}
              className="text-base font-semibold tracking-[-0.02em] text-snow"
            >
              {copy.title}
            </h2>
            <p className="mt-0.5 text-sm text-[#949ba4]">{copy.hint}</p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="shrink-0 rounded-full px-3 py-1.5 text-sm text-[#949ba4] transition hover:bg-white/[0.06] hover:text-snow disabled:opacity-60"
          >
            Cancel
          </button>
        </div>

        <div className="relative mx-5 mt-4 h-[min(58vw,18rem)] overflow-hidden rounded-2xl bg-black sm:mx-6 sm:h-72">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={copy.aspect}
            cropShape={copy.round ? "round" : "rect"}
            showGrid={!copy.round}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            objectFit="contain"
            classes={{
              containerClassName: "bg-black",
              mediaClassName: "max-h-full",
            }}
          />
        </div>

        <div className="px-5 pt-4 sm:px-6">
          <label className="block">
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-[#949ba4]">
              Zoom
            </span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="mt-2 w-full accent-snow"
              aria-label="Zoom"
            />
          </label>
          {error ? (
            <p className="mt-2 text-sm text-[#ff8a8a]" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 sm:px-6">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="rounded-full px-4 py-2.5 text-sm text-[#949ba4] transition hover:text-snow disabled:opacity-60"
          >
            Back
          </button>
          <button
            type="button"
            disabled={busy || !croppedAreaPixels}
            onClick={() => void apply()}
            className="rounded-full bg-snow px-5 py-2.5 text-sm font-medium text-void transition hover:bg-white disabled:opacity-60"
          >
            {busy ? "Applying…" : "Use photo"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
