import { useEffect, useRef, useState } from "react"
import { HomeCountdown } from "@/components/home-countdown"
import { Letter, SignOff } from "@/components/letter/letter"
import { COUPLE } from "@/content/en"
import { loop } from "@/lib/frame"
import { useHousehold } from "@/lib/household"
import { useLang } from "@/lib/lang"
import { photoFor } from "@/lib/scenes"
import { useTheme } from "@/lib/theme"
import { getSpeed, still } from "../../motion"

/**
 * Their photo full screen, the Home letter floating over it, in depth. Scrolling moves the photo at a third of the
 * letter's speed, and the scrim deepens a little as the letter comes up. On laptops the pointer, on phones the tilt,
 * pull the layers a few px apart: the photo one way, the letter and the seal the other. On iPhone the tilt asks
 * first, behind a button. Everything eases through the site's one frame loop, at the lab's speed. Reduced motion:
 * none of it, just the letter over the still photo.
 */
const css = `
.x-home-parallax { position: relative; min-height: 100svh; isolation: isolate; }
.x-home-parallax-photo { position: fixed; z-index: -2; left: -24px; right: -24px; top: -24px; height: calc(100lvh + 34vh);
  @media (max-width: 767px) { top: -18vh; height: calc(100lvh + 40vh); } will-change: transform; background: var(--scene-scrim); }
.x-home-parallax-photo img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 50%; filter: var(--scene-filter); }
@media (min-width: 1280px) { .x-home-parallax-photo img { object-position: 70% 40%; } }
.x-home-parallax-scrim { position: fixed; z-index: -1; inset: 0; pointer-events: none;
  background: linear-gradient(to bottom, transparent 30%, color-mix(in oklab, var(--scene-scrim) 70%, transparent));
  opacity: calc(0.35 + var(--x-home-parallax-dim, 0) * 0.65); }
.x-home-parallax-stage { padding: 72svh 12px 40svh; }
@media (min-width: 768px) { .x-home-parallax-stage { padding: 34svh 24px 36svh; } }
@media (min-width: 1024px) { .x-home-parallax-stage { padding-left: var(--letter-left); } }
.x-home-parallax-float { position: relative; will-change: transform; }
.x-home-parallax .letter { min-height: 0; }
.x-home-parallax-seal { position: absolute; z-index: 2; top: -22px; right: 18px; width: 64px; height: 64px; pointer-events: none; will-change: transform; filter: drop-shadow(0 4px 8px rgb(0 0 0 / 0.25)); }
@media (min-width: 1024px) { .x-home-parallax-float { max-width: var(--letter-width); } }
.x-home-parallax-tilt { position: fixed; z-index: 5; left: 50%; bottom: max(16px, env(safe-area-inset-bottom)); translate: -50% 0; min-height: 44px; padding: 0 var(--space-5);
  border-radius: var(--radius-pill); background: color-mix(in oklab, var(--letter-bg) 92%, transparent); color: var(--ink); box-shadow: var(--elevation-paper);
  font: 500 var(--type-small-size) / 1 var(--font-label); outline: 2px solid transparent; outline-offset: 2px; }
.x-home-parallax-tilt:focus-visible { outline-color: var(--input-focus); }
`

const base = import.meta.env.BASE_URL
const set = (name: string, wide = false) => (wide ? [1600, 2400].map((w) => `${base}scenes/${name}-wide-${w}.webp ${w}w`) : [800, 1200, 1600, 2000, 2400].map((w) => `${base}scenes/${name}-${w}.webp ${w}w`)).join(", ")
type Perm = { requestPermission?: () => Promise<"granted" | "denied"> }

