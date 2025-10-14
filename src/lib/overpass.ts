import { haversine } from "../utils/geo"

export type Course = { name: string; lat: number; lon: number }

const ENDPOINT = "https://overpass-api.de/api/interpreter"

export async function findNearestCourse(lat:number, lon:number): Promise<Course | null> {
  const radius = 30000
  const q = `
    [out:json][timeout:25];
    (
      nwr["leisure"="golf_course"](around:${radius},${lat},${lon});
    );
    out center tags;`
  const res = await fetch(ENDPOINT, { method:"POST", body:q })
  if (!res.ok) throw new Error("Overpass error")
  const j = await res.json() as { elements: any[] }
  if (!j.elements?.length) return null
  const withCenter = j.elements.map(e => {
    const c = e.center ?? { lat: e.lat, lon: e.lon }
    return { name: e.tags?.name ?? "Unnamed course", lat: c.lat, lon: c.lon }
  })
  withCenter.sort((a,b)=> haversine(lat,lon,a.lat,a.lon) - haversine(lat,lon,b.lat,b.lon))
  return withCenter[0]
}

export async function searchCoursesByName(name:string, lat?:number, lon?:number): Promise<Course[]>{
  const around = (lat!=null && lon!=null) ? `(around:50000,${lat},${lon})` : ""
  const q = `
    [out:json][timeout:25];
    (
      nwr["leisure"="golf_course"]["name"~"${name}",i]${around};
    );
    out center tags;`
  const res = await fetch(ENDPOINT, { method:"POST", body:q })
  if (!res.ok) throw new Error("Overpass search error")
  const j = await res.json() as { elements:any[] }
  return (j.elements ?? []).slice(0,10).map(e=>{
    const c = e.center ?? { lat:e.lat, lon:e.lon }
    return { name: e.tags?.name ?? "Unnamed course", lat:c.lat, lon:c.lon }
  })
}
