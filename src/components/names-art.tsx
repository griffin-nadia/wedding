import { ART } from "@/lib/art"
import { cn } from "@/lib/utils"

/**
 * Nadia's lettering of the names, as two CSS masks on the same frame filled with theme tokens: the names in the body
 * ink (brown by day, cream in Lantern) and the "&" in the brand sage. On the envelope, a .paper surface, the tokens
 * are always the day ones. Decorative: the names are said as text by whatever holds it.
 */
export function NamesArt({ className }: { className?: string }) {
  // 1x and 2x (18 Oct): the sharp one only where the screen needs it
  const url = (m: string) => `image-set(url(${import.meta.env.BASE_URL}${m}-520.webp) 1x, url(${import.meta.env.BASE_URL}${m}-1040.webp) 2x)`
  return (
    <span aria-hidden className={cn("names-art-wrap", className)}
      style={{ aspectRatio: String(ART.names.ratio), ["--names-mask" as string]: url(ART.names.mask), ["--amp-mask" as string]: url(ART.names.amp) }}>
      <span className="names-art-ink" /><span className="names-art-amp" />
    </span>
  )
}
