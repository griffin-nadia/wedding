import { ART } from "@/lib/art"
import { cn } from "@/lib/utils"

/**
 * Nadia's lettering of the names, as a picture (AVIF, WebP fallback, 1x and 2x). tone "theme" renders both inks and
 * the stylesheet shows the one for the mode (brown by day, cream in Lantern); "light" is brown always (the envelope
 * stays cream in both modes). Decorative: the names are said as text by whatever holds it.
 */
export function NamesArt({ tone = "theme", className }: { tone?: "theme" | "light"; className?: string }) {
  const one = (ink: "light" | "dark") => {
    const b = `${import.meta.env.BASE_URL}${ART.names[ink]}`
    const set = (fmt: string) => ART.names.widths.map((w) => `${b}-${w}.${fmt} ${w}w`).join(", ")
    const sizes = "(min-width: 1024px) 520px, 80vw"
    return (
      <picture key={ink} className={cn("names-art", tone === "theme" && `is-${ink}`)}>
        <source type="image/avif" sizes={sizes} srcSet={set("avif")} />
        <img src={`${b}-520.webp`} srcSet={set("webp")} sizes={sizes} alt="" aria-hidden width={520} height={Math.round(520 / ART.names.ratio)} decoding="async" draggable={false} />
      </picture>
    )
  }
  return <span aria-hidden className={cn("names-art-wrap", className)} style={{ aspectRatio: String(ART.names.ratio) }}>{tone === "theme" ? [one("light"), one("dark")] : one("light")}</span>
}
