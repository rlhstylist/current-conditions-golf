import { useCallback, useState, type ReactNode } from "react"

export type FlippableControls = {
  flipped: boolean
  toggle: () => void
  showFront: () => void
  showBack: () => void
}

export type FlippableCardProps = {
  front: (controls: FlippableControls) => ReactNode
  back: (controls: FlippableControls) => ReactNode
  className?: string
  ariaLabel?: string
}

export function FlippableCard({ front, back, className = "", ariaLabel }: FlippableCardProps) {
  const [flipped, setFlipped] = useState(false)

  const toggle = useCallback(() => {
    setFlipped((prev) => !prev)
  }, [])
  const showFront = useCallback(() => setFlipped(false), [])
  const showBack = useCallback(() => setFlipped(true), [])

  const controls: FlippableControls = { flipped, toggle, showFront, showBack }

  return (
    <div
      className={["card", "flippable", flipped ? "is-flipped" : "", className].filter(Boolean).join(" ")}
      role="button"
      aria-pressed={flipped}
      aria-label={ariaLabel}
      tabIndex={0}
      onClick={() => toggle()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          toggle()
        }
      }}
    >
      <div className="flippable-inner">
        <div className="flippable-face flippable-front">{front(controls)}</div>
        <div className="flippable-face flippable-back">{back(controls)}</div>
      </div>
    </div>
  )
}
