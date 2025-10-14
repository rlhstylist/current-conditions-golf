/**
 * Overpass client to find the nearest golf course to given coords (~30 km radius).
 * - Handles node/way/relation (uses center when needed)
 * - Returns a best-effort name ("Unnamed Golf Course" fallback)
 * - Gracefully returns null on errors/empty results
 */
export type CourseHit = { name: string; lat: number; lon: number; distanceKm: number }

const OVERPASS = "https://overpass-api.de/api/interpreter"

// Haversine distance (km)
function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat/2)**2 +
    Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
    Math.sin(dLon/2)**2
  return 2 * R * Math.asin(Math.sqrt(a))
}

/**
 * Finds the nearest leisure=golf_course within ~30km radius.
 * Returns null if none found or the request fails.
 */
export async function findNearestCourse(lat: number, lon: number): Promise<CourseHit | null> {
  const radius = 30000 // meters
  const query = `
    [out:json][timeout:15];
    (
      node["leisure"="golf_course"](around:${radius},${lat},${lon});
      way["leisure"="golf_course"](around:${radius},${lat},${lon});
      relation["leisure"="golf_course"](around:${radius},${lat},${lon});
    );
    out center tags 50;
  `.trim()

  try {
    const res = await fetch(OVERPASS, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
      body: new URLSearchParams({ data: query }).toString(),
    })
    if (!res.ok) return null

    const data = await res.json() as { elements?: any[] }
    const elements = data.elements ?? []
    if (!elements.length) return null

    let best: CourseHit | null = null
    for (const el of elements) {
      const tags = el.tags ?? {}
      const name = (tags.name as string) || "Unnamed Golf Course"
      const clat = el.center?.lat ?? el.lat
      const clon = el.center?.lon ?? el.lon
      if (typeof clat !== "number" || typeof clon !== "number") continue
      const d = haversine(lat, lon, clat, clon)
      const hit: CourseHit = { name, lat: clat, lon: clon, distanceKm: d }
      if (!best || d < best.distanceKm) best = hit
    }
    return best
  } catch {
    return null
  }
}
