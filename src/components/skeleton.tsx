import { cn } from "@/lib/utils"

/** Washi skeleton: appears after 300ms, breathes slowly, no shimmer. */
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cn("skeleton-wait washi block rounded-sm bg-muted", className)} />
}
