import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from "react"
import { Link, NavLink, Outlet, useLocation } from "react-router-dom"
import { BookOpen, CalendarDays, CircleHelp, Home, TrainFront } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLang } from "@/lib/lang"
import { useTheme } from "@/lib/theme"
import { useHousehold } from "@/lib/household"
import { pageOf, sceneFor } from "@/lib/scenes"
import { usePageTurn } from "@/lib/page-turn"
import { ModeSwitches } from "@/components/lantern-toggle"
import { Scene } from "@/components/letter/scene"
import { Letter, SignOff, useSceneDim } from "@/components/letter/letter"
import { Arrival, firstPhase, resetArrival } from "@/components/envelope"
// Desktop only, so they load after the first screen: the credit mark and the phone QR
const CreditMark = lazy(() => import("@/components/credit-mark").then((m) => ({ default: m.CreditMark })))
const PhoneQr = lazy(() => import("@/components/phone-qr").then((m) => ({ default: m.PhoneQr })))

// Five items for everyone. Our story shows their words, or the planner's layout with placeholders until they arrive.
const links = [
  { to: "/", key: "home", icon: Home },
  { to: "/the-day", key: "day", icon: CalendarDays },
  { to: "/travel", key: "travel", icon: TrainFront },
  { to: "/faqs", key: "faqs", icon: CircleHelp },
  { to: "/our-story", key: "story", icon: BookOpen },
] as const

/** Five items, rendered once: a dock on phones, a thin top bar from 768. A sage marker slides to the current page (200 ms). */
function Nav() {
  const { t } = useLang()
  const linksKey = links.map((l) => `${l.to}:${t.nav[l.key]}`).join("|")
  const { pathname } = useLocation()
  // Laptops: page changes are a view transition; phones have the page-turn track
  const wide = typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches
  const list = useRef<HTMLUListElement>(null)
  const [mark, setMark] = useState<{ x: number; w: number; h: number; y: number } | null>(null)
  useLayoutEffect(() => {
    const ul = list.current
    const place = () => {
      const a = ul?.querySelector<HTMLElement>("a.is-active")
      if (!a || !ul) return setMark(null)
      const r = a.getBoundingClientRect(), l = ul.getBoundingClientRect()
      setMark({ x: r.left - l.left, w: r.width, y: r.top - l.top, h: r.height })
    }
    place()
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(place)
    if (ul) observer?.observe(ul)
    const active = ul?.querySelector<HTMLElement>("a.is-active")
    if (active) observer?.observe(active)
    let cancelled = false
    document.fonts?.ready.then(() => { if (!cancelled) place() })
    return () => { cancelled = true; observer?.disconnect() }
  }, [pathname, linksKey])
  return (
    <nav aria-label="Main" className="site-nav">
      <ul ref={list}>
        {mark && <li aria-hidden className="nav-mark" style={{ transform: `translate(${mark.x}px, ${mark.y}px)`, width: mark.w, height: mark.h }} />}
        {links.map((l) => (
          <li key={l.to}>
            <NavLink to={l.to} end viewTransition={wide} className={({ isActive }) => cn("site-nav-link", isActive && "is-active")}>
              <l.icon className="size-5 md:hidden" aria-hidden />
              <span>{t.nav[l.key]}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}



/**
 * Scene behind, letter in front. No site footer: the letter ends with the sign-off, the sound and
 * Lantern switches, then the credit line. RSVP is a button (on the letter, and in the top bar from 768).
 */
export function Layout() {
  const { t } = useLang()
  const { theme } = useTheme()
  const { household } = useHousehold()
  const { pathname } = useLocation()
  const page = pageOf(pathname)
  const { dim } = useSceneDim()
  const replied = Boolean(household?.respondedAt)
  // Sealed envelope on a first visit: their photo behind it, the dock and top bar hidden until it opens
  const [sealed, setSealed] = useState(() => firstPhase(page === "home") === "sealed")
  usePageTurn(!sealed)
  // "Put it back in the envelope" (Home): seal it again; tapping opens it as on the first visit
  const [resealed, setResealed] = useState(0)
  useEffect(() => {
    const on = () => { resetArrival(); window.scrollTo(0, 0); setSealed(true); setResealed((n) => n + 1) }
    window.addEventListener("ng-reseal", on)
    return () => window.removeEventListener("ng-reseal", on)
  }, [])
  useEffect(() => {
    document.documentElement.toggleAttribute("data-sealed", sealed)
    return () => document.documentElement.removeAttribute("data-sealed")
  }, [sealed])
  return (
    <>
      <a href="#letter" className="skip-link">{t.letter.skip}</a>
      <Scene source={sceneFor(theme)} dim={dim} />
      {/* Phones (v3 U): the same scene again, clipped to the strip from 8px above the dock down. The scene never
          moves, so the copy matches it exactly and the letter seems to end 8px above the dock, even on a bounce. */}
      {!sealed && <Scene source={sceneFor(theme)} dim={dim} className="scene-band" />}
      <header className="site-bar">
        <Link to="/" className="site-mark hidden md:inline">{t.meta.shortTitle}</Link>
        <Nav />
        {!replied && <Link to="/?rsvp=1" className="btn-primary site-rsvp hidden h-11 items-center rounded-(--button-radius) px-5 font-label text-body font-medium md:inline-flex">{t.nav.rsvp}</Link>}
        <ModeSwitches className="chrome-lantern" />
      </header>

      <main className="letter-wrap">
        <Arrival key={resealed} sealedAgain={resealed > 0} enabled={page === "home"} onOpened={() => setSealed(false)}>
          <Letter id="letter" tabIndex={-1} data-page={page}>
            <ModeSwitches className="letter-lantern" />
            <Suspense>
              <div key={pathname} className="letter-body">
                <Outlet />
              </div>
            </Suspense>
            {page === "home" && <SignOff action={page === "home" && !sealed
              // A small delight (v3 S): fold the letter back into the envelope; tap it to open again
              ? <button type="button" className="btn-text -my-3 py-3 text-small" onClick={() => window.dispatchEvent(new Event("ng-reseal"))}>{t.home.reseal}</button>
              : null} foot={!sealed && <Suspense><CreditMark foot /></Suspense>} />}
          </Letter>
        </Arrival>
        {/* Phones: the made-by mark waits in the hidden strip under the letter. A bounce past the end shows it;
            on a short page it simply sits under the letter. */}
        {!sealed && <Suspense><CreditMark inline /></Suspense>}
      </main>
      <Suspense><CreditMark /></Suspense>
      {page === "home" && !sealed && <Suspense><PhoneQr /></Suspense>}
    </>
  )
}
