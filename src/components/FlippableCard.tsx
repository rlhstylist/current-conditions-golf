import { cloneElement, useState } from "react"
import type { KeyboardEvent, MouseEvent, ReactElement } from "react"

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

type FaceElement = ReactElement<{ className?: string; "aria-hidden"?: boolean; tabIndex?: number }>

type FlippableCardProps = {
  front: FaceElement
  back: FaceElement
  label: string
  className?: string
}

export default function FlippableCard({ front, back, label, className }: FlippableCardProps) {
  const [flipped, setFlipped] = useState(false)

  const handleToggle = () => {
    setFlipped((prev) => !prev)
  }

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null
    if (target?.closest("button, a, input, select, textarea, [data-no-flip]") && target !== event.currentTarget) {
      return
    }
    handleToggle()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      handleToggle()
    }
  }

  const frontEl = cloneElement(front, {
    className: cx(front.props.className, "flip-card-face", "flip-card-front"),
    "aria-hidden": flipped,
    tabIndex: -1,
  })

  const backEl = cloneElement(back, {
    className: cx(back.props.className, "flip-card-face", "flip-card-back"),
    "aria-hidden": !flipped,
    tabIndex: -1,
  })

  return (
    <div className={cx("flip-card-wrapper", className)}>
      <div
        role="button"
        tabIndex={0}
        aria-pressed={flipped}
        aria-label={flipped ? `${label} +1h` : label}
        className={cx("flip-card", flipped && "is-flipped")}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        <div className="flip-card-inner">
          {frontEl}
          {backEl}
          <span className="flip-card-scan" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}
