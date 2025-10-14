export type Units = "imperial" | "metric"

export const toC = (f: number) => (f - 32) * 5/9
export const toF = (c: number) => (c * 9/5) + 32
export const mpsToMph = (m: number) => m * 2.23693629
export const mphToMps = (m: number) => m / 2.23693629

export function formatTemp(v: number | null | undefined, u: Units){
  if (v==null) return "—"
  const val = u==="imperial" ? toF(v) : v
  return `${Math.round(val)}°${u==="imperial"?"F":"C"}`
}

export function formatSpeed(v: number | null | undefined, u: Units){
  if (v==null) return "—"
  const val = u==="imperial" ? mpsToMph(v) : v
  return `${Math.round(val)} ${u==="imperial"?"mph":"m·s⁻¹"}`
}

export function formatDir(d: number | null | undefined){
  if (d==null) return "—"
  const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"]
  return `${dirs[Math.round(d/22.5)%16]} ${Math.round(d)}°`
}

export const mmToIn = (mm:number)=> mm/25.4
export function formatPrecip(mm: number | null | undefined, u: Units){
  if (mm==null) return "—"
  const v = u==="imperial" ? mmToIn(mm) : mm
  const r = v<1 ? Math.round(v*10)/10 : Math.round(v)
  return `${r}${u==="imperial"?"in":"mm"}`
}
