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
    <div className="screen">
      <header className="hero">
        <div className="hero__title">
          <span className="hero__eyebrow">Current course</span>
          <p className="hero__course" aria-live="polite" style={courseStyle}>
            {courseLabel}
          </p>
        </div>
        <button
          className="chip-button"
          type="button"
          onClick={toggleUnits}
          aria-label={units === "imperial" ? "Switch to metric units" : "Switch to imperial units"}
        >
          {units === "imperial" ? "°F · mph" : "°C · km/h"}
        </button>
      </header>

      {(showLocationPrompt || showStatus) && (
        <div className="action-row" role="status" aria-live="polite">
          {showLocationPrompt && (
            <button
              className="action-button"
              type="button"
              onClick={() => void request()}
              aria-label="Enable location access"
            >
              Enable location
            </button>
          )}
          {showStatus && statusLabel && <span className="status-text">{statusLabel}</span>}
        </div>
      )}

      <main className="panels">
        {err && <div className="module module--alert">Error: {err}</div>}
        {!wx && geo.status !== "granted" && (
          <div className="module module--info" role="alert">
            Enable location to load the nearest course and live weather.
          </div>
        )}
        {wx && (
          <>
            <section className="module module--wind" aria-label="Wind now and in the next hour">
              <div className="module__title">
                <h2>Wind orbit</h2>
                <span>Live vs +1h</span>
              </div>
              <div className="wind-grid">
                <div className="wind-card">
                  <div className="wind-card__label">Now</div>
                  <div className="wind-circle">
                    <WindArrow
                      degrees={windRelative}
                      size={138}
                      className="wind-arrow"
                      ariaLabel={`Wind direction ${windCardinal} ${windDegrees}°`}
                    />
                  </div>
                  <dl className="wind-stats">
                    <div>
                      <dt>Speed</dt>
                      <dd className="wind-speed">{formatSpeed(wx.windSpeed, units)}</dd>
                    </div>
                    <div>
                      <dt>Direction</dt>
                      <dd className="wind-dir">{windCardinal} · {windDegrees}°</dd>
                    </div>
                    <div>
                      <dt>Gust</dt>
                      <dd className="wind-gust">{formatSpeed(wx.windGust, units)}</dd>
                    </div>
                  </dl>
                </div>
                <div className="wind-card">
                  <div className="wind-card__label">+1 hour</div>
                  <div className="wind-circle">
                    <WindArrow
                      degrees={windRelativeNext}
                      size={138}
                      className="wind-arrow"
                      ariaLabel={`Wind direction forecast ${windCardinalNext} ${windDegreesNext}°`}
                    />
                  </div>
                  <dl className="wind-stats">
                    <div>
                      <dt>Speed</dt>
                      <dd className="wind-speed">{formatSpeed(wx.nextHour.windSpeed, units)}</dd>
                    </div>
                    <div>
                      <dt>Direction</dt>
                      <dd className="wind-dir">{windCardinalNext} · {windDegreesNext}°</dd>
                    </div>
                    <div>
                      <dt>Gust</dt>
                      <dd className="wind-gust">{formatSpeed(wx.nextHour.windGust, units)}</dd>
                    </div>
                  </dl>
                </div>
              </div>
              <div className="compass-status" aria-live="polite">
                {headingStatus === "idle" && (
                  <button
                    type="button"
                    className="action-button action-button--outline"
                    onClick={requestHeading}
                    aria-label="Enable compass access for wind arrow"
                  >
                    Enable compass alignment
                  </button>
                )}
                {headingStatus === "pending" && <span className="status-text">Waiting for compass permission…</span>}
                {headingStatus === "denied" && (
                  <div className="compass-retry">
                    <span className="status-text">Compass access denied</span>
                    <button
                      type="button"
                      className="action-button action-button--outline"
                      onClick={requestHeading}
                      aria-label="Retry enabling compass access"
                    >
                      Try again
                    </button>
                  </div>
                )}
                {headingStatus === "unsupported" && <span className="status-text">Compass not supported on this device</span>}
              </div>
            </section>

            <section className="module module--climate" aria-label="Temperature, humidity, UV index, and cloud cover">
              <div className="module__title">
                <h2>Atmosphere</h2>
                <span>Now vs +1h</span>
              </div>
              <div className="climate-columns">
                <div className="climate-column">
                  <h3>Now</h3>
                  <div className="climate-temp">
                    <span className="climate-temp__reading">{formatTemp(wx.temp, units)}</span>
                    <span className="climate-temp__feels">Feels like {formatTemp(wx.feels, units)}</span>
                  </div>
                  <dl className="data-grid">
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
                <div className="climate-column">
                  <h3>+1 hour</h3>
                  <div className="climate-temp">
                    <span className="climate-temp__reading">{formatTemp(wx.nextHour.temp, units)}</span>
                    <span className="climate-temp__feels">Feels like {formatTemp(wx.nextHour.feels, units)}</span>
                  </div>
                  <dl className="data-grid">
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

            <section className="module module--precip" aria-label="Precipitation outlook">
              <div className="module__title">
                <h2>Precip scan</h2>
                <span>Probability + totals</span>
              </div>
              <div className="precip-overview">
                <div>
                  <h3>Next hour</h3>
                  <p className="precip-value">{formatPercent(wx.precipChance1h)}</p>
                  <span className="status-text">Chance</span>
                </div>
                <div>
                  <h3>Next 3 hours</h3>
                  <p className="precip-value">{formatPercent(wx.precipChance3h)}</p>
                  <span className="status-text">Chance</span>
                </div>
                <div>
                  <h3>24h total</h3>
                  <p className="precip-value">{formatPrecip(wx.precip24h, units)}</p>
                  <span className="status-text">Accumulation</span>
                </div>
              </div>
              <div className="precip-future">
                <div>
                  <h4>Chance at +1h</h4>
                  <p>{formatPercent(precipHour1)}</p>
                </div>
                <div>
                  <h4>Chance at +2h</h4>
                  <p>{formatPercent(precipHour2)}</p>
                </div>
                <div className="precip-chart-card">
                  <h4>5h trend</h4>
                  <PrecipChart
                    values={precipTrend}
                    className="precip-chart"
                    ariaLabel="Precipitation probability trend for the next five hours"
                  />
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      <footer className="status-bar">
        <span className="status-pill">
          Updated {" "}
          <time dateTime={updatedDateTime}>{updatedDisplay}</time>
        </span>
      </footer>
    </div>
  )
}
