import type { SVGProps } from "react"

type PrecipChartProps = {
  values: number[]
  className?: string
  ariaLabel?: string
}

const WIDTH = 100
const HEIGHT = 40

function clamp(value: number) {
  if (!Number.isFinite(value)) return 0
  if (value < 0) return 0
  if (value > 100) return 100
  return value
}

export default function PrecipChart({ values, className, ariaLabel }: PrecipChartProps) {
  const safeValues = values.length ? values : [0, 0, 0, 0, 0]
  const steps = safeValues.length - 1 || 1
  const points = safeValues.map((value, index) => {
    const x = (index / steps) * WIDTH
    const y = HEIGHT - (clamp(value) / 100) * HEIGHT
    return { x, y }
  })

  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ")

  const area = `${points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(" ")} L${points.at(-1)?.x.toFixed(2) ?? WIDTH} ${HEIGHT} L${points[0].x.toFixed(2)} ${HEIGHT} Z`

  const baselineProps: SVGProps<SVGLineElement> = {
    stroke: "currentColor",
    strokeOpacity: 0.25,
    strokeWidth: 0.75,
    strokeDasharray: "2 2",
  }

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width="100%"
      height="100%"
      className={className}
      role="img"
      aria-label={ariaLabel}
      focusable="false"
    >
      <title>{ariaLabel}</title>
      <g>
        <line x1={0} y1={HEIGHT} x2={WIDTH} y2={HEIGHT} {...baselineProps} />
        <line x1={0} y1={HEIGHT / 2} x2={WIDTH} y2={HEIGHT / 2} {...baselineProps} />
      </g>
      <path d={area} fill="currentColor" fillOpacity={0.12} />
      <path d={path} fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {points.map((point, index) => (
        <circle key={index} cx={point.x} cy={point.y} r={2} fill="currentColor" />
      ))}
    </svg>
  )
}
