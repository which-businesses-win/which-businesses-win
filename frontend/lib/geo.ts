export type GeoCoords = { lat: number; lon: number };

/** OpenStreetMap Nominatim — identify your app: https://operations.osmfoundation.org/policies/nominatim/ */
const NOMINATIM_USER_AGENT =
  "which-businesses-win/1.0 (planning-intelligence; +https://github.com/)";

const MIN_INTERVAL_MS = 1100;

const cache = new Map<string, GeoCoords | null>();
let lastNominatimMs = 0;

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

async function nominatimRateLimit() {
  const now = Date.now();
  const wait = MIN_INTERVAL_MS - (now - lastNominatimMs);
  if (wait > 0) await sleep(wait);
  lastNominatimMs = Date.now();
}

/** Prefer UK results; disambiguate short place names. */
export function normalizeUkGeocodeQuery(place: string): string {
  const p = place.trim();
  if (!p) return p;
  if (/\b(uk|united kingdom|england|scotland|wales|northern ireland)\b/i.test(p)) {
    return p;
  }
  return `${p}, United Kingdom`;
}

export function distanceKm(a: GeoCoords, b: GeoCoords): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/**
 * Geocode a free-text place via Nominatim (cached, rate-limited).
 * Returns null when nothing matches or on error.
 */
export async function geocode(place: string): Promise<GeoCoords | null> {
  const query = normalizeUkGeocodeQuery(place);
  const key = query.toLowerCase();
  if (!key) return null;
  if (cache.has(key)) return cache.get(key)!;

  await nominatimRateLimit();

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=gb`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": NOMINATIM_USER_AGENT,
      },
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("Geocode HTTP", res.status);
      cache.set(key, null);
      return null;
    }
    const data = (await res.json()) as { lat?: string; lon?: string }[];
    if (!data?.length) {
      cache.set(key, null);
      return null;
    }
    const lat = parseFloat(data[0].lat ?? "");
    const lon = parseFloat(data[0].lon ?? "");
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      cache.set(key, null);
      return null;
    }
    const coords: GeoCoords = { lat, lon };
    cache.set(key, coords);
    return coords;
  } catch (e) {
    console.error("Geocode error", e);
    cache.set(key, null);
    return null;
  }
}

/** Default radius for “nearby” site analysis (km). */
export const SITE_RADIUS_KM = 2;
