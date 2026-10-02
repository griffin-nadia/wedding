/** Three paper lanterns with a soft glow, Lantern mode only (Look D). Sway gently; still under reduced motion. */
export function Lanterns() {
  const lanterns = [
    { x: "68%", h: 20, size: 26, delay: "0s" },
    { x: "80%", h: 52, size: 32, delay: "-2s" },
    { x: "91%", h: 8, size: 24, delay: "-4s" },
  ]
  return (
    <div aria-hidden className="lanterns pointer-events-none absolute inset-x-0 top-0 h-48">
      {lanterns.map((l, i) => (
        <span key={i} className="lantern absolute top-0" style={{ left: l.x, animationDelay: l.delay }}>
          <span className="block w-px bg-[var(--yoru-line)]" style={{ height: l.h, marginLeft: l.size / 2 }} />
          <svg viewBox="0 0 40 56" width={l.size} height={l.size * 1.4}>
            <defs>
              <radialGradient id={`glow-${i}`} cx="50%" cy="50%" r="60%">
                <stop offset="0" stopColor="var(--mitsu)" />
                <stop offset=".6" stopColor="var(--kabocha)" />
                <stop offset="1" stopColor="var(--sabi)" />
              </radialGradient>
            </defs>
            <rect x="12" y="0" width="16" height="5" rx="1.5" fill="var(--yoru-line)" />
            <ellipse cx="20" cy="28" rx="18" ry="22" fill={`url(#glow-${i})`} />
            <path d="M5 20h30M3 28h34M5 36h30" stroke="var(--sabi)" strokeOpacity=".45" strokeWidth=".8" />
            <rect x="12" y="49" width="16" height="5" rx="1.5" fill="var(--yoru-line)" />
          </svg>
          <span className="lantern-glow" />
        </span>
      ))}
    </div>
  )
}
