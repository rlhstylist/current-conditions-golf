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
  const gradientId = useId()
  const arrowGradientId = `${gradientId}-arrow`
  const shaftGradientId = `${gradientId}-shaft`
  const shadowId = `${gradientId}-shadow`
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
      <span className="arrow-tilt">
        <svg
          viewBox="0 0 24 24"
          width={size * 0.62}
          height={size * 0.62}
          style={arrowStyle}
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <linearGradient id={arrowGradientId} x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fafafa" />
              <stop offset="45%" stopColor="#d7d9dd" />
              <stop offset="100%" stopColor="#70747c" />
            </linearGradient>
            <linearGradient id={shaftGradientId} x1="12" y1="9" x2="12" y2="22" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f0f0f0" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#3b3f46" stopOpacity="0.95" />
            </linearGradient>
            <filter id={shadowId} x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="10" stdDeviation="5" floodColor="rgba(0, 0, 0, 0.65)" />
            </filter>
          </defs>
          <g filter={`url(#${shadowId})`}>
            <path
              d="M12 2l7.4 10.8h-4.4V22H9V12.8H4.6L12 2z"
              fill={`url(#${arrowGradientId})`}
            />
            <path
              d="M12 2l-5.6 8.1h3.2V22h2.8V10.1h4.1L12 2z"
              fill={`url(#${shaftGradientId})`}
              opacity="0.8"
            />
            <path
              d="M12 2l5 7.3h-1.4L12 4.2 8.4 9.3H7L12 2z"
              fill="rgba(255, 255, 255, 0.3)"
            />
          </g>
        </svg>
      </span>
    </span>
  )
}
