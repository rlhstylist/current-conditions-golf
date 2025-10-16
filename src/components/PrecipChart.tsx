type PrecipChartProps = {
  values: number[]
  ariaLabel?: string
  className?: string
}

function clamp(value: number) {
  if (!Number.isFinite(value)) return 0
  if (value < 0) return 0
  if (value > 100) return 100
  return value
}

export default function PrecipChart({ values, ariaLabel, className }: PrecipChartProps) {
  const data = values.length ? values.map(clamp) : [0]
  const count = data.length
  const step = count > 1 ? 100 / (count - 1) : 0

  const points = data
    .map((value, index) => {
      const x = count > 1 ? step * index : 50
      const y = 100 - value
      return `${x},${y}`
    })
    .join(" ")

  return (
    <svg
      role="img"
      aria-label={ariaLabel}
      viewBox="0 0 100 100"
      className={`precip-chart${className ? ` ${className}` : ""}`}
      focusable="false"
    >
      <line className="precip-chart-baseline" x1="0" y1="92" x2="100" y2="92" />
      {count > 1 && <polyline className="precip-chart-line" points={points} />} 
      {data.map((value, index) => {
        const x = count > 1 ? step * index : 50
        const y = 100 - value
        return <circle key={index} className="precip-chart-dot" cx={x} cy={y} r={2.4} />
      })}
    </svg>
  )
}
