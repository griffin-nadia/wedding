import { cn } from "@/lib/utils"

/**
 * The vermilion seal (final run): 寿 (kotobuki, "celebration"), the mark people put on wedding gifts and envelopes in
 * Japan. Cut by hand, not clip-art: a round seal with a slightly uneven double rim (seeded, so it's the same every
 * time), patchy ink with a soft bleed into the paper (the hanko utility: a baked ink mask and #ink-bleed), and a tiny
 * maple leaf and gum leaf tucked into the rim, echoing Nadia's envelope. The same seal in the confirmation head and
 * on the fortune slip. `glyph` is for the lab's comparison (京 Kyoto, or G·N from the wax seal). Decorative: the
 * words beside it carry the meaning.
 */
let seed = 0
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
/** A circle drawn by hand: a closed path whose radius wanders a little */
function rim(r: number, wobble: number, s: number) {
  seed = s
  const n = 48, pts: string[] = []
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2, rr = r + (rnd() - 0.5) * wobble
    pts.push(`${(50 + rr * Math.cos(a)).toFixed(2)} ${(50 + rr * Math.sin(a)).toFixed(2)}`)
  }
  return `M${pts.join("L")}Z`
}
const OUTER = rim(45, 1.6, 7), INNER = rim(38.5, 1.2, 19)
// A seven-point maple leaf and a long gum leaf, each about 9 units across
const MAPLE = "M0 -5 L1.2 -2 L4.3 -2.8 L2.6 0 L4.5 2.8 L1.1 2 L0 5.5 L-1.1 2 L-4.5 2.8 L-2.6 0 L-4.3 -2.8 L-1.2 -2 Z"
const GUM = "M-5 1.5 C-2 -2.5 3 -2.5 5.5 -0.5 C3 1.8 -2 2.6 -5 1.5 Z"

export function Hanko({ size = "md", stamp = false, glyph = "寿", className }: { size?: "sm" | "md"; stamp?: boolean; glyph?: "寿" | "京" | "GN"; className?: string }) {
  return (
    <span aria-hidden className={cn("hanko hanko-seal", stamp && "hanko-stamp", size === "sm" ? "size-10" : "size-20", className)}>
      <svg viewBox="0 0 100 100" className="size-full" fill="none">
        <path d={OUTER} stroke="currentColor" strokeWidth="5.5" strokeLinejoin="round" />
        <path d={INNER} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        {glyph === "GN"
          ? <text x="50" y="62" textAnchor="middle" fill="currentColor" fontSize="34" fontFamily="var(--font-display)" letterSpacing="-1">G·N</text>
          : <text x="50" y="66" textAnchor="middle" fill="currentColor" fontSize="46" fontFamily="var(--font-ja)" fontWeight="600">{glyph}</text>}
        {/* Tucked into the rim: a knockout in the paper's colour, then the leaf in ink */}
        <g transform="translate(19 74) rotate(-24)"><path d={MAPLE} fill="var(--hanko-paper, var(--card))" stroke="var(--hanko-paper, var(--card))" strokeWidth="2.4" /><path d={MAPLE} fill="currentColor" /></g>
        <g transform="translate(83 72) rotate(38)"><path d={GUM} fill="var(--hanko-paper, var(--card))" stroke="var(--hanko-paper, var(--card))" strokeWidth="2.4" /><path d={GUM} fill="currentColor" /><path d="M-4.5 1.2 C-1 0 2.5 -0.4 5 -0.5" stroke="var(--hanko-paper, var(--card))" strokeWidth="0.5" /></g>
      </svg>
    </span>
  )
}
