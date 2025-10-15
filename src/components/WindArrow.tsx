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
        width={size * 0.72}
        height={size * 0.72}
        style={arrowStyle}
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M24 4 44 24H32v20H16V24H4z"
          fill="currentColor"
        />
      </svg>
    </span>
  )
}
