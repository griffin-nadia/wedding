import { cn } from "@/lib/utils"

// Small hand-drawn leaves and vines. Decorative (aria-hidden), colours from tokens, each well under 2 KB.
// --leaf-a / --leaf-b shift from green to red as the day gets closer (src/lib/seasons.ts).

const MAPLE = "M12 2l1.6 4.2 3.2-2.1-.7 4 4-.6-2.3 3.3 3.6 1.4-3.9 1.6 1.6 3.1-3.9-.8L13 16.2h-2l-2.2-4.1-3.9.8 1.6-3.1-3.9-1.6 3.6-1.4-2.3-3.3 4 .6-.7-4 3.2 2.1z"
const IVY = "M12 3c1.2 1.6 2 3 2.2 4.6 1.8-.9 3.6-1 5.3-.3-.4 2-1.5 3.6-3.1 4.6 1.3 1.1 2 2.6 2 4.4-2.1.4-4-.1-5.4-1.4L12 18l-1-3.1c-1.4 1.3-3.3 1.8-5.4 1.4 0-1.8.7-3.3 2-4.4C6 10.9 4.9 9.3 4.5 7.3c1.7-.7 3.5-.6 5.3.3C10 6 10.8 4.6 12 3z"
const GINKGO = "M12 20c0-3 .2-5 .6-6.6C9 13.8 5.6 12.4 4 9.6 6.8 6.4 9.6 5 12 5s5.2 1.4 8 4.6c-1.6 2.8-5 4.2-8.6 3.8.4 1.6.6 3.6.6 6.6"

export function Leaf({ kind = "maple", tone = "a", className, style }: { kind?: "maple" | "ivy" | "ginkgo"; tone?: "a" | "b"; className?: string; style?: React.CSSProperties }) {
  const d = kind === "ivy" ? IVY : kind === "ginkgo" ? GINKGO : MAPLE
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={cn("size-6", className)} style={style}>
      <path d="M12 13.5V23" stroke="var(--leaf)" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <path d={d} fill={tone === "a" ? "var(--leaf-a)" : "var(--leaf-b)"} />
    </svg>
  )
}

/** A corner vine for the hero: one curling stem with a few ivy and maple leaves. */
export function Vine({ className }: { className?: string }) {
  const leaves: [string, number, number, number, number, "a" | "b"][] = [
    [IVY, 118, 22, 0.9, -30, "a"], [MAPLE, 92, 52, 0.8, 20, "b"], [IVY, 140, 70, 0.7, 60, "b"],
    [IVY, 62, 86, 0.75, -10, "a"], [MAPLE, 120, 108, 0.65, 40, "a"], [IVY, 38, 128, 0.6, 15, "b"],
  ]
  return (
    <svg aria-hidden viewBox="0 0 180 170" className={cn("pointer-events-none", className)} fill="none">
      <path d="M178 2C150 18 128 40 112 62s-36 50-58 66S16 152 2 168" stroke="var(--leaf)" strokeWidth="1.6" strokeLinecap="round" />
      {leaves.map(([d, x, y, s, r, tone], i) => (
        <path key={i} className="vine-leaf" d={d} fill={tone === "a" ? "var(--leaf-a)" : "var(--leaf-b)"} transform={`translate(${x - 12 * s} ${y - 12 * s}) rotate(${r} ${12 * s} ${12 * s}) scale(${s})`} />
      ))}
    </svg>
  )
}

/** Section divider: a thin ink line that ends in a leaf. */
export function LeafDivider({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("flex items-center gap-2 text-border", className)}>
      <span className="h-px flex-1 bg-current" />
      <Leaf kind="ivy" className="size-5" />
      <span className="h-px w-8 bg-current" />
    </div>
  )
}

/** Kasumi: a soft band of mist between big sections. Static, very faint. */
export function Mist({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 400 40" preserveAspectRatio="none" className={cn("h-10 w-full", className)}>
      <path d="M0 26c40-14 70-14 110-6s80 10 120-2 90-14 170 2v20H0z" fill="var(--foreground)" opacity=".05" />
      <path d="M0 32c50-10 90-8 140-2s110 6 160-4 70-6 100-2v16H0z" fill="var(--foreground)" opacity=".06" />
    </svg>
  )
}