export default function HomeParallax() {
  const { t } = useLang()
  const { theme } = useTheme()
  const { household } = useHousehold()
  const root = useRef<HTMLDivElement>(null)
  const photo = useRef<HTMLDivElement>(null)
  const float = useRef<HTMLDivElement>(null)
  const seal = useRef<HTMLImageElement>(null)
  const target = useRef({ x: 0, y: 0 })
  // iPhone asks before it shares the tilt, so there it waits behind a button
  const [askTilt, setAskTilt] = useState(() => !still() && matchMedia("(pointer: coarse)").matches && typeof (globalThis.DeviceOrientationEvent as unknown as Perm | undefined)?.requestPermission === "function")
  const [tiltOn, setTiltOn] = useState(false)

  useEffect(() => {
    if (still()) return
    const move = (e: PointerEvent) => { if (e.pointerType === "mouse") target.current = { x: e.clientX / innerWidth - 0.5, y: e.clientY / innerHeight - 0.5 } }
    const tilt = (e: DeviceOrientationEvent) => {
      target.current = { x: Math.max(-0.5, Math.min(0.5, (e.gamma ?? 0) / 50)), y: Math.max(-0.5, Math.min(0.5, ((e.beta ?? 45) - 45) / 50)) }
    }
    addEventListener("pointermove", move, { passive: true })
    addEventListener("deviceorientation", tilt)
    let x = 0, y = 0, sy = scrollY
    const stop = loop(() => {
      // The same easing at any lab speed: a 10% step per frame at 1x
      const k = 1 - Math.pow(0.9, getSpeed())
      x += (target.current.x - x) * k; y += (target.current.y - y) * k
      sy += (scrollY - sy) * Math.min(1, k * 3)
      const vh = innerHeight
      if (photo.current) photo.current.style.transform = `translate3d(${(-x * 18).toFixed(2)}px, ${(-Math.min(sy, vh) * 0.2 - y * 14).toFixed(2)}px, 0) scale(1.02)`
      if (float.current) float.current.style.transform = `translate3d(${(x * 10).toFixed(2)}px, ${(y * 8).toFixed(2)}px, 0)`
      if (seal.current) seal.current.style.transform = `translate3d(${(x * 16).toFixed(2)}px, ${(y * 14).toFixed(2)}px, 0) rotate(${(-8 + x * 6).toFixed(2)}deg)`
      root.current?.style.setProperty("--x-home-parallax-dim", Math.min(1, sy / vh).toFixed(3))
    })
    return () => { stop(); removeEventListener("pointermove", move); removeEventListener("deviceorientation", tilt) }
  }, [tiltOn])

  const askForTilt = async () => {
    const ask = (globalThis.DeviceOrientationEvent as unknown as Perm | undefined)?.requestPermission
    try { if (ask && (await ask()) === "granted") setTiltOn(true) } catch { /* declined: the scroll depth still works */ }
    setAskTilt(false)
  }

  const name = photoFor(theme)
  const names = household ? household.guests.map((g) => (g.plusOne && /^(guest|plus one|\+1)?$/i.test(g.firstName.trim()) ? t.home.yourPlusOne : g.firstName)).filter(Boolean) : []
  const dear = t.home.dearNames(names) || household?.displayName || ""
  return (
    <div ref={root} className="x-home-parallax">
      <style>{css}</style>
      <div ref={photo} aria-hidden className="x-home-parallax-photo">
        <picture>
          <source media="(min-width: 1280px)" type="image/webp" srcSet={set(name, true)} sizes="100vw" />
          <source type="image/webp" srcSet={set(name)} sizes="max(100vw, 75vh)" />
          <img src={`${base}scenes/${name}-1600.webp`} alt="" decoding="async" fetchPriority="high" />
        </picture>
      </div>
      <div aria-hidden className="x-home-parallax-scrim" />
      <main className="x-home-parallax-stage">
        <div ref={float} className="x-home-parallax-float">
          <img ref={seal} src={`${base}art/seal/wax-seal-128.webp`} alt="" className="x-home-parallax-seal" style={{ transform: "rotate(-8deg)" }} />
          <Letter>
            <header className="flex flex-col gap-4">
              <h1 className="names" aria-label={`${COUPLE.first} & ${COUPLE.second}`}>
                <span aria-hidden>{COUPLE.first} <span className="text-primary">&amp;</span><br />{COUPLE.second}</span>
              </h1>
              <p className="date-badge">{t.home.dateLine}</p>
            </header>
            <p className="max-w-[34em]"><span className="text-foreground">{t.home.dear(dear)}</span> {t.home.greetingLine}</p>
            <HomeCountdown />
            <SignOff />
          </Letter>
        </div>
      </main>
      {askTilt && <button type="button" className="x-home-parallax-tilt press" onClick={askForTilt}>Tilt your phone to look around</button>}
    </div>
  )
}
