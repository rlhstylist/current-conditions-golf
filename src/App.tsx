import { useEffect, useState } from "react"
import "./index.css"
import { useGeo } from "./hooks/useGeo"
import { fetchWeather, type Weather } from "./lib/openmeteo"
import { FlippableCard } from "./components/FlippableCard"
import { WindArrow } from "./components/WindArrow"
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
                front={() => (
                  <>
                    <p className="h2">Wind</p>
                    <div className="big">{formatSpeed(wx.windSpeed, units)}</div>
                    <div className="small wind-meta">
                      <WindArrow deg={wx.windDir} />
                      <span>Gust {formatSpeed(wx.windGust, units)} · {formatDir(wx.windDir)}</span>
                    </div>
                  </>
                )}
                back={() => {
                  const nextHour = wx.forecast.hours[0]
                  const nextLabel = nextHour ? hourLabel(nextHour) : "Next hour"
                  const windSpd = wx.forecast.windSpeed[0] ?? wx.windSpeed
                  const windGst = wx.forecast.windGust[0] ?? wx.windGust
                  const windDir = wx.forecast.windDir[0] ?? wx.windDir
                  return (
                    <>
                      <p className="h2">Wind · {nextLabel}</p>
                      <div className="big">{formatSpeed(windSpd, units)}</div>
                      <div className="small wind-meta">
                        <WindArrow deg={windDir} />
                        <span>Gust {formatSpeed(windGst, units)} · {formatDir(windDir)}</span>
                      </div>
                    </>
                  )
                }}
              />

              <FlippableCard
                ariaLabel="Temperature card"
                front={() => (
                  <>
                    <p className="h2">Temp</p>
                    <div className="big">{formatTemp(wx.temp, units)}</div>
                    <div className="small">Feels {formatTemp(wx.feels, units)}</div>
                  </>
                )}
                back={() => {
                  const nextHour = wx.forecast.hours[0]
                  const nextLabel = nextHour ? hourLabel(nextHour) : "Next hour"
                  const nextTemp = wx.forecast.temp[0] ?? wx.temp
                  const nextFeels = wx.forecast.feels[0] ?? wx.feels
                  return (
                    <>
                      <p className="h2">Temp · {nextLabel}</p>
                      <div className="big">{formatTemp(nextTemp, units)}</div>
                      <div className="small">Feels {formatTemp(nextFeels, units)}</div>
                    </>
                  )
                }}
              />

              <FlippableCard
                ariaLabel="Humidity card"
                front={() => (
                  <>
                    <p className="h2">Humidity</p>
                    <div className="big">{wx.humidity.toFixed(0)}%</div>
                    <div className="small">Cloud {wx.cloud.toFixed(0)}%</div>
                  </>
                )}
                back={() => {
                  const nextHour = wx.forecast.hours[0]
                  const nextLabel = nextHour ? hourLabel(nextHour) : "Next hour"
                  const humidity = Math.round(wx.forecast.humidity[0] ?? wx.humidity)
                  const cloud = Math.round(wx.forecast.cloud[0] ?? wx.cloud)
                  return (
                    <>
                      <p className="h2">Humidity · {nextLabel}</p>
                      <div className="big">{humidity}%</div>
                      <div className="small">Cloud {cloud}%</div>
                    </>
                  )
                }}
              />

              <FlippableCard
                ariaLabel="UV index card"
                front={() => (
                  <>
                    <p className="h2">UV</p>
                    <div className="big">{wx.uv.toFixed(1)}</div>
                    <div className="small">Next hr outlook</div>
                  </>
                )}
                back={() => {
                  const nextHour = wx.forecast.hours[0]
                  const nextLabel = nextHour ? hourLabel(nextHour) : "Next hour"
                  const uv = (wx.forecast.uv[0] ?? wx.uv).toFixed(1)
                  const cloud = Math.round(wx.forecast.cloud[0] ?? wx.cloud)
                  return (
                    <>
                      <p className="h2">UV · {nextLabel}</p>
                      <div className="big">{uv}</div>
                      <div className="small">Cloud {cloud}%</div>
                    </>
                  )
                }}
              />
            </div>

            <hr />

            <div className="grid">
              <FlippableCard
                ariaLabel="Precipitation next hour"
                front={() => (
                  <>
                    <p className="h2">Precip next 1h</p>
                    <div className="big">{formatPrecip(wx.precip1h, units)}</div>
                    <div className="small">Chance {Math.round(wx.forecast.precipProb[0] ?? 0)}%</div>
                  </>
                )}
                back={() => {
                  const nextHour = wx.forecast.hours[0]
                  const nextLabel = nextHour ? hourLabel(nextHour) : "Next hour"
                  const nextAmount = formatPrecip(wx.forecast.precip[0] ?? wx.precip1h, units)
                  const nextProb = Math.round(wx.forecast.precipProb[0] ?? 0)
                  const chartHours = wx.forecast.hours.slice(0, 5)
                  const chartProbs = wx.forecast.precipProb.slice(0, 5)
                  return (
                    <>
                      <p className="h2">Precip · {nextLabel}</p>
                      <div className="big">{nextAmount}</div>
                      <div className="small">Chance {nextProb}%</div>
                      <PrecipChart hours={chartHours} probs={chartProbs} hourLabel={hourLabel} />
                    </>
                  )
                }}
              />

              <FlippableCard
                ariaLabel="Precipitation next three hours"
                front={() => (
                  <>
                    <p className="h2">Precip next 3h</p>
                    <div className="big">{formatPrecip(wx.precip3h, units)}</div>
                    <div className="small">Chance {Math.round(wx.forecast.precipProb[1] ?? wx.forecast.precipProb[0] ?? 0)}%</div>
                  </>
                )}
                back={() => {
                  const label = wx.forecast.hours[0] ? `${hourLabel(wx.forecast.hours[0])} →` : "Next hrs"
                  const total = wx.forecast.precip.slice(0, 3).reduce((acc, v) => acc + (v ?? 0), 0)
                  const samples = wx.forecast.precipProb.slice(0, 3)
                  const divisor = samples.length || 1
                  const prob = Math.round(samples.reduce((acc, v) => acc + (v ?? 0), 0) / divisor)
                  const chartHours = wx.forecast.hours.slice(0, 5)
                  const chartProbs = wx.forecast.precipProb.slice(0, 5)
                  return (
                    <>
                      <p className="h2">Precip · {label}</p>
                      <div className="big">{formatPrecip(total, units)}</div>
                      <div className="small">Avg chance {prob}%</div>
                      <PrecipChart hours={chartHours} probs={chartProbs} hourLabel={hourLabel} />
                    </>
                  )
                }}
              />

              <FlippableCard
                ariaLabel="Precipitation next day"
                front={() => (
                  <>
                    <p className="h2">Precip next 24h</p>
                    <div className="big">{formatPrecip(wx.precip24h, units)}</div>
                    <div className="small">Chance peak {Math.max(...wx.forecast.precipProb.slice(0, 5), 0)}%</div>
                  </>
                )}
                back={() => {
                  const total = wx.forecast.precip.slice(0, 24).reduce((acc, v) => acc + (v ?? 0), 0)
                  const peak = Math.max(...wx.forecast.precipProb.slice(0, 24), 0)
                  const chartHours = wx.forecast.hours.slice(0, 5)
                  const chartProbs = wx.forecast.precipProb.slice(0, 5)
                  return (
                    <>
                      <p className="h2">Precip · next day</p>
                      <div className="big">{formatPrecip(total, units)}</div>
                      <div className="small">Peak chance {Math.round(peak)}%</div>
                      <PrecipChart hours={chartHours} probs={chartProbs} hourLabel={hourLabel} />
                    </>
                  )
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

type PrecipChartProps = {
  hours: string[]
  probs: number[]
  hourLabel: (iso: string) => string
}

function PrecipChart({ hours, probs, hourLabel }: PrecipChartProps) {
  const normalized = probs.map((val) => {
    const num = Number.isFinite(val) ? val : 0
    return Math.min(Math.max(num, 0), 100)
  })
  const count = normalized.length || 1
  const baseY = 42
  const amplitude = 32
  const coords = normalized.length
    ? normalized.map((prob, idx) => {
        const x = count === 1 ? 50 : (idx / (count - 1)) * 100
        const y = baseY - (prob / 100) * amplitude
        return { x, y }
      })
    : [{ x: 50, y: baseY }]
  const polylinePoints = coords.map(({ x, y }) => `${x},${y}`).join(" ") || "0,42 100,42"
  const polygonPoints = [`0,${baseY}`, polylinePoints, `100,${baseY}`].join(" ")
  const displayHours = (hours.length ? hours : Array.from({ length: Math.max(count, 5) }, (_, idx) => `+${idx + 1}h`)).slice(0, 5)

  return (
    <div className="precip-chart-wrap">
      <svg
        className="precip-chart"
        viewBox="0 0 100 44"
        role="img"
        aria-label="Chance of rain over the next five hours"
      >
        <polygon points={polygonPoints} className="precip-chart-fill" />
        <polyline points={polylinePoints} className="precip-chart-line" />
        {coords.map(({ x, y }, idx) => (
          <circle key={`${x}-${idx}`} cx={x} cy={y} r={2.5} className="precip-chart-dot" />
        ))}
      </svg>
      <div className="precip-chart-labels small">
        {displayHours.map((hr, idx) => (
          <span key={`${hr}-${idx}`}>{hr.includes("+") ? hr : hourLabel(hr)}</span>
        ))}
      </div>
    </div>
  )
}
