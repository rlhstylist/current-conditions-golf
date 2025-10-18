import type { CSSProperties } from "react"

export type PrecipChartProps = {
  values: number[]
  className?: string
}

function clampValues(values: number[]) {
  if (!values.length) return [0, 0, 0, 0, 0]
  const normalized = values.slice(0, 5).map((value) => {
    if (!Number.isFinite(value)) return 0
    if (value < 0) return 0
    if (value > 100) return 100
    return value
  })
  while (normalized.length < 5) {
    normalized.push(normalized[normalized.length - 1] ?? 0)
  }
  return normalized
}

export default function PrecipChart({ values, className }: PrecipChartProps) {
  const points = clampValues(values)
  const maxValue = Math.max(100, ...points)
  const height = 40
  const width = 100
  const step = points.length > 1 ? width / (points.length - 1) : width
  const polyPoints = points
    .map((value, index) => {
      const x = Math.round(index * step * 100) / 100
      const y = Math.round((height - (value / maxValue) * height) * 100) / 100
      return `${x},${y}`
    })
    .join(" ")

  const pathD = `M0,${height} ${polyPoints} ${width},${height}`

  const style: CSSProperties = {
    width: "100%",
    height: "48px",
  }

  const ticks = [0.25, 0.5, 0.75]

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={`precip-chart${className ? ` ${className}` : ""}`}
      role="img"
      aria-label="Precipitation chance for the next five hours"
      style={style}
    >
      <title>Precipitation chance next five hours</title>
      {ticks.map((tick) => {
        const y = height * (1 - tick)
        return (
          <line
            key={tick}
            x1={0}
            y1={y}
            x2={width}
            y2={y}
            stroke="currentColor"
            strokeWidth={0.6}
            opacity={0.18}
          />
        )
      })}
      <path d={pathD} fill="currentColor" opacity={0.08} />
      <polyline
        points={polyPoints}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
