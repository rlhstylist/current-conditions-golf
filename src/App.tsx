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
      <header className="layout__header">
        <div className="layout__course" aria-live="polite" style={courseStyle}>
          <span className="layout__course-label">{courseLabel}</span>
        </div>
        <button
          className="pill"
          type="button"
          onClick={toggleUnits}
          aria-label={units === "imperial" ? "Switch to metric units" : "Switch to imperial units"}
        >
          {units === "imperial" ? "°F · mph" : "°C · km/h"}
        </button>
      </header>

      {(showLocationPrompt || showStatus) && (
        <div className="notice-row">
          {showLocationPrompt && (
            <button
              className="pill pill--action"
              type="button"
              onClick={() => void request()}
              aria-label="Enable location access"
            >
              Enable location
            </button>
          )}
          {showStatus && statusLabel && (
            <span className="micro" aria-live="polite">
              {statusLabel}
            </span>
          )}
        </div>
      )}

      <main className="layout__body">
        {err && <div className="panel panel--alert">Error: {err}</div>}
        {!wx && geo.status !== "granted" && (
          <div className="panel panel--ghost" aria-live="polite">
            Enable location to load the nearest course and live weather.
          </div>
        )}
        {wx && (
          <div className="dashboard" role="region" aria-label="Course weather overview">
            <section className="panel wind" aria-label="Wind conditions">
              <header className="panel__header">
                <div>
                  <p className="panel__title">Wind</p>
                  <p className="panel__subtitle">Live direction and gusts</p>
                </div>
                <span className="badge">Now</span>
              </header>
              <div className="wind__core">
                <div className="wind__dial">
                  <WindArrow
                    degrees={windRelative}
                    size={132}
                    className="wind-arrow"
                    ariaLabel={`Wind direction ${windCardinal} ${windDegrees}°`}
                  />
                </div>
                <div className="wind__reading">
                  <p className="wind__speed">{formatSpeed(wx.windSpeed, units)}</p>
                  <p className="micro">Gust {formatSpeed(wx.windGust, units)}</p>
                </div>
              </div>
              <div className="wind__meta">
                <div className="chip">
                  <span className="micro">Direction</span>
                  <span className="chip__value">{windCardinal} · {windDegrees}°</span>
                </div>
                <div className="chip">
                  <span className="micro">Heading ref</span>
                  <span className="chip__value">{headingStatus === "granted" ? "Locked" : "Device"}</span>
                </div>
              </div>
              {headingStatus === "idle" && (
                <button
                  type="button"
                  className="pill pill--action wind__compass"
                  onClick={requestHeading}
                  aria-label="Enable compass access for wind arrow"
                >
                  Enable compass
                </button>
              )}
              {headingStatus === "pending" && (
                <div className="micro muted wind__compass" aria-live="polite">
                  Waiting for compass permission…
                </div>
              )}
              {headingStatus === "denied" && (
                <div className="wind__compass" aria-live="polite">
                  <div className="micro muted">Compass access denied</div>
                  <button
                    type="button"
                    className="pill pill--action"
                    onClick={requestHeading}
                    aria-label="Retry enabling compass access"
                  >
                    Try again
                  </button>
                </div>
              )}
              {headingStatus === "unsupported" && (
                <div className="micro muted wind__compass" aria-live="polite">
                  Compass not supported on this device
                </div>
              )}
              <div className="panel__divider" role="presentation" />
              <header className="panel__header panel__header--compact">
                <span className="badge badge--ghost">+1h</span>
                <p className="panel__subtitle">Forecast snapshot</p>
              </header>
              <div className="grid grid--thirds">
                <div className="chip chip--stacked">
                  <span className="micro">Direction</span>
                  <span className="chip__value">{windCardinalNext} · {windDegreesNext}°</span>
                </div>
                <div className="chip chip--stacked">
                  <span className="micro">Speed</span>
                  <span className="chip__value">{formatSpeed(wx.nextHour.windSpeed, units)}</span>
                </div>
                <div className="chip chip--stacked">
                  <span className="micro">Gust</span>
                  <span className="chip__value">{formatSpeed(wx.nextHour.windGust, units)}</span>
                </div>
              </div>
            </section>

            <section className="panel climate" aria-label="Temperature, humidity, UV index, and cloud cover">
              <header className="panel__header">
                <div>
                  <p className="panel__title">Atmosphere</p>
                  <p className="panel__subtitle">Comfort metrics now and next hour</p>
                </div>
              </header>
              <div className="climate__columns">
                <div className="climate__column">
                  <span className="badge">Now</span>
                  <dl className="stat-grid">
                    <div>
                      <dt>Temperature</dt>
                      <dd>{formatTemp(wx.temp, units)}</dd>
                    </div>
                    <div>
                      <dt>Feels like</dt>
                      <dd>{formatTemp(wx.feels, units)}</dd>
                    </div>
                    <div>
                      <dt>Humidity</dt>
                      <dd>{wx.humidity.toFixed(0)}%</dd>
                    </div>
                    <div>
                      <dt>UV index</dt>
                      <dd>{wx.uv.toFixed(1)}</dd>
                    </div>
                    <div>
                      <dt>Cloud cover</dt>
                      <dd>{wx.cloud.toFixed(0)}%</dd>
                    </div>
                  </dl>
                </div>
                <div className="climate__column">
                  <span className="badge badge--ghost">+1h</span>
                  <dl className="stat-grid">
                    <div>
                      <dt>Temperature</dt>
                      <dd>{formatTemp(wx.nextHour.temp, units)}</dd>
                    </div>
                    <div>
                      <dt>Feels like</dt>
                      <dd>{formatTemp(wx.nextHour.feels, units)}</dd>
                    </div>
                    <div>
                      <dt>Humidity</dt>
                      <dd>{wx.nextHour.humidity.toFixed(0)}%</dd>
                    </div>
                    <div>
                      <dt>UV index</dt>
                      <dd>{wx.nextHour.uv.toFixed(1)}</dd>
                    </div>
                    <div>
                      <dt>Cloud cover</dt>
                      <dd>{wx.nextHour.cloud.toFixed(0)}%</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </section>

            <section className="panel precip" aria-label="Precipitation outlook">
              <header className="panel__header">
                <div>
                  <p className="panel__title">Sky Radar</p>
                  <p className="panel__subtitle">Precipitation probabilities</p>
                </div>
              </header>
              <div className="precip__grid">
                <div className="precip__block">
                  <span className="micro">Next hour</span>
                  <span className="precip__value">{formatPercent(wx.precipChance1h)}</span>
                  <span className="micro">Chance</span>
                </div>
                <div className="precip__block">
                  <span className="micro">Next 3h</span>
                  <span className="precip__value">{formatPercent(wx.precipChance3h)}</span>
                  <span className="micro">Chance</span>
                </div>
                <div className="precip__block">
                  <span className="micro">24h total</span>
                  <span className="precip__value">{formatPrecip(wx.precip24h, units)}</span>
                  <span className="micro">Accumulation</span>
                </div>
              </div>
              <div className="panel__divider" role="presentation" />
              <div className="precip__future">
                <div className="precip__block">
                  <span className="micro">Chance at +1h</span>
                  <span className="precip__value">{formatPercent(precipHour1)}</span>
                </div>
                <div className="precip__block">
                  <span className="micro">In 2h</span>
                  <span className="precip__value">{formatPercent(precipHour2)}</span>
                </div>
                <div className="precip__chart" aria-label="Precipitation probability trend for the next five hours">
                  <PrecipChart values={precipTrend} className="precip-chart" />
                  <span className="micro">5h trend</span>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      <footer className="layout__footer">
        <span className="micro">
          Updated {" "}
          <time dateTime={updatedDateTime}>{updatedDisplay}</time>
        </span>
      </footer>
    </div>
  )
}
