import { useState, type ReactNode } from "react"
import { Camera } from "lucide-react"
import manifest from "@/content/photos.json"
import { useLang } from "@/lib/lang"
import { cn } from "@/lib/utils"

type Entry = { formats: Record<string, number[]>; wide: Record<string, number[]>; lqip: string; width: number; height: number }
const PHOTOS = manifest as Record<string, Entry>
const src = (f: string) => `${import.meta.env.BASE_URL}photos/${f}`

export type Treatment = "full" | "print" | "split"

/**
 * One photo in one of three frames (full-bleed, print on paper, editorial split). The arched window went with v3.
 * Until Nadia says photos can be public (PUBLIC_PHOTOS), the same frame shows a paper placeholder with
 * the caption, so nothing jumps when real photos arrive.
 */
export function Photo({ name, treatment, sizes = "100vw", priority = false, wide = false, className, children }: {
  name: string; treatment: Treatment; sizes?: string; priority?: boolean; wide?: boolean; className?: string; children?: ReactNode
}) {
  const { t } = useLang()
  const p = PHOTOS[name]
  const words = t.photos[name] ?? { alt: "", caption: "" }
  const [loaded, setLoaded] = useState(false)
  if (!p) return null
  const ratio = treatment === "split" ? "1 / 1" : treatment === "full" ? undefined : `${p.width} / ${p.height}`
  const set = (fmt: string, useWide = false) => {
    const w = (useWide ? p.wide[fmt] : p.formats[fmt]) || []
    return w.map((x) => `${src(`${name}-${useWide ? "wide-" : ""}${x}.${fmt}`)} ${x}w`).join(", ")
  }
  const last = (a: number[] | undefined) => (a && a.length ? a[a.length - 1] : 800)
  const fallback = p.formats.jpg ? `${name}-${last(p.formats.jpg)}.jpg` : `${name}-${last(p.formats.webp)}.webp`

  const image = __PUBLIC_PHOTOS__ ? (
    <picture>
      {/* The wide crop only from tablet up; phones keep the portrait crop (faces stay in frame) */}
      {wide && p.wide.avif && <source type="image/avif" media="(min-width: 768px)" srcSet={set("avif", true)} sizes={sizes} />}
      {wide && p.wide.webp && <source type="image/webp" media="(min-width: 768px)" srcSet={set("webp", true)} sizes={sizes} />}
      {p.formats.avif && <source type="image/avif" srcSet={set("avif")} sizes={sizes} />}
      {p.formats.webp && <source type="image/webp" srcSet={set("webp")} sizes={sizes} />}
      <img src={src(fallback)} alt={words.alt} width={p.width} height={p.height} sizes={sizes}
        loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} decoding="async" onLoad={() => setLoaded(true)}
        className={cn("photo-img size-full object-cover object-[50%_30%] transition-opacity duration-[400ms]", loaded ? "opacity-100" : "opacity-0")} />
    </picture>
  ) : (
    <div role="img" aria-label={words.caption || words.alt} className="photo-placeholder grid size-full place-items-center p-4 text-center">
      <span className="space-y-2">
        <Camera aria-hidden className="mx-auto size-5 text-muted-foreground" />
        {words.caption && <span className="block text-sm text-muted-foreground">{words.caption}</span>}
      </span>
    </div>
  )
  const blur = __PUBLIC_PHOTOS__ && p.lqip ? { backgroundImage: `url(${src(p.lqip)})` } : undefined

  if (treatment === "full") {
    return (
      <div className={cn("photo-full relative isolate overflow-hidden", className)}>
        <div className="absolute inset-0 -z-10 bg-cover bg-center blur-md" style={blur} aria-hidden />
        <div className="absolute inset-0 -z-10">{image}</div>
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-[rgb(34_22_14/0.25)] to-[rgb(34_22_14/0.88)]" />
        {children}
      </div>
    )
  }
  const frame = (
    <div className={cn("relative overflow-hidden bg-muted bg-cover bg-center",
      treatment === "split" && "rounded-md", treatment === "print" && "rounded-sm")}
      style={{ aspectRatio: ratio, ...blur }}>
      {image}
    </div>
  )
  if (treatment === "print") {
    return (
      <figure className={cn("photo-print", className)}>
        {frame}
        {words.caption && <figcaption className="mt-2 text-sm text-muted-foreground">{words.caption}</figcaption>}
      </figure>
    )
  }
  return (
    <figure className={cn("space-y-3", className)}>
      {frame}
      {words.caption && __PUBLIC_PHOTOS__ && <figcaption className="text-sm text-body">{words.caption}</figcaption>}
      {children}
    </figure>
  )
}

export const hasPublicPhotos = __PUBLIC_PHOTOS__
