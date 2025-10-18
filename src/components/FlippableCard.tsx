import {
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"

function usePrefersReducedMotion() {
  const [prefers, setPrefers] = useState(() => {
    if (typeof window === "undefined") return false
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
  })

  useEffect(() => {
    if (typeof window === "undefined") return
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = (event: MediaQueryListEvent | MediaQueryList) => {
      setPrefers(event.matches)
    }
    update(media)
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", update)
      return () => media.removeEventListener("change", update)
    }
    media.addListener(update)
    return () => media.removeListener(update)
  }, [])

  return prefers
}

export type FlippableCardProps = {
  front: ReactNode
  back: ReactNode
  label: string
  className?: string
}

export default function FlippableCard({ front, back, label, className }: FlippableCardProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const [flipped, setFlipped] = useState(false)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (!animating || typeof window === "undefined") return
    const id = window.setTimeout(() => setAnimating(false), 320)
    return () => window.clearTimeout(id)
  }, [animating])

  const toggle = useCallback(() => {
    setFlipped((prev) => !prev)
    if (!prefersReducedMotion) {
      setAnimating(true)
    }
  }, [prefersReducedMotion])

  const handleKey = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault()
        toggle()
      }
    },
    [toggle],
  )

  const rootClass = useMemo(() => {
    const classes = ["flippable-card"]
    if (className) classes.push(className)
    if (flipped) classes.push("is-flipped")
    if (animating) classes.push("is-animating")
    return classes.join(" ")
  }, [animating, className, flipped])

  return (
    <div
      className={rootClass}
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      aria-label={label}
      onClick={toggle}
      onKeyDown={handleKey}
    >
      <div className="flippable-card-inner">
        <div className="flippable-card-face flippable-card-front">{front}</div>
        <div className="flippable-card-face flippable-card-back">{back}</div>
      </div>
    </div>
  )
}
