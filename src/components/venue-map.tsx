import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { Maximize2, MapPin } from "lucide-react"
import { Sheet, SheetBody, SheetContent, SheetHead, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useLang } from "@/lib/lang"
import { config } from "@/lib/config"
import { cn } from "@/lib/utils"

const base = import.meta.env.BASE_URL
/** The old map's two routes, traced over her roads in the map's own pixels (1800 × 1500; r22-routes.mjs): the taxi
 *  from Kyoto Station, and the walk from Gion-Shijo along Shijo-dori and down the east road */
const ROUTES = {
  taxi: "M492 1156 L492 1010 L1156 1010 L1156 690 L1254 668",
  walk: "M1006 330 L1156 330 L1156 690 L1254 668",
} as const

/** Run 25: which of her dots each ring sits on (her red place dots, the green Keihan station rings, Kyoto Station's
 *  orange ring), so each ring is her dot's own size */
const DOT: Record<string, "station" | "jr"> = { station: "jr", gojo: "station", gion: "station", sanjo: "station", shichijo: "station", tofukuji: "station" }

/** Run 26: where the chip may go when its own place (away from her painted label) would cover another dot or run off the
 *  map: its own side nudged lower or higher, then the other side, then above or below. The dot never moves. Words in
 *  data-chip: left (else right), low or high (else centred), above, below. */
const sides = (own: string) => {
  const h = own === "left" ? "left" : "right", o = h === "left" ? "right" : "left", n = own === "low" ? ["low", "", "high"] : ["", "low", "high"]
  const row = (x: string) => n.map((y) => `${x} ${y}`.trim())
  return [...new Set([...(own === "above" ? ["above"] : []), ...row(h), ...row(o), "above", "below"])]
}

/** Nadia's map shows when config.venueMap is on, or with ?preview in the address (to try it before it's switched on) */
export function venueMapOn() {
  return config.venueMap || (typeof location !== "undefined" && new URLSearchParams(location.search).has("preview"))
}

/**
 * Around the venue, on Nadia's painted map (run 22, v2 of 22 Oct). Her art is the map; on it sit invisible buttons
 * exactly over her dots and stations (% of the art, so they scale with it), a soft ring on the chosen one, and the
 * chosen route from Kyoto Station as a faint dashed line traced over her roads. Under it, the chosen place's card and
 * the places as a plain list with their Japanese names (her labels are English only). Light: the art sits on the
 * card's own cream. Lantern: the same art as a framed print (her dark ink doesn't read on walnut; no filters).
 * Phones: pinch to zoom from 1x to 2.5x and drag to look around. Reduced motion: the route still, no glide.
 */
