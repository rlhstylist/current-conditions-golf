import { useId } from "react"
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
  const gradientId = useId()

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
        <defs>
          <linearGradient id={gradientId} x1="0%" x2="0%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.9" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.45" />
          </linearGradient>
        </defs>
        <g stroke="currentColor" strokeLinejoin="bevel" strokeWidth="1.2">
          <path d="M12 1.6L22 12h-5v10.6H7V12H2z" fill={`url(#${gradientId})`} />
          <path d="M12 1.6L2 12h5v10.6h3.2V8.8z" fill="#ffffff" fillOpacity="0.18" stroke="none" />
          <path d="M12 1.6l10 10.4h-4.5v10.6H13V7.4z" fill="#000000" fillOpacity="0.28" stroke="none" />
          <path d="M11.1 14.4h1.8v8.2h-1.8z" fill="#000000" fillOpacity="0.4" />
        </g>
      </svg>
    </span>
  )
}
