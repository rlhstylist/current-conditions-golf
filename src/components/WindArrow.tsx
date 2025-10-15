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
        viewBox="0 0 48 48"
        width={size * 0.7}
        height={size * 0.7}
        style={arrowStyle}
        aria-hidden="true"
        focusable="false"
      >
        <g stroke="currentColor" strokeWidth="2" strokeLinejoin="miter">
          <path d="M24 4 40 20h-9v20H17V20H8z" fill="currentColor" />
          <path d="M24 4 8 20h9v20h7V12z" fill="currentColor" fillOpacity="0.5" />
          <path d="M24 4l16 16h-9v20h-7V12z" fill="currentColor" fillOpacity="0.25" />
          <path d="M20 24h8v16h-8z" fill="currentColor" />
        </g>
      </svg>
    </span>
  )
}
