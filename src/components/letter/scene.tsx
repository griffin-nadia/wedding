import { useEffect, useRef, useState } from "react"
import { SCENES, type SceneSource } from "@/lib/scenes"
import { cn } from "@/lib/utils"

const base = import.meta.env.BASE_URL
const set = (name: string, fmt: string) => [800, 1200, 1600].map((w) => `${base}scenes/${name}-${w}.${fmt} ${w}w`).join(", ")

/**
 * The scene behind the letter: a real photo now, a painted plate (three layers) later.
 * Phones: the photo fills the screen. From 1024: a clear photo panel on the right (where the faces are)
 * over a soft, blurred fill of the same photo on the left, which is where the letter sits.
 * Graded with --scene-filter. Changes cross-fade (600 ms); nothing moves under reduced motion.
 */
export function Scene({ source, dim = false, className }: { source: SceneSource; dim?: boolean; className?: string }) {
  if ("photo" in source) return <PhotoPair name={source.photo} dim={dim} className={className} />
  return <Layers source={source} dim={dim} className={className} />
}

/**
 * Their photo, one per mode (Jehan, 6 Oct). Both stay mounted (the other mode's loads once the page is idle),
 * so switching mode never waits on a download: the toggle waits for the new photo to decode, then the whole
 * page changes in one reveal. Without View Transitions the photos cross-fade.
 */
const PAIR = ["kyoto-view", "night-lane"] as const
// The HTML's first-paint copy of the photo (index.html, phones) goes once the app's own has loaded
const dropShell = () => { document.getElementById("scene-shell")?.remove(); document.getElementById("scene-shell-band")?.remove() }
function PhotoPair({ name, dim, className }: { name: string; dim: boolean; className?: string }) {
  const [both, setBoth] = useState(false)
  useEffect(() => {
    const go = () => setBoth(true)
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback
    if (document.readyState === "complete") { if (idle) idle(go); else setTimeout(go, 1500) }
    else window.addEventListener("load", () => (idle ? idle(go) : setTimeout(go, 1500)), { once: true })
  }, [])
  return (
    <div aria-hidden className={cn("scene fixed inset-0 -z-10 overflow-hidden bg-[var(--scene-scrim)]", dim && "scene-dim", className)}>
      {PAIR.filter((n) => n === name || both).map((n) => (
        <div key={n} data-photo={n} className={cn("scene-layer absolute inset-0", n === name ? "opacity-100" : "opacity-0")}>
          <PhotoScene name={n} priority={n === name} onReady={n === name ? dropShell : () => {}} />
        </div>
      ))}
      <div className="scene-scrim absolute inset-0" />
    </div>
  )
}

