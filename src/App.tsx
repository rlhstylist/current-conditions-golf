import { useState, useEffect } from "react"
import "./index.css"

type Units = "imperial" | "metric"

export default function App() {
  const [units, setUnits] = useState<Units>("imperial")
  const [updatedAt, setUpdatedAt] = useState<string>("—")

  // Placeholder refresh; later we’ll wire real fetch + timestamps
  const refresh = () => {
    const now = new Date()
    const hh = String(now.getHours()).padStart(2, "0")
    const mm = String(now.getMinutes()).padStart(2, "0")
    const ss = String(now.getSeconds()).padStart(2, "0")
    setUpdatedAt(`${hh}:${mm}:${ss}`)
  }

  useEffect(() => { refresh() }, [])

  return (
    <div className="screen">
      {/* TOP BAR */}
      <div className="topbar">
        <div className="title">Current Conditions Golf</div>
        <div style={{display:"flex", gap:8, alignItems:"center"}}>
          <button className="btn" onClick={() => setUnits(u => u === "imperial" ? "metric" : "imperial")}>
            {units === "imperial" ? "°F / mph" : "°C / m·s⁻¹"}
          </button>
          <button className="btn" onClick={refresh}>Refresh</button>
        </div>
      </div>

      {/* WIND */}
      <div className="card wind">
        <div>
          <div className="big">— <span className="sub">mph</span></div>
          <div className="sub">Gust — mph • Dir —°</div>
        </div>
        <div className="center-note">arrow</div>
      </div>

      {/* TILES */}
      <div className="tiles">
        <div className="tile">
          <div className="label">Temp</div>
          <div className="val">—</div>
          <div className="delta">in 1h: —</div>
        </div>
        <div className="tile">
          <div className="label">Feels</div>
          <div className="val">—</div>
          <div className="delta">in 1h: —</div>
        </div>
        <div className="tile">
          <div className="label">Humidity</div>
          <div className="val">— %</div>
          <div className="delta">in 1h: —</div>
        </div>
        <div className="tile">
          <div className="label">UV + Cloud</div>
          <div className="val">— / —%</div>
          <div className="delta">in 1h: —</div>
        </div>
        <div className="tile">
          <div className="label">Course</div>
          <div className="val">—</div>
          <div className="delta">GPS / manual</div>
        </div>
        <div className="tile">
          <div className="label">Last updated</div>
          <div className="val">{updatedAt}</div>
          <div className="delta">local time</div>
        </div>
      </div>

      {/* PRECIP CHIPS */}
      <div className="chips">
        <div className="chip">24h precip: —</div>
        <div className="chip">Next 1h: —</div>
        <div className="chip">Next 3h: —</div>
      </div>

      {/* build-safe hint while data is pending */}
      <div className="center-note">
        (Live geolocation, Overpass course lookup, and Open-Meteo will be wired next.)
      </div>
    </div>
  )
}
