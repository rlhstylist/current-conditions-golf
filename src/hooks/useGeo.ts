import { useCallback, useEffect, useRef, useState } from "react"

export type GeoStatus = "idle" | "prompt" | "granted" | "denied" | "error"
export type GeoCoords = { lat: number; lon: number } | null

type Options = {
  timeoutMs?: number
  maximumAgeMs?: number
  enableHighAccuracy?: boolean
}

export function useGeo(options: Options = {}) {
  const { timeoutMs = 8000, maximumAgeMs = 30_000, enableHighAccuracy = true } = options
  const [status, setStatus] = useState<GeoStatus>("idle")
  const [coords, setCoords] = useState<GeoCoords>(null)
  const [err, setErr] = useState<string | null>(null)
  const busy = useRef(false)

  // Probe permission on mount (best-effort)
  useEffect(() => {
    let cancelled = false
    async function probe() {
      if (!("permissions" in navigator)) {
        setStatus("prompt")
        return
      }
      try {
        const res: PermissionStatus = await ((navigator as any).permissions as any).query({ name: "geolocation" })
        if (cancelled) return
        if (res.state === "granted") setStatus("granted")
        else if (res.state === "denied") setStatus("denied")
        else setStatus("prompt")
        res.onchange = () => {
          if (cancelled) return
          const s = (res.state as string)
          setStatus(s === "granted" ? "granted" : s === "denied" ? "denied" : "prompt")
        }
      } catch {
        setStatus("prompt")
      }
    }
    probe()
    return () => { cancelled = true }
  }, [])

  const request = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setStatus("error")
      setErr("Geolocation not supported")
      return
    }
    if (busy.current) return
    busy.current = true
    setErr(null)

    const timer = setTimeout(() => {
      setStatus("error")
      setErr("Timed out")
      busy.current = false
    }, timeoutMs)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timer)
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude })
        setStatus("granted")
        busy.current = false
      },
      (e) => {
        clearTimeout(timer)
        const code = e.code
        if (code === e.PERMISSION_DENIED) setStatus("denied")
        else setStatus("error")
        setErr(e.message)
        busy.current = false
      },
      {
        enableHighAccuracy,
        timeout: timeoutMs,
        maximumAge: maximumAgeMs,
      }
    )
  }, [enableHighAccuracy, maximumAgeMs, timeoutMs])

  return { status, coords, err, request }
}
