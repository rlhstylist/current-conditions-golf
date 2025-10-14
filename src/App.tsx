import "./App.css"

      $items = ($matches[1] -split '\s*,\s*') | Where-Object { import "./App.css"
import { useEffect, useMemo, useState } from "react"
import Modal from "./components/Modal"
import { getPrefs, setPrefs } from "./lib/storage"

import { useGeo } from "./hooks/useGeo"

export default function App() {
  const prefs = useMemo(() => getPrefs(), [])
  const [courseName, setCourseName] = useState<string>(prefs.courseName ?? "")
  const [manual, setManual] = useState<boolean>(prefs.manualCourse ?? false)

  // Geolocation
  const geo = useGeo({ timeoutMs: 7000 })

  // Show modal when user denied OR when we have no course yet and geo is not granted
  const needModal = (geo.status === "denied" || geo.status === "error" || geo.status === "prompt") && (!courseName || manual)

  // Persist when these change
  useEffect(() => {
    setPrefs({ courseName, manualCourse: manual })
  }, [courseName, manual])

  // If geo granted and we have coords but no manual course, show a generic placeholder course label
  useEffect(() => {
    if (geo.status === "granted" && geo.coords && !manual) {
      // (#6 will replace this with Overpass lookup)
      setCourseName("Nearest course (auto)")
    }
  }, [geo.status, geo.coords, manual])

  // Modal fields
  const [query, setQuery] = useState("")

  function useThisCourse() {
    const name = query.trim() || "Custom course"
    setCourseName(name)
    setManual(true)
  }

  function clearManual() {
    setManual(false)
    // Trigger geo request again to try automatic
    geo.request()
  }

    // Auto-course lookup via Overpass when GPS is granted and not manual
  useEffect(() => {
    let cancelled = false
    async function run() {
      if (manual) return
      if (geo.status !== "granted" || !geo.coords) return
      const mod = await import("./lib/overpass")
      const hit = await mod.findNearestCourse(geo.coords.lat, geo.coords.lon)
      if (cancelled) return
      if (hit?.name) setCourseName(hit.name)
    }
    run()
    return () => { cancelled = true }
  }, [manual, geo.status, geo.coords])
  return (
    <div className="app">
      {/* Top bar */}
      <div className="topbar panel">
        <div>
          <span className="brand small">CURRENT CONDITIONS</span><br />
          <span className="course">
            {courseName ? courseName : "Finding course…"}
            <span className="small"> {manual ? "(manual)" : "(auto)"}</span>
          </span>
        </div>
        <div className="inline">
          <button className="btn small" onClick={() => geo.request()}>Enable GPS</button>
          <button className="btn small" onClick={() => { setManual(true) }}>Set course</button>
          <div className="toggle small">Units: IMP ▸ MET</div>
        </div>
      </div>

      {/* Main grid (from Issue #4) */}
      <div className="grid">
        <div className="wind panel">
          <div>
            <div className="speed">12<span className="small"> mph</span></div>
            <div className="gust small">gust 18</div>
          </div>
          <div className="arrow" aria-label="wind direction (approx)"/>
        </div>

        <div className="tiles">
          <div className="tile panel">
            <div className="value">72°</div>
            <div className="label">Temp / Feels</div>
          </div>
          <div className="tile panel">
            <div className="value">58%</div>
            <div className="label">Humidity</div>
          </div>
          <div className="tile panel">
            <div className="value">6 / 40%</div>
            <div className="label">UV / Cloud</div>
          </div>
        </div>
      </div>

      <div className="chips">
        <div className="chip panel small">24h: 0.12"</div>
        <div className="chip panel small">Next 1h: 0.00"</div>
        <div className="chip panel small">Next 3h: 0.05"</div>
      </div>

      {/* Deny-case / first-run modal */}
      <Modal
        open={needModal}
        onClose={() => {/* keep open until user picks or GPS granted */}}
        title="Location permission denied (or unavailable)"
      >
        <div className="small">
          You can set a course manually. Later, re-enable GPS to switch back to automatic.
        </div>
        <input
          data-autofocus
          className="input"
          placeholder="Search or type course name…"
          value={query}
          onChange={(e) => setQuery((e.target as HTMLInputElement).value)}
        />
        <div className="inline">
          <button className="btn primary" onClick={useThisCourse}>Use this course</button>
          <button className="btn" onClick={clearManual}>Try GPS again</button>
        </div>
      </Modal>
    </div>
  )
}

 -ne '' }
      if ($items -notcontains 'useEffect') { $items += 'useEffect' }
      "import { " + ($items -join ', ') + " } from 'react';"
    
