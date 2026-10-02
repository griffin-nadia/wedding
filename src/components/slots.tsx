import slots from "@/content/slots.json"
import { JourneyMap, type Stop } from "@/components/journey-map"
import { useLang } from "@/lib/lang"
import { Photo } from "@/components/photo"

// Slots for the couple's own touches. Each stays hidden until switched on in content/slots.json.
type Img = { src: string; alt: string }
const url = (src: string) => (src.startsWith("http") ? src : `${import.meta.env.BASE_URL}${src.replace(/^\//, "")}`)

export function Lettering() {
  const s = slots.lettering
  if (!s.show || !s.image) return null
  return <img src={url(s.image)} alt={s.alt} className="h-auto w-full max-w-sm" />
}

export function OurStory() {
  const { t } = useLang()
  const s = slots.ourStory
  if (!s.show) return null
  return (
    <section aria-labelledby="our-story" className="space-y-4">
      <Photo name="couple-brisbane-market" treatment="arch" sizes="280px" className="mx-auto w-56" />
      <h2 id="our-story" className="heading text-center">{s.title}</h2>
      {s.body && <p className="whitespace-pre-line text-body">{s.body}</p>}
      {s.map?.show && <JourneyMap labels={t.story} stops={(s.stops ?? []).filter((x) => x.body) as Stop[]} />}
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

