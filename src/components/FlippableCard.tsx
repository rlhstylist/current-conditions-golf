import { useCallback, useState, type KeyboardEvent, type ReactNode } from "react"

export type FlippableCardProps = {
  title: string
  front: ReactNode
  back: ReactNode
  className?: string
}

export default function FlippableCard({ title, front, back, className }: FlippableCardProps) {
  const [flipped, setFlipped] = useState(false)

  const toggle = useCallback(() => {
    setFlipped((prev) => !prev)
  }, [])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault()
        toggle()
      }
    },
    [toggle],
  )

  return (
    <div className={`flip-card${className ? ` ${className}` : ""}${flipped ? " is-flipped" : ""}`}>
      <button
        type="button"
        className="flip-card__button"
        onClick={toggle}
        onKeyDown={handleKeyDown}
        aria-pressed={flipped}
        aria-label={`${title} +1h`}
      >
        <div className="flip-card__inner">
          <div className="flip-card__face flip-card__front">{front}</div>
          <div className="flip-card__face flip-card__back">{back}</div>
        </div>
      </button>
    </div>
  )
}
