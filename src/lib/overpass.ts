export type Course = {
  id: string
  name: string
  lat: number
  lon: number
}

/** Haversine distance in meters */
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3
  const toRad = (d: number) => (d * Math.PI) / 180
  const φ1 = toRad(lat1), φ2 = toRad(lat2)
  const Δφ = toRad(lat2 - lat1)
  const Δλ = toRad(lon2 - lon1)
  const a = Math.sin(Δφ/2)**2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2)**2
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

type OverpassElement = {
  id: number
  type: "node" | "way" | "relation"
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

function pickName(tags?: Record<string,string>): string | undefined {
  if (!tags) return
  return tags["name"] || tags["name:en"] || tags["official_name"]
}

/** Internal: normalize Overpass elements to Course objects */
function elementsToCourses(els: OverpassElement[]): Course[] {
  return els
    .map(el => {
      const name = pickName(el.tags)
      const c = el.center || (typeof el.lat === "number" && typeof el.lon === "number" ? { lat: el.lat, lon: el.lon } : undefined)
      if (!name || !c) return undefined
      return { id: `${el.type}/${el.id}`, name, lat: c.lat, lon: c.lon } as Course
    })
    .filter((v): v is Course => Boolean(v))
}

/** Raw Overpass POST helper */
async function overpass(query: string): Promise<OverpassElement[]> {
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "data=" + encodeURIComponent(query.trim()),
  })
  if (!res.ok) throw new Error(`Overpass ${res.status}`)
  const json = await res.json() as { elements?: OverpassElement[] }
  return json.elements ?? []
}

/** Find nearest golf course within ~30km */
export async function findNearestCourse(lat: number, lon: number): Promise<Course | undefined> {
  const q = `
    [out:json][timeout:15];
    (
      node["leisure"="golf_course"](around:30000,${lat},${lon});
      way["leisure"="golf_course"](around:30000,${lat},${lon});
      relation["leisure"="golf_course"](around:30000,${lat},${lon});
    ); out center 100;
  `
  const els = await overpass(q)
  const courses = elementsToCourses(els)
  courses.sort((a, b) => haversine(lat, lon, a.lat, a.lon) - haversine(lat, lon, b.lat, b.lon))
  return courses[0]
}

/** Search by name (optionally prefer near lat/lon). Returns up to ~10 courses. */
export async function searchCoursesByName(name: string, lat?: number, lon?: number): Promise<Course[]> {
  const needle = name.replace(/"/g, '\\"')
  const area = (typeof lat === "number" && typeof lon === "number") ? `around:50000,${lat},${lon}` : ""
  const q = `
    [out:json][timeout:15];
    (
      node["leisure"="golf_course"]["name"~"${needle}",i](${area});
      way["leisure"="golf_course"]["name"~"${needle}",i](${area});
      relation["leisure"="golf_course"]["name"~"${needle}",i](${area});
    ); out center 100;
  `
  const els = await overpass(q)
  let courses = elementsToCourses(els)
  if (typeof lat === "number" && typeof lon === "number") {
    courses = courses
      .map(c => ({ c, d: haversine(lat, lon, c.lat, c.lon) }))
      .sort((a,b) => a.d - b.d)
      .map(x => x.c)
  }
  return courses.slice(0, 10)
}

/** Backwards-compat helper that returns only the name */
export async function nearestCourse(lat: number, lon: number): Promise<string | undefined> {
  const c = await findNearestCourse(lat, lon)
  return c?.name
}
