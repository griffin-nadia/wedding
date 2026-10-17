import { useState } from "react"

/**
 * Experiment: an ink-blot reveal on a photo. The photo shows through an SVG mask: three blots whose edges are
 * roughened by turbulence grow until they cover it (900 ms). Tap to run it again. Under reduced motion the photo is
 * simply there. Self-contained: one svg, one photo (their Kyoto scene, which the dev server always has).
 */
const css = `
.x-blot { display: block; width: 100%; max-width: 420px; border-radius: var(--radius-control); background: var(--surface-alt); }
.x-blot circle { transform-box: fill-box; transform-origin: center; transform: scale(0); animation: x-blot 900ms var(--ease-paper) forwards; }
.x-blot circle:nth-child(2) { animation-delay: 120ms; } .x-blot circle:nth-child(3) { animation-delay: 240ms; }
@keyframes x-blot { to { transform: scale(1); } }
@media (prefers-reduced-motion: reduce) { .x-blot circle { animation: none; transform: none; } }
`
export default function InkBlot() {
  const [n, setN] = useState(1)
  const src = `${import.meta.env.BASE_URL}scenes/kyoto-view-1200.webp`
  return (
    <div className="flex flex-col gap-3">
      <style>{css}</style>
      <svg key={n} viewBox="0 0 400 300" className="x-blot" role="img" aria-label="Griffin and Nadia above Kyoto, revealed as if ink were spreading">
        <defs>
          <filter id="x-ink" x="-20%" y="-20%" width="140%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" /><feDisplacementMap in="SourceGraphic" scale="34" /></filter>
          <mask id="x-blot-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="300">
            <g filter="url(#x-ink)"><circle cx="140" cy="130" r="170" fill="#fff" /><circle cx="290" cy="200" r="150" fill="#fff" /><circle cx="220" cy="60" r="120" fill="#fff" /></g>
          </mask>
        </defs>
        <image href={src} x="0" y="0" width="400" height="300" preserveAspectRatio="xMidYMid slice" mask="url(#x-blot-mask)" />
      </svg>
      <button type="button" className="btn-text self-start" onClick={() => setN(n + 1)}>Run it again</button>
    </div>
  )
}
