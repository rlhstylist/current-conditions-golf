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
  nextHour: {
    windSpeed: number
    windGust: number
    windDir: number
    temp: number
    feels: number
    humidity: number
    uv: number
    cloud: number
    precipChance: number
  }
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
    ].join(","),
  )
  url.searchParams.set("precipitation_unit", "mm")
  url.searchParams.set("wind_speed_unit", "ms")
  url.searchParams.set("timezone", "auto")

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`open-meteo ${res.status}`)
  const j = await res.json()

  const cur = j.current
  const toNumbers = (arr: unknown[]): number[] => arr.map((x: unknown) => Number(x) || 0)
  const hourlyTimes: number[] = Array.isArray(j.hourly?.time)
    ? j.hourly.time.map((value: unknown) => Date.parse(String(value)))
    : []
  const hourlyTemp = toNumbers(j.hourly?.temperature_2m ?? [])
  const hourlyFeels = toNumbers(j.hourly?.apparent_temperature ?? [])
  const hourlyHumidity = toNumbers(j.hourly?.relative_humidity_2m ?? [])
  const hourlyWindSpeed = toNumbers(j.hourly?.wind_speed_10m ?? [])
  const hourlyWindGust = toNumbers(j.hourly?.wind_gusts_10m ?? [])
  const hourlyWindDir = toNumbers(j.hourly?.wind_direction_10m ?? [])
  const hourlyUv = toNumbers(j.hourly?.uv_index ?? [])
  const hourlyCloud = toNumbers(j.hourly?.cloud_cover ?? [])
  const hourly: number[] = toNumbers(j.hourly?.precipitation ?? [])
  const probability: number[] = (j.hourly?.precipitation_probability ?? []).map((x: unknown) =>
    clampProbability(Number(x))
  )

  const currentTime = Date.parse(String(j.current?.time ?? new Date().toISOString()))
  let nextIndex = hourlyTimes.findIndex((timestamp) => Number.isFinite(timestamp) && timestamp > currentTime)
  if (nextIndex < 0) nextIndex = 0

  const pick = (arr: number[], index: number) => (index < arr.length ? arr[index] ?? 0 : 0)
  const nextHour = {
    windSpeed: pick(hourlyWindSpeed, nextIndex),
    windGust: pick(hourlyWindGust, nextIndex),
    windDir: pick(hourlyWindDir, nextIndex),
    temp: pick(hourlyTemp, nextIndex),
    feels: pick(hourlyFeels, nextIndex),
    humidity: pick(hourlyHumidity, nextIndex),
    uv: pick(hourlyUv, nextIndex),
    cloud: pick(hourlyCloud, nextIndex),
    precipChance: pick(probability, nextIndex),
  }
  const precipChanceNext5h = probability.slice(nextIndex, nextIndex + 5)

  // Next windows starting "now" (best-effort; open-meteo returns future hours)
  const precip24h = sum(hourly, 24)
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
    nextHour,
    precipChanceNext5h,
  }
}
