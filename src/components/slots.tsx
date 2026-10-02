import slots from "@/content/slots.json"

// Slots for the couple's own touches. Each stays hidden until switched on in content/slots.json.
type Img = { src: string; alt: string }
const url = (src: string) => (src.startsWith("http") ? src : `${import.meta.env.BASE_URL}${src.replace(/^\//, "")}`)

export function Lettering() {
  const s = slots.lettering
  if (!s.show || !s.image) return null
  return <img src={url(s.image)} alt={s.alt} className="h-auto w-full max-w-sm" />
}

export function OurStory() {
  const s = slots.ourStory
  if (!s.show) return null
  return (
    <section aria-labelledby="our-story" className="space-y-4">
      <h2 id="our-story" className="leaf-rule text-3xl">{s.title}</h2>
      {s.body && <p className="whitespace-pre-line text-body">{s.body}</p>}
      {(s.photos as Img[]).length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {(s.photos as Img[]).map((p) => <img key={p.src} src={url(p.src)} alt={p.alt} loading="lazy" className="aspect-square w-full rounded-[1.25rem] object-cover" />)}
        </div>
      )}
    </section>
  )
}

export function Paintings() {
  const s = slots.paintings
  if (!s.show || !(s.images as Img[]).length) return null
  return (
    <section aria-labelledby="paintings" className="space-y-4">
      <h2 id="paintings" className="leaf-rule text-3xl">{s.title}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {(s.images as Img[]).map((p) => <img key={p.src} src={url(p.src)} alt={p.alt} loading="lazy" className="w-full rounded-[1.25rem]" />)}
      </div>
    </section>
  )
}

export function TravelDates() {
  const s = slots.travelDates
  if (!s.show || !s.body) return null
  return (
    <section className="rounded-[1.25rem] bg-card p-6 shadow-paper ring-1 ring-border">
      <h2 className="mb-2 font-sans text-base font-bold">{s.title}</h2>
      <p className="whitespace-pre-line text-sm text-body">{s.body}</p>
    </section>
  )
}

/**
 * The hero photo (Kyoto at night). Files live in public/photos/ and stay out of git until Nadia
 * says a public photo is OK; switch on with heroPhoto.show (or VITE_HERO_PHOTO=1 for a local build).
 */
export function HeroPhoto({ caption }: { caption: string }) {
  const s = slots.heroPhoto
  if (!s.show && import.meta.env.VITE_HERO_PHOTO !== "1") return null
  const p = (f: string) => url(`photos/${s.name}-${f}`)
  return (
    <figure className="hero-print">
      <picture>
        <source type="image/avif" media="(min-width: 768px)" srcSet={`${p("wide-1600.avif")} 1600w, ${p("wide-2400.avif")} 2400w`} sizes="(min-width: 960px) 440px, 45vw" />
        <source type="image/webp" media="(min-width: 768px)" srcSet={`${p("wide-1600.webp")} 1600w, ${p("wide-2400.webp")} 2400w`} sizes="(min-width: 960px) 440px, 45vw" />
        <source type="image/avif" srcSet={`${p("720.avif")} 720w, ${p("1080.avif")} 1080w, ${p("1600.avif")} 1600w`} sizes="100vw" />
        <source type="image/webp" srcSet={`${p("720.webp")} 720w, ${p("1080.webp")} 1080w, ${p("1600.webp")} 1600w`} sizes="100vw" />
        <img src={p("1080.jpg")} alt={s.alt} width={1080} height={1350} fetchPriority="high" decoding="async"
          className="aspect-[4/5] w-full rounded-[4px] bg-[#473521] object-cover object-[50%_30%] md:aspect-[3/2]" />
      </picture>
      <figcaption className="hand mt-2 text-sm text-muted-foreground">{caption}</figcaption>
    </figure>
  )
}
