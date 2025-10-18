import { useId, useMemo } from "react"

export type PrecipChartProps = {
  values: number[]
  className?: string
  ariaLabel?: string
}

const HEIGHT = 44
const WIDTH = 120

export default function PrecipChart({ values, className, ariaLabel }: PrecipChartProps) {
  const gradientId = useId()

  const { path, points } = useMemo(() => {
    if (!values.length) {
      return { path: "", points: [] as Array<{ x: number; y: number }> }
    }

    const clamped = values.map((v) => Math.max(0, Math.min(100, Number.isFinite(v) ? v : 0)))
    const count = clamped.length
    const step = count > 1 ? WIDTH / (count - 1) : 0
    const mapped = clamped.map((value, index) => {
      const x = index * step
      const y = HEIGHT - (value / 100) * HEIGHT
      return { x, y }
    })

    const d = mapped
      .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`)
      .join(" ")

    return { path: d, points: mapped }
  }, [values])

  return (
    <svg
      className={className}
      role="img"
      aria-label={ariaLabel}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width="100%"
      height={HEIGHT}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <rect width={WIDTH} height={HEIGHT} fill={`url(#${gradientId})`} rx="4" ry="4" />
      <line x1="0" x2={WIDTH} y1={HEIGHT} y2={HEIGHT} stroke="currentColor" strokeOpacity="0.16" strokeWidth="1" />
      <line x1="0" x2={WIDTH} y1={HEIGHT / 2} y2={HEIGHT / 2} stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />
      {path && (
        <path
          d={path}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {points.map((point, index) => (
        <circle key={index} cx={point.x} cy={point.y} r={2.6} fill="currentColor" opacity={0.85} />
      ))}
    </svg>
  )
}
