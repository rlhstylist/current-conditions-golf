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
    precipChance1h: number
    precipChance3h: number
    precip24h: number
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

function asNumberArray(input: unknown[]): number[] {
  return input.map((x: unknown) => Number(x) || 0)
}

function takeSlice(values: number[], length: number): number[] {
  const slice = values.slice(0, length)
  if (slice.length >= length) return slice
  const last = slice.at(-1) ?? 0
  return slice.concat(Array.from({ length: length - slice.length }, () => last))
}

function pick(arr: number[], index: number, fallback: number): number {
  const value = arr[index]
  return Number.isFinite(value) ? value : fallback
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
      "precipitation",
      "precipitation_probability",
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "wind_speed_10m",
      "wind_gusts_10m",
      "wind_direction_10m",
      "uv_index",
      "cloud_cover",
    ].join(",")
  )
  url.searchParams.set("precipitation_unit", "mm")
  url.searchParams.set("wind_speed_unit", "ms")
  url.searchParams.set("timezone", "auto")

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`open-meteo ${res.status}`)
  const j = await res.json()

  const cur = j.current
  const hourlyPrecip = asNumberArray(j.hourly?.precipitation ?? [])
  const probability: number[] = asNumberArray(j.hourly?.precipitation_probability ?? []).map(
    (value) => clampProbability(value)
  )
  const hourlyTemp = asNumberArray(j.hourly?.temperature_2m ?? [])
  const hourlyFeels = asNumberArray(j.hourly?.apparent_temperature ?? [])
  const hourlyHumidity = asNumberArray(j.hourly?.relative_humidity_2m ?? [])
  const hourlyWindSpeed = asNumberArray(j.hourly?.wind_speed_10m ?? [])
  const hourlyWindGust = asNumberArray(j.hourly?.wind_gusts_10m ?? [])
  const hourlyWindDir = asNumberArray(j.hourly?.wind_direction_10m ?? [])
  const hourlyUv = asNumberArray(j.hourly?.uv_index ?? [])
  const hourlyCloud = asNumberArray(j.hourly?.cloud_cover ?? [])

  // Next windows starting "now" (best-effort; open-meteo returns future hours)
  const precip24h = sum(hourlyPrecip, 24)
  const precipChance1h = maxWindow(probability, 1)
  const precipChance3h = maxWindow(probability, 3)

  const nextIndex = 1
  const nextHour = {
    windSpeed: pick(hourlyWindSpeed, nextIndex, Number(cur?.wind_speed_10m ?? 0)),
    windGust: pick(hourlyWindGust, nextIndex, Number(cur?.wind_gusts_10m ?? 0)),
    windDir: pick(hourlyWindDir, nextIndex, Number(cur?.wind_direction_10m ?? 0)),
    temp: pick(hourlyTemp, nextIndex, Number(cur?.temperature_2m ?? 0)),
    feels: pick(hourlyFeels, nextIndex, Number(cur?.apparent_temperature ?? 0)),
    humidity: pick(hourlyHumidity, nextIndex, Number(cur?.relative_humidity_2m ?? 0)),
    uv: pick(hourlyUv, nextIndex, Number(cur?.uv_index ?? 0)),
    cloud: pick(hourlyCloud, nextIndex, Number(cur?.cloud_cover ?? 0)),
    precipChance1h: clampProbability(probability[nextIndex] ?? precipChance1h ?? 0),
    precipChance3h: maxWindow(probability.slice(nextIndex), 3),
    precip24h: sum(hourlyPrecip.slice(nextIndex), 24),
  }

  const precipChanceNext5h = takeSlice(probability.map((value) => clampProbability(value)), 5)

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
