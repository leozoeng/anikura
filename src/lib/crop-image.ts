/** Pixel crop area from react-easy-crop `onCropComplete`. */
export type PixelCrop = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", () =>
      reject(new Error("Could not load image for cropping")),
    );
    // Object URLs / data URLs don't need CORS; remote URLs might.
    if (!src.startsWith("blob:") && !src.startsWith("data:")) {
      img.crossOrigin = "anonymous";
    }
    img.src = src;
  });
}

/**
 * Draw the cropped region to a canvas and return a JPEG File.
 * Caps long edge so avatar/banner uploads stay reasonably small.
 */
export async function cropImageToFile(
  imageSrc: string,
  crop: PixelCrop,
  {
    fileName,
    mimeType = "image/jpeg",
    quality = 0.9,
    maxEdge = 1600,
  }: {
    fileName: string;
    mimeType?: string;
    quality?: number;
    maxEdge?: number;
  },
): Promise<File> {
  const image = await loadImage(imageSrc);

  let outW = Math.max(1, Math.round(crop.width));
  let outH = Math.max(1, Math.round(crop.height));
  const long = Math.max(outW, outH);
  if (long > maxEdge) {
    const ratio = maxEdge / long;
    outW = Math.max(1, Math.round(outW * ratio));
    outH = Math.max(1, Math.round(outH * ratio));
  }

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not available");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outW,
    outH,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not encode crop"))),
      mimeType,
      quality,
    );
  });

  return new File([blob], fileName, { type: mimeType });
}
