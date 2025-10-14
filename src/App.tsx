import React, { useEffect, useState } from "react";
import "./App.css";

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Placeholder: we’ll re-introduce geo/course/weather logic in follow-up issues
    setReady(true);
  }, []);

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <div style={{ textAlign: "center", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" }}>
        <h1 style={{ marginBottom: 8 }}>Current Conditions Golf</h1>
        <p>{ready ? "Build-safe placeholder loaded." : "Initializing…"}</p>
        <p style={{ opacity: 0.7, fontSize: 12 }}>
          (We’ll wire up geolocation, nearest golf course, Open-Meteo, and UI tiles in later issues.)
        </p>
      </div>
    </div>
  );
}
