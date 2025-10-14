import { fetchWeather, type Weather } from "../lib/openmeteo"

const CACHE_KEY = "ccg_weather_cache_v1"

export type WeatherState = { when:number; lat:number; lon:number; data: Weather }

export async function getWeather(lat:number, lon:number): Promise<Weather>{
  const raw = localStorage.getItem(CACHE_KEY)
  if (raw){
    const c: WeatherState = JSON.parse(raw)
    if (Date.now() - c.when < 5*60_000 && Math.hypot(c.lat-lat, c.lon-lon) < 0.01){
      return c.data
    }
  }
  const d = await fetchWeather(lat,lon)
  const state: WeatherState = { when: Date.now(), lat, lon, data: d }
  localStorage.setItem(CACHE_KEY, JSON.stringify(state))
  return d
}
