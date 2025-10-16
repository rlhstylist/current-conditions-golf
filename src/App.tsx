import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import "./index.css"
import { useGeo } from "./hooks/useGeo"
import { loadCourse, pickNearest } from "./hooks/useCourse"
import type { CourseState } from "./hooks/useCourse"
import { useHeading } from "./hooks/useHeading"
import WindArrow from "./components/WindArrow"
import type { Course } from "./lib/overpass"
import { fetchWeather, type Weather } from "./lib/openmeteo"
import { FlippableCard } from "./components/FlippableCard"
import { WindArrow } from "./components/WindArrow"
import { formatSpeed, formatTemp, formatDir, formatPrecip, type Units } from "./utils/units"

export default function App() {
  const { geo, request } = useGeo()
  const [units, setUnits] = useState<Units>(() => {
    if (typeof window === "undefined") return "imperial"
    const stored = window.localStorage.getItem(UNITS_KEY)
    return stored === "metric" || stored === "imperial" ? stored : "imperial"
  })
  const [wx, setWx] = useState<Weather | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const [course, setCourse] = useState<Course | null>(null)
  const [courseManual, setCourseManual] = useState(false)
  const [courseLoading, setCourseLoading] = useState(false)
  const [courseError, setCourseError] = useState<string | null>(null)
  const lastFetchId = useRef(0)
  const { heading, status: headingStatus, request: requestHeading } = useHeading()

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const stored: CourseState = loadCourse()
      if (stored.course) {
        setCourse(stored.course)
        setCourseManual(Boolean(stored.manual))
      }
    } catch (e) {
      console.warn("Failed to load stored course", e)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.localStorage.setItem(UNITS_KEY, units)
  }, [units])

  useEffect(() => {
    if (geo.status !== "granted" || !geo.coords || courseManual) return
    setCourseLoading(true)
    setCourseError(null)
    let active = true
    pickNearest(geo.coords.lat, geo.coords.lon)
      .then((hit) => {
        if (!active || !hit) return
        setCourse(hit)
        setCourseManual(false)
      })
      .catch((e: unknown) => {
        if (!active) return
        const message = e instanceof Error ? e.message : "Nearest course unavailable"
        setCourseError(message)
      })
      .finally(() => {
        if (active) setCourseLoading(false)
      })
    return () => {
      active = false
    }
  }, [geo.status, geo.coords?.lat, geo.coords?.lon, courseManual])

  const targetLat = course?.lat ?? geo.coords?.lat
  const targetLon = course?.lon ?? geo.coords?.lon

  const updateWeather = useCallback(async (lat: number, lon: number): Promise<void> => {
    const id = ++lastFetchId.current
    setErr(null)
    try {
      const data = await fetchWeather(lat, lon)
      if (lastFetchId.current !== id) return
      setWx(data)
      setUpdatedAt(new Date())
    } catch (e: unknown) {
      if (lastFetchId.current !== id) return
      const message = e instanceof Error ? e.message : "Weather unavailable"
      setErr(message)
    }
  }, [])

  useEffect(() => {
    if (typeof targetLat !== "number" || typeof targetLon !== "number") return
    void updateWeather(targetLat, targetLon)
  }, [targetLat, targetLon, updateWeather])

  const toggleUnits = () => setUnits((u) => (u === "imperial" ? "metric" : "imperial"))
  const hourLabel = (iso: string) => {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return "--:--"
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })
  }

  const courseLabel = useMemo(() => {
    if (course?.name) return course.name
    if (courseLoading) return "Locating course…"
    if (courseError) return courseError
    if (geo.status === "prompt") return "Awaiting location"
    if (geo.status === "denied") return "Location blocked"
    return "Nearest course unavailable"
  }, [course?.name, courseLoading, courseError, geo.status])

  const courseStyle = useMemo(() => {
    const length = courseLabel.length
    if (length <= 24) return undefined
    const size = Math.max(14, 22 - (length - 24) * 0.4)
    return { fontSize: `${size}px` }
  }, [courseLabel])

  const statusLabel = useMemo(() => {
    if (geo.status !== "granted") return "Location permission required"
    if (courseLoading) return "Locating course…"
    if (course?.name) return ""
    if (courseError) return courseError
    return "Course lookup pending"
  }, [geo.status, courseLoading, course?.name, courseError])

  const windDir = wx?.windDir ?? 0
  const windCardinal = formatDir(windDir)
  const windDegrees = Math.round(windDir)
  const windRelative = useMemo(() => {
    if (headingStatus !== "granted" || heading == null) return windDir
    return windDir - heading
  }, [heading, headingStatus, windDir])
  const updatedDisplay = useMemo(() => {
    if (!updatedAt) return "—"
    return updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }, [updatedAt])
  const updatedDateTime = updatedAt?.toISOString()

  const showLocationPrompt = geo.status !== "granted"
  const showStatus = !course?.name && Boolean(statusLabel)

  return (
    <div className="wrapper">
      <header className="topbar">
        <p className="course h1" aria-live="polite" style={courseStyle}>
          {courseLabel}
        </p>
        <button
          className="btn"
          type="button"
          onClick={toggleUnits}
          aria-label={units === "imperial" ? "Switch to metric units" : "Switch to imperial units"}
        >
          {units === "imperial" ? "°F · mph" : "°C · km/h"}
        </button>
      </header>

      {(showLocationPrompt || showStatus) && (
        <div className="row controls">
          {showLocationPrompt && (
            <button
              className="btn"
              type="button"
              onClick={() => void request()}
              aria-label="Enable location access"
            >
              Enable location
            </button>
          )}
          {showStatus && statusLabel && (
            <span className="small" aria-live="polite">
              {statusLabel}
            </span>
          )}
        </div>
      )}

      <main>
        {err && <div className="card small">Error: {err}</div>}
        {!wx && geo.status !== "granted" && (
          <div className="card small center">
            Enable location to load the nearest course and live weather.
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
      </main>

      <footer className="footer">
        <span className="updated">
          Updated {" "}
          <time dateTime={updatedDateTime}>{updatedDisplay}</time>
        </span>
      </footer>
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
