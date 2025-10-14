import "./App.css"

export default function App() {
  return (
    <div className="app">
      {/* Top bar */}
      <div className="topbar panel">
        <div>
          <span className="brand small">CURRENT CONDITIONS</span><br />
          <span className="course">Nearest course • <span className="small">approx.</span></span>
        </div>
        <div className="toggle small">Units: IMP ▸ MET</div>
      </div>

      {/* Main grid */}
      <div className="grid">
        {/* Wind primary tile */}
        <div className="wind panel">
          <div>
            <div className="speed">12<span className="small"> mph</span></div>
            <div className="gust small">gust 18</div>
          </div>
          <div className="arrow" aria-label="wind direction (approx)"/>
        </div>

        {/* Row of compact tiles */}
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

      {/* Precip chips (bottom) */}
      <div className="chips">
        <div className="chip panel small">24h: 0.12"</div>
        <div className="chip panel small">Next 1h: 0.00"</div>
        <div className="chip panel small">Next 3h: 0.05"</div>
      </div>
    </div>
  )
}
