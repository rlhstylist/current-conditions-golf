import { useCallback, useEffect, useRef, useState } from "react"

type MaybeHeading = number | null

type DeviceOrientationEventWithWebkit = DeviceOrientationEvent & {
  webkitCompassHeading?: number
}

function normalize(deg: number): number {
  if (!Number.isFinite(deg)) return 0
  const wrapped = deg % 360
  return wrapped < 0 ? wrapped + 360 : wrapped
}

export type HeadingStatus = "idle" | "pending" | "granted" | "denied" | "unsupported"

export type HeadingState = {
  heading: MaybeHeading
  status: HeadingStatus
  request: () => void
}

export function useHeading(): HeadingState {
  const [heading, setHeading] = useState<MaybeHeading>(null)
  const [status, setStatus] = useState<HeadingStatus>("unsupported")
  const requestRef = useRef<() => void>(() => {})

  useEffect(() => {
    if (typeof window === "undefined") {
      setStatus("unsupported")
      return
    }

    const DeviceOrientation = window.DeviceOrientationEvent

    if (typeof DeviceOrientation === "undefined") {
      setStatus("unsupported")
      return
    }

    let subscribed = false

    const handle = (event: DeviceOrientationEventWithWebkit) => {
      const { webkitCompassHeading, alpha } = event
      let next: number | null = null

      if (typeof webkitCompassHeading === "number" && Number.isFinite(webkitCompassHeading)) {
        next = webkitCompassHeading
      } else if (typeof alpha === "number" && Number.isFinite(alpha)) {
        // alpha is clockwise from device top to magnetic north; convert to heading
        next = 360 - alpha
      }

      if (next == null) return
      setHeading(normalize(next))
    }

    const subscribe = () => {
      if (subscribed) return
      window.addEventListener("deviceorientation", handle)
      window.addEventListener("deviceorientationabsolute", handle as EventListener)
      subscribed = true
    }

    const unsubscribe = () => {
      if (!subscribed) return
      window.removeEventListener("deviceorientation", handle)
      window.removeEventListener("deviceorientationabsolute", handle as EventListener)
      subscribed = false
    }

    const requestPermission = () => {
      const maybePermission = (DeviceOrientation as typeof DeviceOrientationEvent & {
        requestPermission?: () => Promise<PermissionState>
      }).requestPermission

      if (typeof maybePermission === "function") {
        setStatus("pending")
        maybePermission()
          .then((response) => {
            if (response === "granted") {
              subscribe()
              setStatus("granted")
            } else {
              setStatus("denied")
            }
          })
          .catch(() => {
            setStatus("denied")
          })
      } else {
        subscribe()
        setStatus("granted")
      }
    }

    requestRef.current = requestPermission

    if (typeof (DeviceOrientation as typeof DeviceOrientationEvent & {
      requestPermission?: () => Promise<PermissionState>
    }).requestPermission !== "function") {
      subscribe()
      setStatus("granted")
    } else {
      setStatus("idle")
    }

    return () => {
      unsubscribe()
    }
  }, [])

  const request = useCallback(() => {
    requestRef.current()
  }, [])

  return { heading, status, request }
}
