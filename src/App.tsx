import { useEffect, useState } from "react"
import "./index.css"
import { useGeo } from "./hooks/useGeo"
import { fetchWeather, type Weather } from "./lib/openmeteo"
import { formatSpeed, formatTemp, formatDir, formatPrecip, type Units } from "./utils/units"

export default function App() {
  const { geo, request } = useGeo()
  const [units, setUnits] = useState<Units>("imperial")
  const [wx, setWx] = useState<Weather | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<string>("—")

  async function refresh() {
    try {
      setErr(null); setLoading(true)
      const coords = geo.status === "granted" ? geo.coords : undefined
      if (!coords) { setLoading(false); return }
      const data = await fetchWeather(coords.lat, coords.lon)
      setWx(data)
      setUpdatedAt(new Date().toLocaleTimeString())
    } catch (e: unknown) {
      setErr((e as Error).message || "Failed")
    } finally { setLoading(false) }
  }

  useEffect(() => {
    if (geo.status === "granted") { void refresh() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo.status, geo.status === "granted" ? geo.coords?.lat : 0, geo.status === "granted" ? geo.coords?.lon : 0])

  const toggleUnits = () => setUnits((u) => (u === "imperial" ? "metric" : "imperial"))

  return (
    <div className="wrapper">
      <div className="topbar">
        <h1 className="h1">Current Conditions Golf</h1>
        <button className="btn" onClick={toggleUnits}>{units === "imperial" ? "°F / mph" : "°C / m/s"}</button>
      </div>

      <div className="row">
        {geo.status !== "granted" ? (
          <button className="btn" onClick={() => void request()}>Enable Location</button>
        ) : (
          <button className="btn" onClick={() => void refresh()} disabled={loading}>
            {loading ? "Loading…" : "Refresh"}
          </button>
        )}
        <div className="small">Last updated: {updatedAt}</div>
      </div>

      <div>
        {err && <div className="card small">Error: {err}</div>}
        {!wx && geo.status !== "granted" && (
          <div className="card small center">
            Build-safe UI ready — enable location to fetch live data.
          </div>
        )}
        {wx && (
          <>
            <div className="grid">
              <div className="card">
                <p className="h2">Wind</p>
                <div className="big">{formatSpeed(wx.windSpeed, units)}</div>
                <div className="small">Gust {formatSpeed(wx.windGust, units)} · {formatDir(wx.windDir)}</div>
              </div>
              <div className="card">
                <p className="h2">Temp</p>
                <div className="big">{formatTemp(wx.temp, units)}</div>
                <div className="small">Feels {formatTemp(wx.feels, units)}</div>
              </div>
              <div className="card">
                <p className="h2">Humidity</p>
                <div className="big">{wx.humidity.toFixed(0)}%</div>
                <div className="small">Cloud {wx.cloud.toFixed(0)}%</div>
              </div>
              <div className="card">
                <p className="h2">UV</p>
                <div className="big">{wx.uv.toFixed(1)}</div>
                <div className="small">Next hr outlook</div>
              </div>
            </div>

            <hr />

            <div className="grid">
              <div className="card"><p className="h2">Precip next 1h</p><div className="big">{formatPrecip(wx.precip1h, units)}</div></div>
              <div className="card"><p className="h2">Precip next 3h</p><div className="big">{formatPrecip(wx.precip3h, units)}</div></div>
              <div className="card"><p className="h2">Precip next 24h</p><div className="big">{formatPrecip(wx.precip24h, units)}</div></div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
