import { useEffect, useState } from "react"

export type GeoState =
  | { status: "prompt" | "denied"; coords?: undefined }
  | { status: "granted"; coords: { lat: number; lon: number } }

export function useGeo() {
  const [geo, setGeo] = useState<GeoState>({ status: "prompt" })

  useEffect(() => {
    // Probe permission (best-effort)
    const perms = (navigator as any).permissions
    if (perms?.query) {
      perms.query({ name: "geolocation" as any })
        .then((p: any) => setGeo((g) => (g.status === "granted" ? g : { status: p.state as "prompt" | "denied" })))
        .catch(() => {})
    }
  }, [])

  const request = () =>
    new Promise<GeoState>((resolve) => {
      if (!("geolocation" in navigator)) {
        const v = { status: "denied" as const }
        setGeo(v); resolve(v); return
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const v: GeoState = { status: "granted", coords: { lat: pos.coords.latitude, lon: pos.coords.longitude } }
          setGeo(v); resolve(v)
        },
        () => { const v = { status: "denied" as const }; setGeo(v); resolve(v) },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 }
      )
    })

  return { geo, request }
}
