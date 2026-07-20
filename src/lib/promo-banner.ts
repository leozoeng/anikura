type AniZipImage = {
  coverType?: string;
  url?: string;
};

type AniZipResponse = {
  images?: AniZipImage[];
};

function byCoverType(images: AniZipImage[] | undefined, type: string) {
  return (
    images?.find(
      (img) =>
        img.coverType?.toLowerCase() === type.toLowerCase() && img.url?.trim(),
    )?.url?.trim() || null
  );
}

async function fetchAniZipImages(
  aniListId: number,
): Promise<AniZipImage[]> {
  try {
    const res = await fetch(
      `https://api.ani.zip/mappings?anilist_id=${aniListId}`,
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 60 * 60 * 12 },
      },
    );
    if (!res.ok) return [];
    const data = (await res.json()) as AniZipResponse;
    return data.images || [];
  } catch {
    return [];
  }
}

export type PromoBannerFallbacks = {
  aniListBanner?: string | null;
  catalogBackground?: string | null;
  cover?: string | null;
  poster?: string | null;
};

/**
 * HD promotional still for hero — prefer true widescreen fanart over
 * AniList's shorter banners (those look soft when stretched full-bleed).
 * Never YouTube.
 */
export async function resolvePromoBanner(
  aniListId: number | null | undefined,
  fallbacks: PromoBannerFallbacks = {},
): Promise<string> {
  const id = aniListId ? Number(aniListId) : 0;
  const images = id > 0 ? await fetchAniZipImages(id) : [];

  // Fanart is usually 1920×1080+ — best for full-viewport heroes
  const fanart = byCoverType(images, "Fanart");
  if (fanart) return fanart;

  if (fallbacks.aniListBanner?.trim()) {
    return fallbacks.aniListBanner.trim();
  }

  const tvdbBanner = byCoverType(images, "Banner");
  if (tvdbBanner) return tvdbBanner;

  return (
    fallbacks.catalogBackground?.trim() ||
    fallbacks.cover?.trim() ||
    fallbacks.poster?.trim() ||
    ""
  );
}

export async function resolvePromoBanners(
  entries: {
    aniListId: number;
    fallbacks: PromoBannerFallbacks;
  }[],
): Promise<Map<number, string>> {
  const results = await Promise.all(
    entries.map(async ({ aniListId, fallbacks }) => {
      const url = await resolvePromoBanner(aniListId, fallbacks);
      return [aniListId, url] as const;
    }),
  );
  return new Map(results);
}