import Modal from "./components/Modal"
import { getPrefs, setPrefs } from "./lib/storage"

import { useGeo } from "./hooks/useGeo"

export default function App() {
  const prefs = useMemo(() => getPrefs(), [])
  const [courseName, setCourseName] = useState<string>(prefs.courseName ?? "")
  const [manual, setManual] = useState<boolean>(prefs.manualCourse ?? false)

  // Geolocation
  const geo = useGeo({ timeoutMs: 7000 })

  // Show modal when user denied OR when we have no course yet and geo is not granted
  const needModal = (geo.status === "denied" || geo.status === "error" || geo.status === "prompt") && (!courseName || manual)

  // Persist when these change
  useEffect(() => {
    setPrefs({ courseName, manualCourse: manual })
  }, [courseName, manual])

  // If geo granted and we have coords but no manual course, show a generic placeholder course label
  useEffect(() => {
    if (geo.status === "granted" && geo.coords && !manual) {
      // (#6 will replace this with Overpass lookup)
      setCourseName("Nearest course (auto)")
    }
  }, [geo.status, geo.coords, manual])

  // Modal fields
  const [query, setQuery] = useState("")

  function useThisCourse() {
    const name = query.trim() || "Custom course"
    setCourseName(name)
    setManual(true)
  }

  function clearManual() {
    setManual(false)
    // Trigger geo request again to try automatic
    geo.request()
  }

    // Auto-course lookup via Overpass when GPS is granted and not manual
  useEffect(() => {
    let cancelled = false
    async function run() {
      if (manual) return
      if (geo.status !== "granted" || !geo.coords) return
      const mod = await import("./lib/overpass")
      const hit = await mod.findNearestCourse(geo.coords.lat, geo.coords.lon)
      if (cancelled) return
      if (hit?.name) setCourseName(hit.name)
    }
    run()
    return () => { cancelled = true }
  }, [manual, geo.status, geo.coords])
  return (
    <div className="app">
      {/* Top bar */}
      <div className="topbar panel">
        <div>
          <span className="brand small">CURRENT CONDITIONS</span><br />
          <span className="course">
            {courseName ? courseName : "Finding course…"}
            <span className="small"> {manual ? "(manual)" : "(auto)"}</span>
          </span>
        </div>
        <div className="inline">
          <button className="btn small" onClick={() => geo.request()}>Enable GPS</button>
          <button className="btn small" onClick={() => { setManual(true) }}>Set course</button>
          <div className="toggle small">Units: IMP ▸ MET</div>
        </div>
      </div>

      {/* Main grid (from Issue #4) */}
      <div className="grid">
        <div className="wind panel">
          <div>
            <div className="speed">12<span className="small"> mph</span></div>
            <div className="gust small">gust 18</div>
          </div>
          <div className="arrow" aria-label="wind direction (approx)"/>
        </div>

        <div className="tiles">
          <div className="tile panel">
            <div className="value">72°</div>
            <div className="label">Temp / Feels</div>
          </div>
          <div className="tile panel">
            <div className="value">58%</div>
            <div className="label">Humidity</div>
          </div>
          <div className="tile panel">
            <div className="value">6 / 40%</div>
            <div className="label">UV / Cloud</div>
          </div>
        </div>
      </div>

      <div className="chips">
        <div className="chip panel small">24h: 0.12"</div>
        <div className="chip panel small">Next 1h: 0.00"</div>
        <div className="chip panel small">Next 3h: 0.05"</div>
      </div>

      {/* Deny-case / first-run modal */}
      <Modal
        open={needModal}
        onClose={() => {/* keep open until user picks or GPS granted */}}
        title="Location permission denied (or unavailable)"
      >
        <div className="small">
          You can set a course manually. Later, re-enable GPS to switch back to automatic.
        </div>
        <input
          data-autofocus
          className="input"
          placeholder="Search or type course name…"
          value={query}
          onChange={(e) => setQuery((e.target as HTMLInputElement).value)}
        />
        <div className="inline">
          <button className="btn primary" onClick={useThisCourse}>Use this course</button>
          <button className="btn" onClick={clearManual}>Try GPS again</button>
        </div>
      </Modal>
    </div>
  )
}


