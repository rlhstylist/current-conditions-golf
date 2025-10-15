import type { CSSProperties } from "react"

export type WindArrowProps = {
  degrees: number
  size?: number
  className?: string
  ariaLabel?: string
}

function normalize(deg: number) {
  if (!Number.isFinite(deg)) return 0
  const wrapped = deg % 360
  return wrapped < 0 ? wrapped + 360 : wrapped
}

export default function WindArrow({ degrees, size = 44, className, ariaLabel }: WindArrowProps) {
  const rotation = normalize(degrees)
  const spanStyle: CSSProperties = {
    width: size,
    height: size,
  }
  const arrowStyle: CSSProperties = {
    transform: `rotate(${rotation}deg)`,
  }

  return (
    <span
      className={`arrow${className ? ` ${className}` : ""}`}
      role="img"
      aria-label={ariaLabel}
      style={spanStyle}
    >
      <svg
        viewBox="0 0 24 24"
        width={size * 0.68}
        height={size * 0.68}
        style={arrowStyle}
        aria-hidden="true"
        focusable="false"
      >
        <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="miter" strokeLinecap="square">
          <path d="M12 3l6 7h-4v11h-4V10H6l6-7z" fill="currentColor" />
          <path d="M12 3v18" />
          <path d="M8.5 12.5l3.5-4 3.5 4" />
        </g>
      </svg>
    </span>
  )
}
