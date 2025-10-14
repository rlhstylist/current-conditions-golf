export type Weather = {
  windSpeed: number|null
  windGust: number|null
  windDir: number|null
  tempC: number|null
  feelsC: number|null
  humidity: number|null
  uv: number|null
  cloud: number|null
  precipNext1hMm: number|null
  precipNext3hMm: number|null
  precip24hMm: number|null
  nextHour: {
    tempC: number|null
    feelsC: number|null
    humidity: number|null
    uv: number|null
    cloud: number|null
  }
}

export async function fetchWeather(lat:number, lon:number): Promise<Weather>{
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    timezone: "auto",
    current: [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "wind_speed_10m",
      "wind_gusts_10m",
      "wind_direction_10m",
      "uv_index",
      "cloud_cover"
    ].join(","),
    hourly: [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "uv_index",
      "cloud_cover",
      "precipitation"
    ].join(",")
  })
  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`
  const res = await fetch(url)
  if (!res.ok) throw new Error("Open-Meteo error")
  const j = await res.json()

  const nowIso = j.current?.time ?? j.hourly?.time?.[0]
  const times: string[] = j.hourly?.time ?? []
  const idx = Math.max(0, times.indexOf(nowIso))
  const nextIdx = Math.min(idx+1, times.length-1)

  const sum = (arr:number[], start:number, count:number) => {
    let s = 0
    for (let i=0; i<count && (start+i)<arr.length; i++) s += Number(arr[start+i] ?? 0)
    return s
  }

  const hPrecip: number[] = j.hourly?.precipitation ?? []

  return {
    windSpeed: j.current?.wind_speed_10m ?? null,
    windGust: j.current?.wind_gusts_10m ?? null,
    windDir: j.current?.wind_direction_10m ?? null,
    tempC: j.current?.temperature_2m ?? null,
    feelsC: j.current?.apparent_temperature ?? null,
    humidity: j.current?.relative_humidity_2m ?? null,
    uv: j.current?.uv_index ?? null,
    cloud: j.current?.cloud_cover ?? null,
    precipNext1hMm: sum(hPrecip, idx+1, 1),
    precipNext3hMm: sum(hPrecip, idx+1, 3),
    precip24hMm: sum(hPrecip, idx+1, 24),
    nextHour: {
      tempC: j.hourly?.temperature_2m?.[nextIdx] ?? null,
      feelsC: j.hourly?.apparent_temperature?.[nextIdx] ?? null,
      humidity: j.hourly?.relative_humidity_2m?.[nextIdx] ?? null,
      uv: j.hourly?.uv_index?.[nextIdx] ?? null,
      cloud: j.hourly?.cloud_cover?.[nextIdx] ?? null,
    }
  }
}
