import { useEffect, useRef, useState } from "react"
import { SCENES, type SceneSource } from "@/lib/scenes"
import { cn } from "@/lib/utils"

const base = import.meta.env.BASE_URL
const set = (name: string, fmt: string) => [800, 1200, 1600, 2000, 2400].map((w) => `${base}scenes/${name}-${w}.${fmt} ${w}w`).join(", ")
// From 1280: the 16:9 version (extended in Photoshop) with them in the right third, so it can fill the screen
const wideSet = (name: string, fmt: string) => [1600, 2400].map((w) => `${base}scenes/${name}-wide-${w}.${fmt} ${w}w`).join(", ")
const WIDE = "(min-width: 1280px)"

/**
 * The scene behind the letter: their photo.
 * Phones: the photo fills the screen. From 1280: the wide (16:9) version of the same photo fills the screen,
 * with them in the right third and the letter over the calm left side. The sealed envelope keeps the panel.
 * Graded with --scene-filter. Changes cross-fade (600 ms); nothing moves under reduced motion.
 */
export function Scene({ source, dim = false, className }: { source: SceneSource; dim?: boolean; className?: string }) {
  return <PhotoPair name={source.photo} dim={dim} className={className} />
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
  const drift = useRef<HTMLDivElement>(null)
  // Mouse drift (Jehan, 6 Oct): the photo leans a few px toward the cursor and settles slowly.
  // Laptops with a fine pointer only; the CSS (and the still photo) is untouched anywhere else.
  useEffect(() => {
    if (!window.matchMedia("(min-width: 1024px) and (hover: hover) and (pointer: fine)").matches) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const el = drift.current
    if (!el) return
    const on = (e: PointerEvent) => {
      el.style.setProperty("--sx", ((e.clientX / innerWidth - 0.5) * 12).toFixed(1))
      el.style.setProperty("--sy", ((e.clientY / innerHeight - 0.5) * 8).toFixed(1))
    }
    window.addEventListener("pointermove", on, { passive: true })
    return () => window.removeEventListener("pointermove", on)
  }, [])
  useEffect(() => {
    const warm = (event: Event) => {
      const photo = (event as CustomEvent<string>).detail
      if (PAIR.includes(photo as (typeof PAIR)[number]) && photo !== name) setBoth(true)
    }
    window.addEventListener("ng-scene-warm", warm)
    return () => window.removeEventListener("ng-scene-warm", warm)
  }, [name])
  useEffect(() => {
    const go = () => setBoth(true)
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback
    if (document.readyState === "complete") { if (idle) idle(go); else setTimeout(go, 1500) }
    else window.addEventListener("load", () => (idle ? idle(go) : setTimeout(go, 1500)), { once: true })
  }, [])
  return (
    <div ref={drift} aria-hidden className={cn("scene fixed inset-0 -z-10 overflow-hidden bg-[var(--scene-scrim)]", dim && "scene-dim", className)}>
      {PAIR.filter((n) => n === name || both).map((n) => (
        <div key={n} data-photo={n} className={cn("scene-layer absolute inset-0", n === name ? "opacity-100" : "opacity-0")}>
          <PhotoScene name={n} priority={n === name} onReady={n === name ? dropShell : () => {}} />
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
      <div className="scene-fill absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${meta.lqip})`, ["--scene-wide-lqip" as string]: meta.wide ? `url(${meta.wide.lqip})` : undefined }} />
      <picture className="scene-photo absolute inset-0" data-wide={meta.wide ? "" : undefined}>
        {meta.wide && <source media={WIDE} type="image/avif" srcSet={wideSet(name, "avif")} sizes="100vw" />}
        {meta.wide && <source media={WIDE} type="image/webp" srcSet={wideSet(name, "webp")} sizes="100vw" />}
        <source type="image/avif" srcSet={set(name, "avif")} sizes="max(100vw, 75vh)" />
        <source type="image/webp" srcSet={set(name, "webp")} sizes="max(100vw, 75vh)" />
        <img ref={img} src={`${base}scenes/${name}-1600.webp`} alt="" width={meta.w} height={meta.h} decoding="async"
          fetchPriority={priority ? "high" : "auto"} onLoad={onReady} className="size-full object-cover" />
      </picture>
    </>
  )
}
