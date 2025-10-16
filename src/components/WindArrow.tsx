import { memo } from "react"

type WindArrowProps = {
  deg: number
  label?: string
}

function WindArrowComponent({ deg, label }: WindArrowProps) {
  const rotation = `rotate(${deg}deg)`
  const title = label ?? `Wind ${Math.round(deg)}°`
  return (
    <div className="wind-arrow" title={title} aria-hidden={label ? undefined : true}>
      <svg
        viewBox="0 0 64 64"
        width="28"
        height="28"
        style={{ transform: rotation }}
        role="img"
        aria-label={title}
      >
        <polygon points="32,6 42,26 32,22 22,26" fill="currentColor" />
        <rect x="30" y="22" width="4" height="32" rx="2" fill="currentColor" />
      </svg>
    </div>
  )
}

export const WindArrow = memo(WindArrowComponent)
