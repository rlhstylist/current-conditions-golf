import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import "./index.css"
import { useGeo } from "./hooks/useGeo"
import { loadCourse, pickNearest } from "./hooks/useCourse"
import type { CourseState } from "./hooks/useCourse"
import { useHeading } from "./hooks/useHeading"
import WindArrow from "./components/WindArrow"
import type { Course } from "./lib/overpass"
import { fetchWeather, type Weather } from "./lib/openmeteo"
import { formatDir, formatPercent, formatPrecip, formatSpeed, formatTemp, type Units } from "./utils/units"

const UNITS_KEY = "ccg_units_v1"

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
          <div className="grid">
            <div className="card wind-card span2">
              <div className="wind-heading">
                <p className="h2">Wind</p>
                <span className="small">{windCardinal} · {windDegrees}°</span>
              </div>
              <div className="wind-hero">
                <div className="wind-arrow-wrap">
                  <WindArrow
                    degrees={windRelative}
                    size={188}
                    className="wind-arrow"
                    ariaLabel={`Wind direction ${windCardinal} ${windDegrees}°`}
                  />
                </div>
                <div className="wind-speed">
                  <div className="huge">{formatSpeed(wx.windSpeed, units)}</div>
                  <div className="small">Gust {formatSpeed(wx.windGust, units)}</div>
                </div>
              </div>
              {headingStatus === "idle" && (
                <button
                  type="button"
                  className="btn compass-btn"
                  onClick={requestHeading}
                  aria-label="Enable compass access for wind arrow"
                >
                  Enable compass
                </button>
              )}
              {headingStatus === "pending" && (
                <div className="small muted" aria-live="polite">
                  Waiting for compass permission…
                </div>
              )}
              {headingStatus === "denied" && (
                <div className="compass-retry" aria-live="polite">
                  <div className="small muted">Compass access denied</div>
                  <button
                    type="button"
                    className="btn compass-btn"
                    onClick={requestHeading}
                    aria-label="Retry enabling compass access"
                  >
                    Try again
                  </button>
                </div>
              )}
              {headingStatus === "unsupported" && (
                <div className="small muted" aria-live="polite">
                  Compass not supported on this device
                </div>
              )}
            </div>
            <div className="metrics-grid span2">
              <section className="card metric-card temperature-card" aria-label="Temperature and humidity">
                <div className="metric-header">
                  <p className="h2">Temperature</p>
                  <span className="small">Feels {formatTemp(wx.feels, units)}</span>
                </div>
                <div className="metric-value">{formatTemp(wx.temp, units)}</div>
                <dl className="metric-list">
                  <div className="metric-item">
                    <dt>Humidity</dt>
                    <dd>{wx.humidity.toFixed(0)}%</dd>
                  </div>
                </dl>
              </section>
              <section className="card metric-card sky-card" aria-label="UV index and cloud cover">
                <div className="metric-header">
                  <p className="h2">UV + Cloud</p>
                </div>
                <dl className="metric-list">
                  <div className="metric-item">
                    <dt>UV index</dt>
                    <dd>{wx.uv.toFixed(1)}</dd>
                  </div>
                  <div className="metric-item">
                    <dt>Cloud cover</dt>
                    <dd>{wx.cloud.toFixed(0)}%</dd>
                  </div>
                </dl>
              </section>
            </div>
            <section className="card span2 precip-card" aria-label="Precipitation outlook">
              <p className="h2">Precip Summary</p>
              <dl className="precip-list">
                <div className="precip-item">
                  <dt>Next 1h chance</dt>
                  <dd>{formatPercent(wx.precipChance1h)}</dd>
                </div>
                <div className="precip-item">
                  <dt>Next 3h chance</dt>
                  <dd>{formatPercent(wx.precipChance3h)}</dd>
                </div>
                <div className="precip-item">
                  <dt>24h total</dt>
                  <dd>{formatPrecip(wx.precip24h, units)}</dd>
                </div>
              </dl>
            </section>
          </div>
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
