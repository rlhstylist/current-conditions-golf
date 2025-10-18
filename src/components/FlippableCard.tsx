import { useCallback, useState, type ReactNode, type MouseEvent, type KeyboardEvent } from "react"

export type FlippableCardProps = {
  front: ReactNode
  back: ReactNode
  faceClassName: string
  backFaceClassName?: string
  containerClassName?: string
  label: string
}

function shouldToggle(target: EventTarget | null) {
  if (!(target instanceof Element)) return true
  const interactive = target.closest("button, a, input, select, textarea, [role='button'], [role='link']")
  return !interactive
}

export default function FlippableCard({
  front,
  back,
  faceClassName,
  backFaceClassName,
  containerClassName,
  label,
}: FlippableCardProps) {
  const [flipped, setFlipped] = useState(false)

  const toggle = useCallback(() => {
    setFlipped((value) => !value)
  }, [])

  const handleClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (!shouldToggle(event.target)) return
      toggle()
    },
    [toggle],
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!shouldToggle(event.target)) return
      if (event.key === "Enter") {
        event.preventDefault()
        toggle()
      } else if (event.key === " ") {
        event.preventDefault()
        toggle()
      }
    },
    [toggle],
  )

  const backClassName = backFaceClassName ?? faceClassName

  return (
    <div
      className={`flip-card${containerClassName ? ` ${containerClassName}` : ""}`}
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      aria-label={label}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div className="flip-card-inner" data-flipped={flipped}>
        <div className={`flip-card-face flip-card-front ${faceClassName}`}>{front}</div>
        <div className={`flip-card-face flip-card-back ${backClassName}`}>{back}</div>
      </div>
    </div>
  )
}
