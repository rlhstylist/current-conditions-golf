import { useId } from "react"
import "./precip-chart.css"

const clamp = (value: number) => {
  if (!Number.isFinite(value)) return 0
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

export default function PrecipChart({ hours, probs }: { hours: Date[]; probs: number[] }) {
  const count = Math.min(5, hours.length, probs.length)
  const gradientId = useId()
  if (count === 0) {
    return (
      <div className="small" aria-live="polite">
        No precipitation forecast data
      </div>
    )
  }

  const items = Array.from({ length: count }, (_, index) => {
    const probability = clamp(probs[index])
    return {
      index,
      probability,
    }
  })

  const viewBoxWidth = 100
  const viewBoxHeight = 60
  const coordinates = items.map(({ index, probability }) => {
    const ratio = count === 1 ? 0.5 : index / (count - 1)
    const x = ratio * viewBoxWidth
    const y = viewBoxHeight - probability * viewBoxHeight
    return { x, y, probability }
  })

  const linePath = coordinates
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ")
  const areaPath =
    coordinates.length === 1
      ? `M 0 ${viewBoxHeight} L ${coordinates[0].x.toFixed(2)} ${coordinates[0].y.toFixed(2)} L ${viewBoxWidth} ${viewBoxHeight} Z`
      : `M 0 ${viewBoxHeight} ${coordinates
          .map((point) => `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
          .join(" ")} L ${viewBoxWidth} ${viewBoxHeight} Z`

  return (
    <div className="precip-chart" role="img" aria-label="Precipitation probability over the next five hours">
      <svg viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`${gradientId}-precip`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(13, 15, 16, 0.2)" />
            <stop offset="100%" stopColor="rgba(13, 15, 16, 0.04)" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width={viewBoxWidth} height={viewBoxHeight} fill={`url(#${gradientId}-precip)`} opacity="0.2" />
        <path d={areaPath} fill="rgba(13, 15, 16, 0.18)" stroke="none" />
        <path d={linePath} fill="none" stroke="rgba(13, 15, 16, 0.6)" strokeWidth="1.5" strokeLinejoin="round" />
        {coordinates.map((point) => (
          <circle
            key={point.x}
            cx={point.x}
            cy={point.y}
            r={1.8}
            fill="rgba(13, 15, 16, 0.8)"
            stroke="rgba(245, 246, 247, 0.9)"
            strokeWidth="0.4"
          />
        ))}
      </svg>
      <div className="precip-chart__labels">
        {items.map(({ index, probability }) => (
          <div key={index} className="precip-chart__label">
            <span className="precip-chart__time small">+{index + 1}h</span>
            <span className="precip-chart__value precip-value">{Math.round(probability * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
