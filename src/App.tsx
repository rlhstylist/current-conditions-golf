import { useEffect, useMemo, useState } from "react"
import "./index.css"
import Modal from "./components/Modal"
import { useGeo } from "./hooks/useGeo"
import { loadCourse, saveCourse, pickNearest, searchByName } from "./hooks/useCourse"
import { getWeather } from "./hooks/useWeather"
import { Units, formatSpeed, formatTemp, formatDir, formatPrecip } from "./utils/units"

type Course = { name:string; lat:number; lon:number }

export default function App(){
  const [units, setUnits] = useState<Units>(() => (localStorage.getItem("ccg_units_v1") as Units) || "imperial")
  const [geo, requestGeo] = useGeo()
  const [course, setCourse] = useState<Course | undefined>(() => loadCourse().course)
  const [manual, setManual] = useState<boolean>(() => loadCourse().manual ?? false)
  const [wx, setWx] = useState<any>(null)
  const [updatedAt, setUpdatedAt] = useState<string>("—")

  useEffect(()=> { localStorage.setItem("ccg_units_v1", units) }, [units])

  // Acquire nearest course when GPS granted and none selected
  useEffect(()=>{
    const go = async ()=>{
      if (!course && geo.status==="granted" && geo.coords){
        const hit = await pickNearest(geo.coords.lat, geo.coords.lon)
        if (hit){ setCourse(hit); setManual(false) }
      }
    }
    go()
  }, [geo.status])

  // Weather fetch when course set
  async function refresh(){
    const c = course
    if (!c) return
    const d = await getWeather(c.lat, c.lon)
    setWx(d)
    const now = new Date()
    setUpdatedAt(`${now.getHours().toString().padStart(2,"0")}:${now.getMinutes().toString().padStart(2,"0")}:${now.getSeconds().toString().padStart(2,"0")}`)
  }
  useEffect(()=>{ refresh() }, [course])

  // Modal state for manual selection
  const [openModal, setOpenModal] = useState(false)
  const [q, setQ] = useState("")
  const [results, setResults] = useState<Course[]>([])
  async function runSearch(){
    const center = geo.coords
    const hits = await searchByName(q.trim(), center?.lat, center?.lon)
    setResults(hits)
  }
  function choose(c:Course){
    setCourse(c); setManual(true); saveCourse({ course:c, manual:true }); setOpenModal(false)
  }

  const windSpeed = formatSpeed(wx?.windSpeed ?? null, units)
  const windGust  = formatSpeed(wx?.windGust ?? null, units)
  const windDir   = formatDir(wx?.windDir ?? null)
  const temp      = formatTemp(wx?.tempC ?? null, units)
  const feels     = formatTemp(wx?.feelsC ?? null, units)
  const temp1h    = formatTemp(wx?.nextHour?.tempC ?? null, units)
  const feels1h   = formatTemp(wx?.nextHour?.feelsC ?? null, units)
  const humidity  = wx?.humidity!=null ? `${Math.round(wx.humidity)}%` : "—"
  const humidity1h= wx?.nextHour?.humidity!=null ? `${Math.round(wx.nextHour.humidity)}%` : "—"
  const uv        = wx?.uv!=null ? `${Math.round(wx.uv)}` : "—"
  const uv1h      = wx?.nextHour?.uv!=null ? `${Math.round(wx.nextHour.uv)}` : "—"
  const cloud     = wx?.cloud!=null ? `${Math.round(wx.cloud)}%` : "—"
  const cloud1h   = wx?.nextHour?.cloud!=null ? `${Math.round(wx.nextHour.cloud)}%` : "—"
  const p1h       = formatPrecip(wx?.precipNext1hMm ?? null, units)
  const p3h       = formatPrecip(wx?.precipNext3hMm ?? null, units)
  const p24       = formatPrecip(wx?.precip24hMm ?? null, units)

  return (
    <div className="screen">
      {/* TOP BAR */}
      <div className="topbar">
        <div className="title">Current Conditions Golf</div>
        <div style={{display:"flex", gap:8, alignItems:"center"}}>
          <button className="btn" onClick={() => setUnits(u => u==="imperial"?"metric":"imperial")}>
            {units==="imperial" ? "°F / mph" : "°C / m·s⁻¹"}
          </button>
          <button className="btn" onClick={refresh}>Refresh</button>
          <button className="btn" onClick={() => setOpenModal(true)}>Course</button>
        </div>
      </div>

      {/* WIND */}
      <div className="card wind">
        <div>
          <div className="big">{windSpeed} <span className="sub">wind</span></div>
          <div className="sub">Gust {windGust} • Dir {windDir}</div>
        </div>
        <div className="center-note">{course?.name ?? "No course"}</div>
      </div>

      {/* TILES */}
      <div className="tiles">
        <div className="tile">
          <div className="label">Temp</div>
          <div className="val">{temp}</div>
          <div className="delta">in 1h: {temp1h}</div>
        </div>
        <div className="tile">
          <div className="label">Feels</div>
          <div className="val">{feels}</div>
          <div className="delta">in 1h: {feels1h}</div>
        </div>
        <div className="tile">
          <div className="label">Humidity</div>
          <div className="val">{humidity}</div>
          <div className="delta">in 1h: {humidity1h}</div>
        </div>
        <div className="tile">
          <div className="label">UV + Cloud</div>
          <div className="val">{uv} / {cloud}</div>
          <div className="delta">in 1h: {uv1h} / {cloud1h}</div>
        </div>
        <div className="tile">
          <div className="label">Course</div>
          <div className="val">{course?.name ?? "—"}</div>
          <div className="delta">{manual ? "manual" : (geo.status==="granted"?"GPS":"")}</div>
        </div>
        <div className="tile">
          <div className="label">Last updated</div>
          <div className="val">{updatedAt}</div>
          <div className="delta">local time</div>
        </div>
      </div>

      {/* PRECIP CHIPS */}
      <div className="chips">
        <div className="chip">24h precip: {p24}</div>
        <div className="chip">Next 1h: {p1h}</div>
        <div className="chip">Next 3h: {p3h}</div>
      </div>

      {/* PROMPTS */}
      {geo.status!=="granted" && (
        <div className="center-note">
          <button className="btn" onClick={requestGeo}>Enable Location</button>
          <span style={{marginLeft:8}} />
          <button className="btn" onClick={()=> setOpenModal(true)}>Search Course Manually</button>
        </div>
      )}

      {/* Modal for manual course selection */}
      <Modal open={openModal} onClose={()=>setOpenModal(false)}>
        <div style={{display:"grid", gap:10}}>
          <div style={{fontWeight:700}}>Find a course</div>
          <input
            value={q}
            onChange={e=>setQ((e.target as HTMLInputElement).value)}
            placeholder="Course name (optionally city/state)"
            style="background:#0f0f0f;border:1px solid #2a2a2a;color:#e6e6e6;border-radius:8px;padding:8px"
          />
          <div style={{display:"flex", gap:8}}>
            <button className="btn" onClick={runSearch}>Search</button>
            <button className="btn" onClick={()=>setOpenModal(false)}>Close</button>
          </div>
          <div style={{maxHeight:"40vh", overflow:"auto", display:"grid", gap:6}}>
            {results.length===0 && <div className="center-note">No results yet.</div>}
            {results.map((r,i)=>(
              <button key={i} className="btn" onClick={()=>choose(r)}>
                {r.name} · {r.lat.toFixed(4)}, {r.lon.toFixed(4)}
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  )
}
