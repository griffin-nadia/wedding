import { cn } from "@/lib/utils"
import { SEAL_INNER, SEAL_NG, SEAL_RING } from "@/components/brand-paths"

/** The N&G seal as outlines: the same mark as the favicon, the envelope seal and the credit. */
export function BrandSeal({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={cn("shrink-0", className)}>
      <path d={SEAL_RING} fill="var(--brand-sabi)" />
      <path d={SEAL_INNER} fill="none" stroke="var(--brand-shiro-kinari)" strokeOpacity=".55" strokeWidth="1.2" />
      <path d={SEAL_NG} fill="var(--brand-shiro-kinari)" />
    </svg>
  )
}
