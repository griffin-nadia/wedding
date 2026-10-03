import { cn } from "@/lib/utils"

/** Small status pill: Inter 12 caps (the one place caps are allowed), tints from the --pill-* tokens, 4.5:1 or better. */
export function Pill({ tone = "neutral", children, className }: { tone?: "neutral" | "good" | "warn" | "accent"; children: React.ReactNode; className?: string }) {
  return (
    <span role="status" className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1 font-label text-xs font-medium uppercase tracking-(--type-label-tracking)",
      tone === "good" && "bg-(--pill-good-bg) text-success", tone === "neutral" && "bg-muted text-body",
      tone === "warn" && "bg-(--pill-warn-bg) text-foreground", tone === "accent" && "bg-(--pill-accent-bg) text-link", className)}>
      {children}
    </span>
  )
}
