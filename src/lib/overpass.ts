export async function nearestCourse(lat: number, lon: number): Promise<string | undefined> {
  const q = `
    [out:json][timeout:15];
    (
      node["leisure"="golf_course"](around:30000,${lat},${lon});
      way["leisure"="golf_course"](around:30000,${lat},${lon});
      relation["leisure"="golf_course"](around:30000,${lat},${lon});
    );
    out center 1;
  `
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "data=" + encodeURIComponent(q.trim()),
  })
  if (!res.ok) return
  const j = await res.json().catch(() => undefined) as any
  const el = (j?.elements ?? [])[0]
  const name = el?.tags?.name || el?.tags?.["name:en"]
  return typeof name === "string" && name.trim() ? name.trim() : undefined
}
