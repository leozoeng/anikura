type AniZipImage = {
  coverType?: string;
  url?: string;
};

type AniZipResponse = {
  images?: AniZipImage[];
};

function pickAniZipPromo(images?: AniZipImage[]): string | null {
  if (!images?.length) return null;
  const byType = (type: string) =>
    images.find(
      (img) =>
        img.coverType?.toLowerCase() === type.toLowerCase() && img.url?.trim(),
    )?.url?.trim() || null;

  // Fanart = widescreen promo backgrounds; Banner = wide series banner
  return byType("Fanart") || byType("Banner") || null;
}

async function fetchAniZipPromo(aniListId: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.ani.zip/mappings?anilist_id=${aniListId}`,
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 60 * 60 * 12 },
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as AniZipResponse;
    return pickAniZipPromo(data.images);
  } catch {
    return null;
  }
}

export type PromoBannerFallbacks = {
  aniListBanner?: string | null;
  catalogBackground?: string | null;
  cover?: string | null;
  poster?: string | null;
};

/**
 * HD promotional still for hero — AniList / TVDB (via ani.zip), never YouTube.
 */
export async function resolvePromoBanner(
  aniListId: number | null | undefined,
  fallbacks: PromoBannerFallbacks = {},
): Promise<string> {
  const id = aniListId ? Number(aniListId) : 0;

  if (fallbacks.aniListBanner?.trim()) {
    return fallbacks.aniListBanner.trim();
  }

  if (id > 0) {
    const fromZip = await fetchAniZipPromo(id);
    if (fromZip) return fromZip;
  }

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