export function VenueMap({ inModal = false }: { inModal?: boolean }) {
  const { t } = useLang()
  const m = t.venueMap, k = t.kyotoMap
  const [on, setOn] = useState("venue")
  const place = m.places.find((p) => p.id === on) ?? m.places[0]
  const zoom = usePinch()
  const art = useRef<HTMLDivElement>(null)
  // Run 26: the chosen place's chip goes in the first place (its own first) where it stays on the map and covers no
  // other dot; if there's none, where it covers least. Tried on the real chip before paint, and again on a resize.
  const [side, setSide] = useState<string>(place.chip)
  useLayoutEffect(() => {
    const box = zoom.box.current
    const fit = () => {
      const pin = art.current?.querySelector<HTMLElement>(".vmap-pin.is-on"), chip = pin?.querySelector<HTMLElement>(".vmap-chip")
      if (!box || !pin || !chip) return
      // Each other dot's box from its pin's centre (the pin never animates; the dot can be mid-pulse)
      const b = box.getBoundingClientRect(), dots = [...art.current!.querySelectorAll<HTMLElement>(".vmap-pin:not(.is-on)")].map((p) => {
        const r = p.getBoundingClientRect(), d = p.querySelector<HTMLElement>(".vmap-dot")!.offsetWidth / 2 + 2
        return { l: r.left + r.width / 2 - d, r: r.left + r.width / 2 + d, t: r.top + r.height / 2 - d, b: r.top + r.height / 2 + d }
      })
      const cost = () => {
        const c = chip.getBoundingClientRect()
        const out = Math.max(0, b.left - c.left) + Math.max(0, c.right - b.right) + Math.max(0, b.top - c.top) + Math.max(0, c.bottom - b.bottom)
        return dots.filter((d) => d.l < c.right && d.r > c.left && d.t < c.bottom && d.b > c.top).length * 1000 + out
      }
      // No transition while trying (reduced motion's 0.01ms transitions would otherwise report the old place)
      let best = place.chip as string, least = Infinity
      chip.style.setProperty("transition", "none", "important")
      for (const s of sides(place.chip)) { pin.dataset.chip = s; const c = cost(); if (c < least) { least = c; best = s } if (!c) break }
      pin.dataset.chip = best
      chip.style.transition = ""
      setSide(best)
    }
    fit()
    if (!box) return
    const ro = new ResizeObserver(fit); ro.observe(box)
    return () => ro.disconnect()
  }, [place, zoom.box])
  // One gentle pulse of the dots the first time the map scrolls into view (run 24b), so it's clear they can be tapped
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = zoom.box.current
    if (!el || seen) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); io.disconnect() } }, { threshold: 0.5 })
    io.observe(el)
    return () => io.disconnect()
  }, [zoom.box, seen])
  return (
    <section aria-label={m.title} className="flex flex-col gap-4">
      <p className="text-small text-muted-foreground">{k.intro}</p>
      <div className="vmap" ref={zoom.box} data-zoomed={zoom.s > 1 || undefined} data-seen={seen || undefined} {...zoom.handlers}>
        <div className="vmap-art" ref={art} style={{ transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.s})` }}>
          <picture>
            <source type="image/avif" srcSet={`${base}art/map/venue-map-800.avif 800w, ${base}art/map/venue-map-1600.avif 1600w`} sizes="(min-width: 768px) 652px, 92vw" />
            <img src={`${base}art/map/venue-map-800.webp`} srcSet={`${base}art/map/venue-map-800.webp 800w, ${base}art/map/venue-map-1600.webp 1600w`} sizes="(min-width: 768px) 652px, 92vw"
              width={1800} height={1500} alt={m.alt} draggable={false} decoding="async" loading="lazy" />
          </picture>
          <svg aria-hidden viewBox="0 0 1800 1500" className="vmap-route">
            <path className="vmap-taxi" d={ROUTES.taxi} />
            <path className="vmap-walk" d={ROUTES.walk} />
          </svg>
          {/* The old map's pins on her dots: a ring on each, filled when chosen, and the chosen one's label chip (Japanese
              over English) on the side away from her own painted label, so it never covers it */}
          {m.places.map((p, i) => (
            <button key={p.id} type="button" aria-pressed={on === p.id} aria-label={`${p.name}, ${p.ja}`} onClick={() => setOn(p.id)}
              className={cn("vmap-pin", on === p.id && "is-on")} data-chip={on === p.id ? side : p.chip} data-kind={DOT[p.id] ?? "place"}
              style={{ left: `${p.at[0]}%`, top: `${p.at[1]}%`, "--tilt": `${(i * 67) % 360}deg` } as React.CSSProperties}>
              <span aria-hidden className="vmap-dot" />
              {on === p.id && <span aria-hidden className="vmap-chip"><span lang="ja" className="font-ja">{p.ja}</span><span>{p.name}</span></span>}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <ul className="vmap-key" aria-label={m.title}>
          <li><span aria-hidden className="vmap-swatch vmap-swatch-taxi" />{k.taxiRoute}</li>
          <li><span aria-hidden className="vmap-swatch vmap-swatch-walk" />{k.walkRoute}</li>
        </ul>
        <span className="text-small text-muted-foreground">{k.notToScale}</span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-4">
        {inModal ? <span /> : <VenueMapOpen />}
        <span className="text-small text-muted-foreground vmap-hint">{m.zoomHint}</span>
      </div>
      <div key={place.id} className="kmap-card" aria-live="polite">
        <p className="font-medium text-foreground">{place.name} <span lang="ja" className="font-ja text-muted-foreground">{place.ja}</span></p>
        <p>{place.body}</p>
        <a href={place.maps} target="_blank" rel="noreferrer" className="btn-text inline-flex min-h-11 items-center gap-1 self-start"><MapPin className="size-4" aria-hidden />{k.directions}</a>
      </div>
      <details className="vmap-list">
        <summary className="btn-text min-h-11 inline-flex items-center">{m.listTitle}</summary>
        <ul className="flex flex-col gap-1 pt-2">
          {m.places.map((p) => <li key={p.id}><button type="button" className="btn-text min-h-11 text-left" onClick={() => setOn(p.id)}>{p.name} <span lang="ja" className="font-ja">{p.ja}</span></button></li>)}
        </ul>
      </details>
    </section>
  )
}

/**
 * Run 25: "Open the map": the same map, places, card and routes full screen, from Travel (under the map) and The day
 * (beside How to get there, where there's no map inline). A dialog: focus stays in it, Escape and the close button
 * close it and focus goes back to the link. One component, so both pages show the same thing.
 */
export function VenueMapOpen({ className }: { className?: string }) {
  const { t } = useLang()
  const m = t.venueMap
  return (
    <Sheet>
      <SheetTrigger asChild><button type="button" className={cn("btn-text inline-flex min-h-11 items-center gap-2 self-start", className)}><Maximize2 className="size-4" aria-hidden />{m.open}</button></SheetTrigger>
      <SheetContent className="venue-modal" closeLabel={m.close} aria-describedby={undefined}>
        <SheetHead><SheetTitle className="heading">{m.title}</SheetTitle></SheetHead>
        <SheetBody><VenueMap inModal /></SheetBody>
      </SheetContent>
    </Sheet>
  )
}

/** Pinch to zoom (1x to 2.5x) and drag to pan once zoomed, with two fingers or one, kept inside the frame. Touch only:
 *  a mouse scrolls the page as usual. A tap still reaches the buttons (a move under 6px isn't a drag). */
function usePinch() {
  const box = useRef<HTMLDivElement>(null)
  const pts = useRef(new Map<number, { x: number; y: number }>())
  const start = useRef<{ d: number; s: number; x: number; y: number; cx: number; cy: number } | null>(null)
  const [v, setV] = useState({ s: 1, x: 0, y: 0 })
  const clamp = (s: number, x: number, y: number) => {
    const r = box.current?.getBoundingClientRect(), w = r?.width ?? 0, h = r?.height ?? 0
    s = Math.min(2.5, Math.max(1, s))
    return { s, x: Math.min(0, Math.max(w - w * s, x)), y: Math.min(0, Math.max(h - h * s, y)) }
  }
  const snap = () => {
    const p = [...pts.current.values()]
    if (!p.length) return (start.current = null)
    const cx = p.reduce((a, q) => a + q.x, 0) / p.length, cy = p.reduce((a, q) => a + q.y, 0) / p.length
    const d = p.length > 1 ? Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) : 0
    start.current = { d, s: v.s, x: v.x, y: v.y, cx, cy }
  }
  const handlers = {
    onPointerDown: (e: React.PointerEvent) => { if (e.pointerType !== "touch") return; pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY }); snap() },
    onPointerMove: (e: React.PointerEvent) => {
      if (!pts.current.has(e.pointerId) || !start.current) return
      pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      const p = [...pts.current.values()], st = start.current, r = box.current!.getBoundingClientRect()
      const cx = p.reduce((a, q) => a + q.x, 0) / p.length, cy = p.reduce((a, q) => a + q.y, 0) / p.length
      if (p.length === 1 && v.s === 1) return // one finger at 1x scrolls the page
      const s = p.length > 1 && st.d ? st.s * (Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y) / st.d) : st.s
      // Keep the point under the fingers' centre where it was
      const ox = st.cx - r.left, oy = st.cy - r.top, k = s / st.s
      setV(clamp(s, ox - (ox - st.x) * k + (cx - st.cx), oy - (oy - st.y) * k + (cy - st.cy)))
    },
    onPointerUp: (e: React.PointerEvent) => { pts.current.delete(e.pointerId); snap() },
    onPointerCancel: (e: React.PointerEvent) => { pts.current.delete(e.pointerId); snap() },
  }
  return { box, handlers, ...v }
}
