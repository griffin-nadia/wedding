/**
 * Experiment: fold creases and leaning cards, in the spirit of Lynn Fisher's CSS-only paper. Two creases are layered
 * gradients (a light ridge beside a soft shadow) across a letter; the cards lean back on a 3D tilt and stand up on
 * hover or focus. CSS only; flat and still under reduced motion.
 */
const css = `
.x-folded { position: relative; padding: var(--space-5); border-radius: var(--radius-section); background:
  linear-gradient(to bottom, transparent calc(33.3% - 1px), rgb(255 255 255 / 0.55) calc(33.3% - 1px), rgb(255 255 255 / 0.55) 33.3%, rgb(var(--tint-shadow) / 0.10) 33.3%, transparent calc(33.3% + 14px)),
  linear-gradient(to bottom, transparent calc(66.6% - 1px), rgb(255 255 255 / 0.55) calc(66.6% - 1px), rgb(255 255 255 / 0.55) 66.6%, rgb(var(--tint-shadow) / 0.10) 66.6%, transparent calc(66.6% + 14px)),
  linear-gradient(170deg, rgb(255 255 255 / 0.25), transparent 40%, rgb(var(--tint-shadow) / 0.06)),
  var(--letter-bg); box-shadow: var(--elevation-paper); min-height: 240px; }
.x-lean-row { display: flex; gap: var(--space-4); perspective: 900px; padding-block: var(--space-4); }
.x-lean { flex: 1; min-height: 120px; padding: var(--space-4); border-radius: var(--radius-control); background: var(--brand-paper-bright); color: var(--brand-ink-deep);
  box-shadow: 0 18px 30px -18px rgb(var(--tint-shadow) / 0.5); transform: rotateX(18deg) rotateZ(-1.5deg); transform-origin: bottom; transition: transform var(--duration-base) var(--ease-spring); outline: 2px solid transparent; outline-offset: 2px; }
.x-lean:nth-child(2) { transform: rotateX(12deg) rotateZ(1deg); }
.x-lean:hover, .x-lean:focus-visible { transform: none; }
.x-lean:focus-visible { outline-color: var(--input-focus); }
@media (prefers-reduced-motion: reduce) { .x-lean, .x-lean:nth-child(2) { transform: none; transition: none; } }
`
export default function FoldCreases() {
  return (
    <div className="flex flex-col gap-4">
      <style>{css}</style>
      <div className="x-folded"><p className="heading">Dear Sam and Alex,</p><p className="pt-4">A letter that has been folded in three and opened out again.</p></div>
      <div className="x-lean-row">
        <button type="button" className="x-lean text-left font-label">The day</button>
        <button type="button" className="x-lean text-left font-label">Travel</button>
      </div>
    </div>
  )
}
