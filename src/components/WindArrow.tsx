export function WindArrow({ deg, label }: { deg: number; label?: string }) {
  const rot = `rotate(${deg}deg)`
  return (
    <div className="arrow" title={label ?? `Wind ${Math.round(deg)}°`}>
      <svg viewBox="0 0 64 64" width="28" height="28" style={{ transform: rot }}>
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e7e7e7" />
            <stop offset="1" stopColor="#bdbdbd" />
          </linearGradient>
        </defs>
        <polygon points="32,6 42,26 32,22 22,26" fill="url(#g)" />
        <rect x="30" y="22" width="4" height="32" rx="2" fill="#cfcfcf" />
      </svg>
    </div>
  )
}

