import { useId, type CSSProperties } from "react"

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
  const rotation = normalize(degrees + 180)
  const id = useId()
  const gradientId = `${id}-grad`
  const strokeId = `${id}-stroke`
  const shadowId = `${id}-shadow`
  const spanStyle: CSSProperties = {
    width: size,
    height: size,
  }
  const arrowStyle: CSSProperties = {
    transform: `rotate(${rotation}deg)`,
  }
  const svgSize = size * 0.82

  return (
    <span
      className={`arrow${className ? ` ${className}` : ""}`}
      role="img"
      aria-label={ariaLabel}
      style={spanStyle}
    >
      <svg
        viewBox="0 0 64 64"
        width={svgSize}
        height={svgSize}
        style={arrowStyle}
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f6f5f3" />
            <stop offset="45%" stopColor="#c8c5c0" />
            <stop offset="100%" stopColor="#6f6b66" />
          </linearGradient>
          <linearGradient id={strokeId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.2)" />
          </linearGradient>
          <filter id={shadowId} x="-40%" y="-40%" width="180%" height="180%" colorInterpolationFilters="sRGB">
            <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="rgba(76,110,255,0.22)" />
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="rgba(0,0,0,0.65)" />
          </filter>
        </defs>
        <g filter={`url(#${shadowId})`}>
          <path d="M32 8 56 32H40v24H24V32H8Z" fill={`url(#${gradientId})`} />
          <path
            d="M32 8 56 32H40v24H24V32H8Z"
            fill="none"
            stroke={`url(#${strokeId})`}
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M24 32 14 32 32 16 50 32H40"
            fill="none"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M24 40v16h16V40"
            fill="none"
            stroke="rgba(255,255,255,0.18)"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      </svg>
    </span>
  )
}
