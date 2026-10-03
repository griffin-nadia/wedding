import { useEffect, useRef, useState } from "react"
import { SCENES, type SceneSource } from "@/lib/scenes"
import { cn } from "@/lib/utils"

const base = import.meta.env.BASE_URL
const set = (name: string, fmt: string) => [900, 1600].map((w) => `${base}scenes/${name}-${w}.${fmt} ${w}w`).join(", ")

/**
 * The scene behind the letter: a real photo now, a painted plate (three layers) later.
 * Phones: the photo fills the screen. From 1024: a clear photo panel on the right (where the faces are)
 * over a soft, blurred fill of the same photo on the left, which is where the letter sits.
 * Graded with --scene-filter. Changes cross-fade (600 ms); nothing moves under reduced motion.
 */
export function Scene({ source, dim = false, className }: { source: SceneSource; dim?: boolean; className?: string }) {
  const key = "photo" in source ? source.photo : source.plate
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
          {"photo" in l.source ? <PhotoScene name={l.source.photo} priority={i === 0} onReady={() => ready(l.key)} /> : <PlateScene name={l.source.plate} fallback={l.source.fallback} onReady={() => ready(l.key)} />}
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
        <source type="image/avif" srcSet={set(name, "avif")} sizes="(min-width: 1024px) 60vw, 100vw" />
        <source type="image/webp" srcSet={set(name, "webp")} sizes="(min-width: 1024px) 60vw, 100vw" />
        <img ref={img} src={`${base}scenes/${name}-900.webp`} alt="" width={meta.w} height={meta.h} decoding="async"
          fetchPriority={priority ? "high" : "auto"} onLoad={onReady} className="size-full object-cover" />
      </picture>
    </>
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
