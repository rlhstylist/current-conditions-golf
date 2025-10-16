export type ForecastSlice = {
  hours: string[]
  windSpeed: number[]
  windGust: number[]
  windDir: number[]
  temp: number[]
  feels: number[]
  humidity: number[]
  uv: number[]
  cloud: number[]
  precip: number[]
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
  forecast: ForecastSlice
}

function sum(arr: number[], n: number) {
  return arr.slice(0, n).reduce((a, b) => a + (b ?? 0), 0)
}

const FORECAST_HOURS = 6

function toNumbers(arr: unknown[]): number[] {
  return arr.map((x) => Number(x) || 0)
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
  url.searchParams.set("hourly", [
    "temperature_2m",
    "apparent_temperature",
    "relative_humidity_2m",
    "wind_speed_10m",
    "wind_gusts_10m",
    "wind_direction_10m",
    "uv_index",
    "cloud_cover",
    "precipitation_probability",
    "precipitation",
  ].join(","))
  url.searchParams.set("precipitation_unit", "mm")
  url.searchParams.set("wind_speed_unit", "ms")
  url.searchParams.set("timezone", "auto")

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`open-meteo ${res.status}`)
  const j = await res.json()

  const cur = j.current
  const times: string[] = Array.isArray(j.hourly?.time) ? j.hourly.time : []
  const hourlyPrecip: number[] = toNumbers(Array.isArray(j.hourly?.precipitation) ? j.hourly.precipitation : [])

  const now = Date.now()
  const startIndex = times.findIndex((iso) => {
    const ts = Date.parse(String(iso))
    return Number.isFinite(ts) && ts >= now - 30 * 60 * 1000
  })
  const normalizedIndex = startIndex === -1 ? 0 : startIndex

  const slice = (values: unknown[] | undefined) => {
    const arr = Array.isArray(values) ? values : []
    return toNumbers(arr.slice(normalizedIndex, normalizedIndex + FORECAST_HOURS))
  }

  const hours = times.slice(normalizedIndex, normalizedIndex + FORECAST_HOURS)

  // Next windows starting "now" (best-effort; open-meteo returns future hours)
  const precipWindow = hourlyPrecip.slice(normalizedIndex)
  const precip24h = sum(precipWindow, 24)

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
    forecast: {
      hours,
      windSpeed: slice(j.hourly?.wind_speed_10m),
      windGust: slice(j.hourly?.wind_gusts_10m),
      windDir: slice(j.hourly?.wind_direction_10m),
      temp: slice(j.hourly?.temperature_2m),
      feels: slice(j.hourly?.apparent_temperature),
      humidity: slice(j.hourly?.relative_humidity_2m),
      uv: slice(j.hourly?.uv_index),
      cloud: slice(j.hourly?.cloud_cover),
      precip: slice(j.hourly?.precipitation),
      precipProb: slice(j.hourly?.precipitation_probability),
    },
  }
}
