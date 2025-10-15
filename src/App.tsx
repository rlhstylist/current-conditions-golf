import { useEffect, useState } from "react"
import "./index.css"
import { useGeo } from "./hooks/useGeo"
import { fetchWeather, type Weather } from "./lib/openmeteo"
import { FlippableCard } from "./components/FlippableCard"
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
  const hourLabel = (iso: string) => {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return "--:--"
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
  }

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
              <FlippableCard
                ariaLabel="Wind conditions card"
                front={({ showBack }) => (
                  <>
                    <p className="h2">Wind</p>
                    <div className="big">{formatSpeed(wx.windSpeed, units)}</div>
                    <div className="small flip-row">
                      <span>Gust {formatSpeed(wx.windGust, units)} · {formatDir(wx.windDir)}</span>
                      <button
                        type="button"
                        className="flip-btn"
                        onClick={(e) => { e.stopPropagation(); showBack() }}
                      >
                        Trend ▸
                      </button>
                    </div>
                  </>
                )}
                back={({ showFront }) => (
                  <>
                    <div className="card-head">
                      <p className="h2">Wind trend</p>
                      <button
                        type="button"
                        className="flip-btn"
                        onClick={(e) => { e.stopPropagation(); showFront() }}
                      >
                        ◂ Close
                      </button>
                    </div>
                    <table className="trend-table">
                      <thead>
                        <tr>
                          <th>HR</th>
                          <th>SPD</th>
                          <th>GST</th>
                          <th>DIR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {wx.forecast.hours.map((hr, idx) => (
                          <tr key={`${hr}-wind`}>
                            <td>{hourLabel(hr)}</td>
                            <td>{formatSpeed(wx.forecast.windSpeed[idx] ?? 0, units)}</td>
                            <td>{formatSpeed(wx.forecast.windGust[idx] ?? 0, units)}</td>
                            <td>{formatDir(wx.forecast.windDir[idx] ?? 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="small flip-hint">Tap, click, or press space to flip.</div>
                  </>
                )}
              />

              <FlippableCard
                ariaLabel="Temperature card"
                front={({ showBack }) => (
                  <>
                    <p className="h2">Temp</p>
                    <div className="big">{formatTemp(wx.temp, units)}</div>
                    <div className="small flip-row">
                      <span>Feels {formatTemp(wx.feels, units)}</span>
                      <button
                        type="button"
                        className="flip-btn"
                        onClick={(e) => { e.stopPropagation(); showBack() }}
                      >
                        Trend ▸
                      </button>
                    </div>
                  </>
                )}
                back={({ showFront }) => (
                  <>
                    <div className="card-head">
                      <p className="h2">Temp trend</p>
                      <button
                        type="button"
                        className="flip-btn"
                        onClick={(e) => { e.stopPropagation(); showFront() }}
                      >
                        ◂ Close
                      </button>
                    </div>
                    <table className="trend-table">
                      <thead>
                        <tr>
                          <th>HR</th>
                          <th>TEMP</th>
                          <th>FEEL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {wx.forecast.hours.map((hr, idx) => (
                          <tr key={`${hr}-temp`}>
                            <td>{hourLabel(hr)}</td>
                            <td>{formatTemp(wx.forecast.temp[idx] ?? 0, units)}</td>
                            <td>{formatTemp(wx.forecast.feels[idx] ?? 0, units)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="small flip-hint">Trend view — press again to close.</div>
                  </>
                )}
              />

              <FlippableCard
                ariaLabel="Humidity card"
                front={({ showBack }) => (
                  <>
                    <p className="h2">Humidity</p>
                    <div className="big">{wx.humidity.toFixed(0)}%</div>
                    <div className="small flip-row">
                      <span>Cloud {wx.cloud.toFixed(0)}%</span>
                      <button
                        type="button"
                        className="flip-btn"
                        onClick={(e) => { e.stopPropagation(); showBack() }}
                      >
                        Trend ▸
                      </button>
                    </div>
                  </>
                )}
                back={({ showFront }) => (
                  <>
                    <div className="card-head">
                      <p className="h2">Moisture trend</p>
                      <button
                        type="button"
                        className="flip-btn"
                        onClick={(e) => { e.stopPropagation(); showFront() }}
                      >
                        ◂ Close
                      </button>
                    </div>
                    <table className="trend-table">
                      <thead>
                        <tr>
                          <th>HR</th>
                          <th>RH%</th>
                          <th>CLD%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {wx.forecast.hours.map((hr, idx) => (
                          <tr key={`${hr}-humid`}>
                            <td>{hourLabel(hr)}</td>
                            <td>{Math.round(wx.forecast.humidity[idx] ?? 0)}%</td>
                            <td>{Math.round(wx.forecast.cloud[idx] ?? 0)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="small flip-hint">Humidity + cloud outlook.</div>
                  </>
                )}
              />

              <FlippableCard
                ariaLabel="UV index card"
                front={({ showBack }) => (
                  <>
                    <p className="h2">UV</p>
                    <div className="big">{wx.uv.toFixed(1)}</div>
                    <div className="small flip-row">
                      <span>Next hr outlook</span>
                      <button
                        type="button"
                        className="flip-btn"
                        onClick={(e) => { e.stopPropagation(); showBack() }}
                      >
                        Trend ▸
                      </button>
                    </div>
                  </>
                )}
                back={({ showFront }) => (
                  <>
                    <div className="card-head">
                      <p className="h2">UV trend</p>
                      <button
                        type="button"
                        className="flip-btn"
                        onClick={(e) => { e.stopPropagation(); showFront() }}
                      >
                        ◂ Close
                      </button>
                    </div>
                    <table className="trend-table">
                      <thead>
                        <tr>
                          <th>HR</th>
                          <th>UV</th>
                          <th>CLD%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {wx.forecast.hours.map((hr, idx) => (
                          <tr key={`${hr}-uv`}>
                            <td>{hourLabel(hr)}</td>
                            <td>{(wx.forecast.uv[idx] ?? 0).toFixed(1)}</td>
                            <td>{Math.round(wx.forecast.cloud[idx] ?? 0)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="small flip-hint">Cloud cover modulates exposure.</div>
                  </>
                )}
              />
            </div>

            <hr />

            <div className="grid">
              <FlippableCard
                ariaLabel="Precipitation next hour"
                front={({ showBack }) => (
                  <>
                    <p className="h2">Precip next 1h</p>
                    <div className="big">{formatPrecip(wx.precip1h, units)}</div>
                    <div className="small flip-row">
                      <span>Hourly detail</span>
                      <button
                        type="button"
                        className="flip-btn"
                        onClick={(e) => { e.stopPropagation(); showBack() }}
                      >
                        Trend ▸
                      </button>
                    </div>
                  </>
                )}
                back={({ showFront }) => (
                  <>
                    <div className="card-head">
                      <p className="h2">Precip outlook</p>
                      <button
                        type="button"
                        className="flip-btn"
                        onClick={(e) => { e.stopPropagation(); showFront() }}
                      >
                        ◂ Close
                      </button>
                    </div>
                    <table className="trend-table">
                      <thead>
                        <tr>
                          <th>HR</th>
                          <th>AMT</th>
                          <th>PROB</th>
                        </tr>
                      </thead>
                      <tbody>
                        {wx.forecast.hours.map((hr, idx) => (
                          <tr key={`${hr}-precip-1`}>
                            <td>{hourLabel(hr)}</td>
                            <td>{formatPrecip(wx.forecast.precip[idx] ?? 0, units)}</td>
                            <td>{Math.round(wx.forecast.precipProb[idx] ?? 0)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="small flip-hint">Probabilities & amounts by hour.</div>
                  </>
                )}
              />

              <FlippableCard
                ariaLabel="Precipitation next three hours"
                front={({ showBack }) => (
                  <>
                    <p className="h2">Precip next 3h</p>
                    <div className="big">{formatPrecip(wx.precip3h, units)}</div>
                    <div className="small flip-row">
                      <span>Hourly detail</span>
                      <button
                        type="button"
                        className="flip-btn"
                        onClick={(e) => { e.stopPropagation(); showBack() }}
                      >
                        Trend ▸
                      </button>
                    </div>
                  </>
                )}
                back={({ showFront }) => (
                  <>
                    <div className="card-head">
                      <p className="h2">Precip outlook</p>
                      <button
                        type="button"
                        className="flip-btn"
                        onClick={(e) => { e.stopPropagation(); showFront() }}
                      >
                        ◂ Close
                      </button>
                    </div>
                    <table className="trend-table">
                      <thead>
                        <tr>
                          <th>HR</th>
                          <th>AMT</th>
                          <th>PROB</th>
                        </tr>
                      </thead>
                      <tbody>
                        {wx.forecast.hours.map((hr, idx) => (
                          <tr key={`${hr}-precip-3`}>
                            <td>{hourLabel(hr)}</td>
                            <td>{formatPrecip(wx.forecast.precip[idx] ?? 0, units)}</td>
                            <td>{Math.round(wx.forecast.precipProb[idx] ?? 0)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="small flip-hint">Same data, different window.</div>
                  </>
                )}
              />

              <FlippableCard
                ariaLabel="Precipitation next day"
                front={({ showBack }) => (
                  <>
                    <p className="h2">Precip next 24h</p>
                    <div className="big">{formatPrecip(wx.precip24h, units)}</div>
                    <div className="small flip-row">
                      <span>Hourly detail</span>
                      <button
                        type="button"
                        className="flip-btn"
                        onClick={(e) => { e.stopPropagation(); showBack() }}
                      >
                        Trend ▸
                      </button>
                    </div>
                  </>
                )}
                back={({ showFront }) => (
                  <>
                    <div className="card-head">
                      <p className="h2">Precip outlook</p>
                      <button
                        type="button"
                        className="flip-btn"
                        onClick={(e) => { e.stopPropagation(); showFront() }}
                      >
                        ◂ Close
                      </button>
                    </div>
                    <table className="trend-table">
                      <thead>
                        <tr>
                          <th>HR</th>
                          <th>AMT</th>
                          <th>PROB</th>
                        </tr>
                      </thead>
                      <tbody>
                        {wx.forecast.hours.map((hr, idx) => (
                          <tr key={`${hr}-precip-24`}>
                            <td>{hourLabel(hr)}</td>
                            <td>{formatPrecip(wx.forecast.precip[idx] ?? 0, units)}</td>
                            <td>{Math.round(wx.forecast.precipProb[idx] ?? 0)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="small flip-hint">Hourly trace for the day.</div>
                  </>
                )}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
