export type Weather = {
  windSpeed: number
  windGust: number
  windDir: number
  temp: number
  feels: number
  humidity: number
  uv: number
  cloud: number
  precip24h: number
  precipChance1h: number
  precipChance3h: number
  nextWindSpeed: number
  nextWindGust: number
  nextWindDir: number
  nextTemp: number
  nextFeels: number
  nextHumidity: number
  nextUv: number
  nextCloud: number
  precipChanceNext5h: number[]
}

function sum(arr: number[], n: number) {
  return arr.slice(0, n).reduce((a, b) => a + (b ?? 0), 0)
}

function clampProbability(value: number) {
  if (!Number.isFinite(value)) return 0
  if (value < 0) return 0
  if (value > 100) return 100
  return value
}

function maxWindow(arr: number[], n: number) {
  if (n <= 0) return 0
  const window = arr.slice(0, n)
  if (window.length === 0) return 0
  return window.reduce((acc, value) => (value > acc ? value : acc), window[0])
}

export async function fetchWeather(lat: number, lon: number): Promise<Weather> {
  const url = new URL("https://api.open-meteo.com/v1/forecast")
  url.searchParams.set("latitude", String(lat))
  url.searchParams.set("longitude", String(lon))
  url.searchParams.set("current", [
    "temperature_2m",
    "apparent_temperature",
    "relative_humidity_2m",
    "wind_speed_10m",
    "wind_gusts_10m",
    "wind_direction_10m",
    "uv_index",
    "cloud_cover",
  ].join(","))
  url.searchParams.set(
    "hourly",
    [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "wind_speed_10m",
      "wind_gusts_10m",
      "wind_direction_10m",
      "uv_index",
      "cloud_cover",
      "precipitation",
      "precipitation_probability",
    ].join(",")
  )
  url.searchParams.set("precipitation_unit", "mm")
  url.searchParams.set("wind_speed_unit", "ms")
  url.searchParams.set("timezone", "auto")

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`open-meteo ${res.status}`)
  const j = await res.json()

  const cur = j.current
  const hourlyPrecip: number[] = (j.hourly?.precipitation ?? []).map((x: unknown) => Number(x) || 0)
  const probability: number[] = (j.hourly?.precipitation_probability ?? []).map((x: unknown) =>
    clampProbability(Number(x))
  )
  const hourlyTemp: number[] = (j.hourly?.temperature_2m ?? []).map((x: unknown) => Number(x) || 0)
  const hourlyFeels: number[] = (j.hourly?.apparent_temperature ?? []).map((x: unknown) => Number(x) || 0)
  const hourlyHumidity: number[] = (j.hourly?.relative_humidity_2m ?? []).map((x: unknown) =>
    Number(x) || 0
  )
  const hourlyWindSpeed: number[] = (j.hourly?.wind_speed_10m ?? []).map((x: unknown) => Number(x) || 0)
  const hourlyWindGust: number[] = (j.hourly?.wind_gusts_10m ?? []).map((x: unknown) => Number(x) || 0)
  const hourlyWindDir: number[] = (j.hourly?.wind_direction_10m ?? []).map((x: unknown) => Number(x) || 0)
  const hourlyUv: number[] = (j.hourly?.uv_index ?? []).map((x: unknown) => Number(x) || 0)
  const hourlyCloud: number[] = (j.hourly?.cloud_cover ?? []).map((x: unknown) => Number(x) || 0)
  const hourlyTimes: string[] = Array.isArray(j.hourly?.time)
    ? j.hourly.time.map((x: unknown) => String(x))
    : []
  const currentTime = typeof cur?.time === "string" ? cur.time : null
  let nextIndex = 0
  if (currentTime) {
    const idx = hourlyTimes.indexOf(currentTime)
    if (idx >= 0) {
      nextIndex = idx + 1
    }
  }
  if (nextIndex >= hourlyTimes.length && hourlyTimes.length > 0) {
    nextIndex = hourlyTimes.length - 1
  }

  const pickHour = (arr: number[]) => {
    if (!arr.length) return 0
    const clamped = Math.min(Math.max(nextIndex, 0), arr.length - 1)
    return arr[clamped] ?? 0
  }

  const precipNext5h = probability.slice(nextIndex, nextIndex + 5)
  if (precipNext5h.length < 5) {
    const pad = precipNext5h.length ? precipNext5h[precipNext5h.length - 1] : 0
    while (precipNext5h.length < 5) precipNext5h.push(pad)
  }

  // Next windows starting "now" (best-effort; open-meteo returns future hours)
  const precip24h = sum(hourlyPrecip, 24)
  const precipChance1h = maxWindow(probability, 1)
  const precipChance3h = maxWindow(probability, 3)

  return {
    windSpeed: Number(cur?.wind_speed_10m ?? 0),
    windGust:  Number(cur?.wind_gusts_10m ?? 0),
    windDir:   Number(cur?.wind_direction_10m ?? 0),
    temp:      Number(cur?.temperature_2m ?? 0),
    feels:     Number(cur?.apparent_temperature ?? 0),
    humidity:  Number(cur?.relative_humidity_2m ?? 0),
    uv:        Number(cur?.uv_index ?? 0),
    cloud:     Number(cur?.cloud_cover ?? 0),
    precip24h,
    precipChance1h,
    precipChance3h,
    nextWindSpeed: pickHour(hourlyWindSpeed),
    nextWindGust:  pickHour(hourlyWindGust),
    nextWindDir:   pickHour(hourlyWindDir),
    nextTemp:      pickHour(hourlyTemp),
    nextFeels:     pickHour(hourlyFeels),
    nextHumidity:  pickHour(hourlyHumidity),
    nextUv:        pickHour(hourlyUv),
    nextCloud:     pickHour(hourlyCloud),
    precipChanceNext5h: precipNext5h,
  }
}