function Layers({ source, dim = false, className }: { source: SceneSource; dim?: boolean; className?: string }) {
  useEffect(dropShell, [])
  const key = "photo" in source ? source.photo : "plate" in source ? source.plate : "walk" in source ? "walk" : "paper"
  // Keep the previous scene underneath until the next one has loaded, so changes cross-fade
  const [layers, setLayers] = useState<{ key: string; source: SceneSource; ready: boolean }[]>([{ key, source, ready: false }])
  useEffect(() => {
    setLayers((ls) => (ls[ls.length - 1]?.key === key ? ls : [...ls.slice(-1), { key, source, ready: false }]))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  const ready = (k: string) => setLayers((ls) => {
    const l = ls.find((x) => x.key === k)
    if (!l || l.ready) return ls
    return ls.map((l) => (l.key === k ? { ...l, ready: true } : l))
  })
  return (
    <div aria-hidden className={cn("scene fixed inset-0 -z-10 overflow-hidden bg-[var(--scene-scrim)]", dim && "scene-dim", className)}>
      {layers.map((l, i) => (
        <div key={l.key} className={cn("scene-layer absolute inset-0", l.ready || i === 0 ? "opacity-100" : "opacity-0")}
          onTransitionEnd={() => { if (i === layers.length - 1 && layers.length > 1) setLayers((ls) => ls.slice(-1)) }}>
          {"photo" in l.source ? <PhotoScene name={l.source.photo} priority={i === 0} onReady={() => ready(l.key)} />
            : "plate" in l.source ? <PlateScene name={l.source.plate} fallback={l.source.fallback} onReady={() => ready(l.key)} />
            : "walk" in l.source ? <WalkScene onReady={() => ready(l.key)} />
            : <PaperScene onReady={() => ready(l.key)} />}
        </div>
      ))}
      <div className="scene-scrim absolute inset-0" />
    </div>
  )
}

function PhotoScene({ name, priority, onReady }: { name: string; priority: boolean; onReady: () => void }) {
  const meta = SCENES[name as keyof typeof SCENES]
  const img = useRef<HTMLImageElement>(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (img.current?.complete) onReady() }, [])
  if (!meta) return null
  return (
    <>
      {/* Blur-up and, from 1024, the soft fill the letter sits over */}
      <div className="scene-fill absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${meta.lqip})` }} />
      <picture className="scene-photo absolute inset-0">
        <source type="image/avif" srcSet={set(name, "avif")} sizes="max(100vw, 75vh)" />
        <source type="image/webp" srcSet={set(name, "webp")} sizes="max(100vw, 75vh)" />
        <img ref={img} src={`${base}scenes/${name}-1600.webp`} alt="" width={meta.w} height={meta.h} decoding="async"
          fetchPriority={priority ? "high" : "auto"} onLoad={onReady} className="size-full object-cover" />
      </picture>
    </>
  )
}

/**
 * Paper (v3 H): the only background after the envelope. Warm paper gradient (or Nadia's wash at
 * public/art/paper/base.*, which replaces it with no other change), the grain, a slow drift of light
 * (40s, 2%) and a mist band that breathes (12s). Still under reduced motion.
 */
function PaperScene({ onReady }: { onReady: () => void }) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { onReady() }, [])
  return (
    <div className="scene-paper absolute inset-0" style={__PAPER_ART__ ? { backgroundImage: `url(${base}art/paper/base.${__PAPER_ART__})` } : undefined} data-art={__PAPER_ART__ ? "" : undefined}>
      <span className="paper-light" /><span className="paper-mist" />
    </div>
  )
}

/** Concept B hook (December): the walk to the Sodoh. A flat sage plate with the path until Nadia's painting exists. */
function WalkScene({ onReady }: { onReady: () => void }) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { onReady() }, [])
  return (
    <div className="scene-walk absolute inset-0">
      <svg viewBox="0 0 2400 800" preserveAspectRatio="xMidYMid slice" className="size-full" aria-hidden>
        <rect width="2400" height="800" fill="var(--brand-sage-paper)" />
        <path d="M0 640 C 400 600, 600 520, 900 540 S 1500 460, 1800 420 S 2200 360, 2400 340" fill="none" stroke="var(--brand-wara)" strokeWidth="36" strokeLinecap="round" />
      </svg>
      <span className="paper-light" />
    </div>
  )
}

/** Painted plate: sky and mist, hills, foreground leaves. Layers drift 2 to 6px on scroll. Until the art lands, the photo shows. */
function PlateScene({ name, fallback, onReady }: { name: string; fallback?: string; onReady: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [missing, setMissing] = useState(false)
  useEffect(() => {
    onReady()
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (still) return
    let raf = 0
    const move = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        if (document.hidden || !ref.current) return
        const y = Math.min(1, window.scrollY / 800)
        ref.current.style.setProperty("--drift", String(y))
      })
    }
    window.addEventListener("scroll", move, { passive: true })
    return () => { window.removeEventListener("scroll", move); cancelAnimationFrame(raf) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  if (missing && fallback) return <PhotoScene name={fallback} priority={false} onReady={onReady} />
  return (
    <div ref={ref} className="scene-plate absolute inset-0">
      {(["sky", "mid", "fore"] as const).map((layer, i) => (
        <picture key={layer} className="absolute inset-0" style={{ transform: `translateY(calc(var(--drift, 0) * ${-(i + 1) * 2}px))` }}>
          <source type="image/avif" srcSet={`${base}art/${name}/${layer}-1600.avif 1600w, ${base}art/${name}/${layer}-2400.avif 2400w`} />
          <img src={`${base}art/${name}/${layer}-1600.webp`} alt="" className="size-full object-cover" onError={() => setMissing(true)} />
        </picture>
      ))}
    </div>
  )
}
