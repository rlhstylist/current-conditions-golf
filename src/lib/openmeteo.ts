export type Forecast = {
  hours: Date[]
  windDir: number[]
  windSpeed: number[]
  windGust: number[]
  temp: number[]
  feels: number[]
  humidity: number[]
  uv: number[]
  cloud: number[]
  precipProb: number[]
}

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
  forecast: Forecast
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

function toNumberArray(values: unknown[]): number[] {
  return values.map((value) => Number(value) || 0)
}

function toDateArray(values: unknown[]): Date[] {
  return values.map((value) => {
    const source = value instanceof Date ? value.toISOString() : String(value ?? "")
    const date = new Date(source)
    if (!Number.isNaN(date.getTime())) return date
    return new Date(0)
  })
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
      "uv_index",
      "cloud_cover",
      "wind_speed_10m",
      "wind_gusts_10m",
      "wind_direction_10m",
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
  const hourlyData = j.hourly ?? {}
  const hourly = toNumberArray(hourlyData.precipitation ?? [])
  const probabilityPercent: number[] = toNumberArray(hourlyData.precipitation_probability ?? []).map(
    (value) => clampProbability(value)
  )
  const forecast: Forecast = {
    hours: toDateArray(hourlyData.time ?? []),
    windDir: toNumberArray(hourlyData.wind_direction_10m ?? []),
    windSpeed: toNumberArray(hourlyData.wind_speed_10m ?? []),
    windGust: toNumberArray(hourlyData.wind_gusts_10m ?? []),
    temp: toNumberArray(hourlyData.temperature_2m ?? []),
    feels: toNumberArray(hourlyData.apparent_temperature ?? []),
    humidity: toNumberArray(hourlyData.relative_humidity_2m ?? []).map((value) => value / 100),
    uv: toNumberArray(hourlyData.uv_index ?? []),
    cloud: toNumberArray(hourlyData.cloud_cover ?? []).map((value) => value / 100),
    precipProb: probabilityPercent.map((value) => value / 100),
  }

  // Next windows starting "now" (best-effort; open-meteo returns future hours)
  const precip24h = sum(hourly, 24)
  const precipChance1h = maxWindow(probabilityPercent, 1)
  const precipChance3h = maxWindow(probabilityPercent, 3)

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
    forecast,
  }
}
