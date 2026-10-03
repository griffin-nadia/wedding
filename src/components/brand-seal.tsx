import { cn } from "@/lib/utils"

/**
 * The N&G seal: the same mark as the favicon, the envelope seal and the credit. Drawn from
 * public/brand/seal.svg (made by .brief/tools/brand.mjs), so the paths stay out of the first-screen JS.
 */
export function BrandSeal({ className }: { className?: string }) {
  return <img src={`${import.meta.env.BASE_URL}brand/seal.svg`} alt="" aria-hidden width={64} height={64} decoding="async" className={cn("shrink-0", className)} />
}
