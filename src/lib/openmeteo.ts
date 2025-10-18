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
    precip24h: number
    precipChance1h: number
    precipChance3h: number
  }
  precipChanceNext5h: number[]
}

function clampProbability(value: number) {
  if (!Number.isFinite(value)) return 0
  if (value < 0) return 0
  if (value > 100) return 100
  return value
}

function sumWindow(arr: number[], start: number, length: number) {
  if (length <= 0) return 0
  let acc = 0
  for (let i = start; i < arr.length && i < start + length; i += 1) {
    acc += arr[i] ?? 0
  }
  return acc
}

function maxWindow(arr: number[], start: number, length: number) {
  if (length <= 0) return 0
  let max = Number.NEGATIVE_INFINITY
  let found = false
  for (let i = start; i < arr.length && i < start + length; i += 1) {
    const value = arr[i]
    if (value == null) continue
    const numeric = Number(value)
    if (!Number.isFinite(numeric)) continue
    if (!found || numeric > max) {
      max = numeric
      found = true
    }
  }
  return found ? max : 0
}

function clampSeries(values: number[], start: number, length: number) {
  const result: number[] = []
  for (let i = start; i < start + length; i += 1) {
    const numeric = Number(values[i])
    result.push(clampProbability(Number.isFinite(numeric) ? numeric : 0))
  }
  while (result.length < length) {
    result.push(result[result.length - 1] ?? 0)
  }
  return result
}

function resolveIndex(times: unknown, currentTime: unknown) {
  const entries = Array.isArray(times) ? times.map((value) => String(value)) : []
  if (!entries.length) return { current: 0, next: 0 }
  const currentIso = typeof currentTime === "string" ? currentTime : null
  if (currentIso) {
    const index = entries.indexOf(currentIso)
    if (index >= 0) {
      return { current: index, next: Math.min(index + 1, entries.length - 1) }
    }
  }
  const now = Date.now()
  const after = entries.findIndex((value) => {
    const time = Date.parse(value)
    return Number.isFinite(time) && time >= now
  })
  const current = after >= 0 ? after : 0
  const next = Math.min(current + 1, entries.length - 1)
  return { current, next }
}

export async function fetchWeather(lat: number, lon: number): Promise<Weather> {
  const url = new URL("https://api.open-meteo.com/v1/forecast")
  url.searchParams.set("latitude", String(lat))
  url.searchParams.set("longitude", String(lon))
  const currentParams = [
    "temperature_2m",
    "apparent_temperature",
    "relative_humidity_2m",
    "wind_speed_10m",
    "wind_gusts_10m",
    "wind_direction_10m",
    "uv_index",
    "cloud_cover",
  ]
  url.searchParams.set("current", currentParams.join(","))
  const hourlyParams = [
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
  ]
  url.searchParams.set("hourly", hourlyParams.join(","))
  url.searchParams.set("precipitation_unit", "mm")
  url.searchParams.set("wind_speed_unit", "ms")
  url.searchParams.set("timezone", "auto")

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`open-meteo ${res.status}`)
  const j = await res.json()

  const cur = j.current
  const hourly = j.hourly ?? {}
  const precipHourly: number[] = (hourly.precipitation ?? []).map((value: unknown) => Number(value) || 0)
  const probability: number[] = (hourly.precipitation_probability ?? []).map((value: unknown) =>
    clampProbability(Number(value))
  )
  const temperature: number[] = (hourly.temperature_2m ?? []).map((value: unknown) => Number(value) || 0)
  const feels: number[] = (hourly.apparent_temperature ?? []).map((value: unknown) => Number(value) || 0)
  const humidity: number[] = (hourly.relative_humidity_2m ?? []).map((value: unknown) => Number(value) || 0)
  const windSpeed: number[] = (hourly.wind_speed_10m ?? []).map((value: unknown) => Number(value) || 0)
  const windGust: number[] = (hourly.wind_gusts_10m ?? []).map((value: unknown) => Number(value) || 0)
  const windDir: number[] = (hourly.wind_direction_10m ?? []).map((value: unknown) => Number(value) || 0)
  const uv: number[] = (hourly.uv_index ?? []).map((value: unknown) => Number(value) || 0)
  const cloud: number[] = (hourly.cloud_cover ?? []).map((value: unknown) => Number(value) || 0)

  const { current: currentIndex, next: nextIndex } = resolveIndex(hourly.time, cur?.time)

  const precip24h = sumWindow(precipHourly, currentIndex, 24)
  const precipChance1h = maxWindow(probability, currentIndex, 1)
  const precipChance3h = maxWindow(probability, currentIndex, 3)

  const nextHour = {
    windSpeed: windSpeed[nextIndex] ?? 0,
    windGust: windGust[nextIndex] ?? 0,
    windDir: windDir[nextIndex] ?? 0,
    temp: temperature[nextIndex] ?? 0,
    feels: feels[nextIndex] ?? 0,
    humidity: humidity[nextIndex] ?? 0,
    uv: uv[nextIndex] ?? 0,
    cloud: cloud[nextIndex] ?? 0,
    precip24h: sumWindow(precipHourly, nextIndex, 24),
    precipChance1h: maxWindow(probability, nextIndex, 1),
    precipChance3h: maxWindow(probability, nextIndex, 3),
  }

  const precipChanceNext5h = clampSeries(probability, nextIndex, 5)

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
