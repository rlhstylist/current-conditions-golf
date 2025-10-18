import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import "./index.css"
import { useGeo } from "./hooks/useGeo"
import { loadCourse, pickNearest } from "./hooks/useCourse"
import type { CourseState } from "./hooks/useCourse"
import { useHeading } from "./hooks/useHeading"
import PrecipChart from "./components/PrecipChart"
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
  const windDirNext = wx?.nextHour.windDir ?? windDir
  const windCardinalNext = formatDir(windDirNext)
  const windDegreesNext = Math.round(windDirNext)
  const windRelativeNext = useMemo(() => {
    if (headingStatus !== "granted" || heading == null) return windDirNext
    return windDirNext - heading
  }, [heading, headingStatus, windDirNext])
  const updatedDisplay = useMemo(() => {
    if (!updatedAt) return "—"
    return updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }, [updatedAt])
  const updatedDateTime = updatedAt?.toISOString()

  const precipTrend = wx?.precipChanceNext5h ?? []
  const precipHour1 = wx?.nextHour.precipChance ?? wx?.precipChance1h ?? 0
  const precipHour2 = precipTrend[1] ?? precipHour1

  const showLocationPrompt = geo.status !== "granted"
  const showStatus = !course?.name && Boolean(statusLabel)

  return (
    <div className="layout">
      <header className="hero">
        <div className="hero__text">
          <p className="hero__eyebrow">Current conditions</p>
          <p className="hero__course" aria-live="polite" style={courseStyle}>
            {courseLabel}
          </p>
        </div>
        <button
          className="chip chip--action"
          type="button"
          onClick={toggleUnits}
          aria-label={units === "imperial" ? "Switch to metric units" : "Switch to imperial units"}
        >
          {units === "imperial" ? "°F · mph" : "°C · km/h"}
        </button>
      </header>

      {(showLocationPrompt || showStatus) && (
        <section className="callout" aria-live="polite">
          <div className="callout__content">
            {showLocationPrompt && <h2>Location access</h2>}
            {showStatus && statusLabel && <p>{statusLabel}</p>}
            {showLocationPrompt && !statusLabel && <p>Enable location to lock on to your nearest course.</p>}
          </div>
          {showLocationPrompt && (
            <button
              className="chip chip--primary"
              type="button"
              onClick={() => void request()}
              aria-label="Enable location access"
            >
              Enable
            </button>
          )}
        </section>
      )}

      <main className="canvas">
        {err && <div className="notice notice--error">Error: {err}</div>}
        {!wx && geo.status !== "granted" && (
          <div className="notice">Enable location to load the nearest course and live weather.</div>
        )}
        {wx && (
          <div className="modules">
            <section className="panel panel--wind" aria-label="Wind now and in one hour">
              <header className="panel__header">
                <span className="panel__title">Wind field</span>
                <span className="panel__meta">Real-time</span>
              </header>
              <div className="wind-grid">
                <div className="wind-cell">
                  <div className="wind-label">
                    <span className="chip chip--subtle">Now</span>
                    <span className="wind-dir">{windCardinal} · {windDegrees}°</span>
                  </div>
                  <div className="wind-visual">
                    <WindArrow
                      degrees={windRelative}
                      size={148}
                      className="wind-arrow"
                      ariaLabel={`Wind direction ${windCardinal} ${windDegrees}°`}
                    />
                    <div className="wind-speed">
                      <span className="wind-speed__main">{formatSpeed(wx.windSpeed, units)}</span>
                      <span className="wind-speed__sub">Gust {formatSpeed(wx.windGust, units)}</span>
                    </div>
                  </div>
                </div>
                <div className="wind-cell">
                  <div className="wind-label">
                    <span className="chip chip--subtle">+1 hour</span>
                    <span className="wind-dir">{windCardinalNext} · {windDegreesNext}°</span>
                  </div>
                  <div className="wind-visual">
                    <WindArrow
                      degrees={windRelativeNext}
                      size={148}
                      className="wind-arrow"
                      ariaLabel={`Wind direction forecast ${windCardinalNext} ${windDegreesNext}°`}
                    />
                    <div className="wind-speed">
                      <span className="wind-speed__main">{formatSpeed(wx.nextHour.windSpeed, units)}</span>
                      <span className="wind-speed__sub">Gust {formatSpeed(wx.nextHour.windGust, units)}</span>
                    </div>
                  </div>
                </div>
              </div>
              {headingStatus === "idle" && (
                <button
                  type="button"
                  className="chip chip--action chip--wide"
                  onClick={requestHeading}
                  aria-label="Enable compass access for wind arrow"
                >
                  Enable compass alignment
                </button>
              )}
              {headingStatus === "pending" && (
                <p className="panel__note" aria-live="polite">
                  Waiting for compass permission…
                </p>
              )}
              {headingStatus === "denied" && (
                <div className="panel__note" aria-live="polite">
                  <p>Compass access denied.</p>
                  <button
                    type="button"
                    className="chip chip--action chip--wide"
                    onClick={requestHeading}
                    aria-label="Retry enabling compass access"
                  >
                    Try again
                  </button>
                </div>
              )}
              {headingStatus === "unsupported" && (
                <p className="panel__note" aria-live="polite">
                  Compass not supported on this device.
                </p>
              )}
            </section>

            <section
              className="panel panel--climate"
              aria-label="Temperature, humidity, UV index, and cloud cover now and in one hour"
            >
              <header className="panel__header">
                <span className="panel__title">Atmosphere</span>
                <span className="panel__meta">Comfort snapshot</span>
              </header>
              <div className="climate-columns">
                <div className="climate-column">
                  <span className="chip chip--subtle">Now</span>
                  <div className="climate-temp">
                    <span className="climate-temp__value">{formatTemp(wx.temp, units)}</span>
                    <span className="climate-temp__sub">Feels {formatTemp(wx.feels, units)}</span>
                  </div>
                  <dl className="climate-list">
                    <div>
                      <dt>Humidity</dt>
                      <dd>{wx.humidity.toFixed(0)}%</dd>
                    </div>
                    <div>
                      <dt>UV index</dt>
                      <dd>{wx.uv.toFixed(1)}</dd>
                    </div>
                    <div>
                      <dt>Clouds</dt>
                      <dd>{wx.cloud.toFixed(0)}%</dd>
                    </div>
                  </dl>
                </div>
                <div className="climate-column">
                  <span className="chip chip--subtle">+1 hour</span>
                  <div className="climate-temp">
                    <span className="climate-temp__value">{formatTemp(wx.nextHour.temp, units)}</span>
                    <span className="climate-temp__sub">Feels {formatTemp(wx.nextHour.feels, units)}</span>
                  </div>
                  <dl className="climate-list">
                    <div>
                      <dt>Humidity</dt>
                      <dd>{wx.nextHour.humidity.toFixed(0)}%</dd>
                    </div>
                    <div>
                      <dt>UV index</dt>
                      <dd>{wx.nextHour.uv.toFixed(1)}</dd>
                    </div>
                    <div>
                      <dt>Clouds</dt>
                      <dd>{wx.nextHour.cloud.toFixed(0)}%</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </section>

            <section className="panel panel--precip" aria-label="Precipitation outlook">
              <header className="panel__header">
                <span className="panel__title">Rain radar</span>
                <span className="panel__meta">Probability + totals</span>
              </header>
              <div className="precip-grid">
                <div className="precip-card">
                  <span className="chip chip--subtle">Next hour</span>
                  <span className="precip-value">{formatPercent(wx.precipChance1h)}</span>
                  <span className="precip-label">Chance</span>
                </div>
                <div className="precip-card">
                  <span className="chip chip--subtle">Next 3h</span>
                  <span className="precip-value">{formatPercent(wx.precipChance3h)}</span>
                  <span className="precip-label">Chance</span>
                </div>
                <div className="precip-card">
                  <span className="chip chip--subtle">24h total</span>
                  <span className="precip-value">{formatPrecip(wx.precip24h, units)}</span>
                  <span className="precip-label">Accumulation</span>
                </div>
              </div>
              <div className="precip-outlook">
                <div className="precip-card">
                  <span className="chip chip--subtle">Chance @ +1h</span>
                  <span className="precip-value">{formatPercent(precipHour1)}</span>
                  <span className="precip-label">Next 1h</span>
                </div>
                <div className="precip-card">
                  <span className="chip chip--subtle">Chance @ +2h</span>
                  <span className="precip-value">{formatPercent(precipHour2)}</span>
                  <span className="precip-label">In 2h</span>
                </div>
                <div className="precip-trend">
                  <span className="chip chip--subtle">5h trend</span>
                  <PrecipChart
                    values={precipTrend}
                    className="precip-chart"
                    ariaLabel="Precipitation probability trend for the next five hours"
                  />
                  <span className="precip-label">Chance</span>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      <footer className="footer">
        <span className="footer__timestamp">
          Updated <time dateTime={updatedDateTime}>{updatedDisplay}</time>
        </span>
      </footer>
    </div>
  )
}
