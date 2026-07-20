type GeoResult = {
  lat: number | null;
  lng: number | null;
  country: string | null;
  city: string | null;
};

function parseCoord(value: string | null): number | null {
  if (!value) return null;
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

/** Prefer edge platform headers; fall back to a lightweight IP geo lookup. */
export async function resolveRequestGeo(
  request: Request,
): Promise<GeoResult> {
  const h = request.headers;

  // Vercel
  const vercelLat = parseCoord(h.get("x-vercel-ip-latitude"));
  const vercelLng = parseCoord(h.get("x-vercel-ip-longitude"));
  const vercelCountry = h.get("x-vercel-ip-country");
  const vercelCity = h.get("x-vercel-ip-city");

  if (vercelLat != null && vercelLng != null) {
    return {
      lat: vercelLat,
      lng: vercelLng,
      country: vercelCountry,
      city: vercelCity ? decodeURIComponent(vercelCity) : null,
    };
  }

  // Cloudflare
  const cfLat = parseCoord(h.get("cf-iplatitude"));
  const cfLng = parseCoord(h.get("cf-iplongitude"));
  const cfCountry = h.get("cf-ipcountry");
  const cfCity = h.get("cf-ipcity");

  if (cfLat != null && cfLng != null) {
    return {
      lat: cfLat,
      lng: cfLng,
      country: cfCountry && cfCountry !== "XX" ? cfCountry : null,
      city: cfCity,
    };
  }

  // Generic / fallback IP lookup (coarse only)
  const forwarded = h.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    h.get("x-real-ip") ||
    h.get("cf-connecting-ip");

  if (!ip || ip === "127.0.0.1" || ip === "::1") {
    return { lat: null, lng: null, country: null, city: null };
  }

  try {
    const res = await fetch(
      `https://ipapi.co/${encodeURIComponent(ip)}/json/`,
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 86400 },
      },
    );
    if (!res.ok) {
      return { lat: null, lng: null, country: null, city: null };
    }
    const data = (await res.json()) as {
      latitude?: number;
      longitude?: number;
      country_code?: string;
      city?: string;
      error?: boolean;
    };
    if (data.error) {
      return { lat: null, lng: null, country: null, city: null };
    }
    return {
      lat: typeof data.latitude === "number" ? data.latitude : null,
      lng: typeof data.longitude === "number" ? data.longitude : null,
      country: data.country_code ?? null,
      city: data.city ?? null,
    };
  } catch {
    return { lat: null, lng: null, country: null, city: null };
  }
}
