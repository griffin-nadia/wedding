/* eslint-disable react-refresh/only-export-components -- the opening area's shared pieces, not a page */
import { ART } from "@/lib/art"
import { NamesArt } from "@/components/names-art"

/**
 * The opening area's shared pieces (lab run 19): Nadia's envelope (18 Oct) cut into the parts paper really has, on
 * one frame the size of her open back (410 × 476):
 * - body: the open back below the hinge (the back panel and its inside)
 * - flapOpen: the open back above the hinge (the flap standing up)
 * - flapClosed: her closed envelope's flap triangle, maple and gum leaf included
 * - front: the pocket and the wax seal
 * The hinge is the closed envelope's top edge: 180 / 476 of the frame. The seal sits on the pocket in both of her
 * drawings, so it stays put while the flap turns.
 */
const base = import.meta.env.BASE_URL
export const art = (k: "closed" | "open" | "openFront", w: 410 | 820 = 820) => `${base}${ART.drawnEnvelope[k]}-${w}.webp`
export const HINGE = 180 / 476 // of the frame's height
export const FRAME_RATIO = 410 / 476

export const envelopeCss = (p: string) => `
@property --bend { syntax: "<number>"; inherits: false; initial-value: 0; }
.${p}-env { position: relative; width: min(76vw, 340px); aspect-ratio: ${FRAME_RATIO}; perspective: 1100px; perspective-origin: 50% 30%; }
.${p}-env img, .${p}-env .${p}-part { position: absolute; left: 0; width: 100%; pointer-events: none; user-select: none; -webkit-user-drag: none; }
.${p}-body { top: 0; height: 100%; z-index: 1; clip-path: inset(${(HINGE * 100).toFixed(2)}% 0 0 0); }
.${p}-flap-open { top: 0; height: 100%; z-index: 1; clip-path: inset(0 0 ${((1 - HINGE) * 100).toFixed(2)}% 0); transform-origin: 50% ${(HINGE * 100).toFixed(2)}%; backface-visibility: hidden; }
.${p}-flap-closed { top: ${(HINGE * 100).toFixed(2)}%; height: ${((1 - HINGE) * 100).toFixed(2)}%; z-index: 3; transform-origin: 50% 0; clip-path: polygon(0 0, 100% 0, 50% 52%); backface-visibility: hidden; }
/* Her whole closed drawing, on top while it's sealed: its flap lines are the pocket's edges, which the open front
   draws a little lower, so the flap piece alone would leave a sliver of letter showing */
.${p}-closed-full { top: ${(HINGE * 100).toFixed(2)}%; height: ${((1 - HINGE) * 100).toFixed(2)}%; z-index: 7; }
.${p}-front { top: 0; height: 100%; z-index: 4; filter: drop-shadow(0 -2px 3px rgb(40 24 12 / 0.16)); }
.${p}-letter { position: absolute; z-index: 2; left: 9%; width: 82%; top: ${(HINGE * 100 + 4).toFixed(2)}%; aspect-ratio: 1.42; border-radius: 5px;
  display: grid; place-items: center; padding: 9%; transform-origin: 50% 100%; will-change: transform;
  background: radial-gradient(120% 80% at 0% 0%, color-mix(in oklab, var(--brand-mitsu) 14%, transparent), transparent 60%), var(--letter-bg);
  box-shadow: 0 0 0 0.5px rgb(60 40 20 / 0.18), 0 1px 2px rgb(40 24 12 / 0.14); }
/* The light across a curved sheet: a soft band that only shows while it bends (--bend 0 to 1) */
.${p}-letter::after { content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; opacity: var(--bend, 0);
  background: linear-gradient(180deg, rgb(255 255 255 / 0.22), transparent 38%, rgb(40 24 12 / 0.10) 72%, rgb(40 24 12 / 0.16)); }
.${p}-letter .names-art-wrap { width: 100%; }
/* The letter's shadow on the pocket once it's out and resting in front */
.${p}-shade { position: absolute; z-index: 4; left: 12%; right: 12%; height: 10%; border-radius: 50%; pointer-events: none; opacity: 0;
  background: radial-gradient(closest-side, rgb(40 24 12 / 0.34), transparent); filter: blur(4px); }
`

/** The letter: the card's own paper, Nadia's lettering of the names on it */
export function LetterSheet({ className, style }: { className: string; style?: React.CSSProperties }) {
  return <span className={className} style={style}><NamesArt /></span>
}
