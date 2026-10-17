import { cn } from "@/lib/utils"

/** Status chip (the chip shape): the small text size, like every other chip, tints from the --pill-* tokens, 4.5:1 or better. */
export function Pill({ tone = "neutral", children, className }: { tone?: "neutral" | "good" | "warn" | "accent"; children: React.ReactNode; className?: string }) {
  return (
    <span role="status" className={cn("chip-shape gap-2 font-label text-small font-medium",
      tone === "good" && "bg-(--pill-good-bg) text-success", tone === "neutral" && "bg-muted text-body-ink",
      tone === "warn" && "bg-(--pill-warn-bg) text-foreground", tone === "accent" && "bg-(--pill-accent-bg) text-link", className)}>
      {children}
    </span>
  )
}
