import { cn } from "@/lib/utils"
import { ART } from "@/lib/art"

/**
 * The G&N seal on its own (the paper envelope's seal, the credit mark): Nadia's painted wax seal (ART.seal). The
 * favicon keeps the flat mark in public/brand/seal.svg.
 */
export function BrandSeal({ className, sizes = "64px" }: { className?: string; sizes?: string }) {
  const b = `${import.meta.env.BASE_URL}${ART.seal.src}`
  const set = (fmt: string) => ART.seal.widths.map((w) => `${b}-${w}.${fmt} ${w}w`).join(", ")
  return (
    <picture className="contents">
      <source type="image/avif" sizes={sizes} srcSet={set("avif")} />
      <img src={`${b}-128.webp`} srcSet={set("webp")} sizes={sizes} alt="" aria-hidden width={64} height={64} decoding="async" draggable={false} className={cn("shrink-0 object-contain", className)} />
    </picture>
  )
}
