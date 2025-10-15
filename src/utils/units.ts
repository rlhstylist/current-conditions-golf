export type Units = "imperial" | "metric"

export function formatSpeed(v: number, u: Units) {
  return u === "imperial"
    ? `${(v * 2.23694).toFixed(0)} mph`
    : `${(v * 3.6).toFixed(0)} km/h`
}

export function formatTemp(v: number, u: Units) {
  return u === "imperial" ? `${(v * 9/5 + 32).toFixed(0)} °F` : `${v.toFixed(0)} °C`
}

export function formatDir(deg: number) {
  const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW","N"]
  return dirs[Math.round(deg/22.5)]
}

export function formatPrecip(mm: number, u: Units) {
  return u === "imperial" ? `${(mm / 25.4).toFixed(2)} in` : `${mm.toFixed(1)} mm`
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`
}
