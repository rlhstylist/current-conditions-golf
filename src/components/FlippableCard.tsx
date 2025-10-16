import { useState, type KeyboardEvent, type ReactNode } from "react"
import "./flippable.css"

type Props = {
  ariaLabel: string
  front: () => ReactNode
  back: () => ReactNode
  className?: string
}

export default function FlippableCard({ ariaLabel, front, back, className }: Props) {
  const [flipped, setFlipped] = useState(false)

  const toggle = () => {
    setFlipped((prev) => !prev)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      toggle()
    }
  }

  const classes = ["flip-card"]
  if (flipped) classes.push("is-flipped")
  if (className) classes.push(className)

  return (
    <div
      className={classes.join(" ")}
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      aria-label={ariaLabel}
      onClick={toggle}
      onKeyDown={handleKeyDown}
    >
      <div className="flip-card__inner">
        <div className="flip-card__face flip-card__front">{front()}</div>
        <div className="flip-card__face flip-card__back invert-theme">
          <div className="flip-glitch" aria-hidden />
          {back()}
        </div>
      </div>
    </div>
  )
}
