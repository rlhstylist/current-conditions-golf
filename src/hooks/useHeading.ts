import { useEffect, useState } from "react"

type MaybeHeading = number | null

type DeviceOrientationEventWithWebkit = DeviceOrientationEvent & {
  webkitCompassHeading?: number
}

function normalize(deg: number): number {
  if (!Number.isFinite(deg)) return 0
  const wrapped = deg % 360
  return wrapped < 0 ? wrapped + 360 : wrapped
}

export function useHeading(): MaybeHeading {
  const [heading, setHeading] = useState<MaybeHeading>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const DeviceOrientation = window.DeviceOrientationEvent
    if (typeof DeviceOrientation === "undefined") return

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

    const maybeRequestPermission = () => {
      const requestPermission = (DeviceOrientation as typeof DeviceOrientationEvent & {
        requestPermission?: () => Promise<PermissionState>
      }).requestPermission

      if (typeof requestPermission === "function") {
        requestPermission()
          .then((response) => {
            if (response === "granted") {
              subscribe()
            }
          })
          .catch(() => {
            // If the promise rejects, attempt to subscribe anyway for non-iOS browsers
            subscribe()
          })
      } else {
        subscribe()
      }
    }

    maybeRequestPermission()

    return () => {
      unsubscribe()
    }
  }, [])

  return heading
}
