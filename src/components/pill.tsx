import { cn } from "@/lib/utils"

/** Small status pill (Game Night "PLAYED"): Inter 12px caps, 0.08em tracking, 4.5:1 or better. */
export function Pill({ tone = "neutral", children, className }: { tone?: "neutral" | "good" | "warn" | "accent"; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-label text-[12px] font-medium tracking-[0.08em] uppercase",
      tone === "good" && "bg-leaf/15 text-success", tone === "neutral" && "bg-muted text-body",
      tone === "warn" && "bg-highlight/25 text-foreground", tone === "accent" && "bg-primary/12 text-link", className)}>
      {tone === "good" && <span aria-hidden className="size-1.5 rounded-full bg-leaf" />}
      {children}
    </span>
  )
}
