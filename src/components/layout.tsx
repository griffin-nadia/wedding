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
import { letterScroll } from "@/lib/frame"
// Loaded after the first screen: the credit and the phone QR
const CreditMark = lazy(() => import("@/components/credit-mark").then((m) => ({ default: m.CreditMark })))
const PhoneQr = lazy(() => import("@/components/phone-qr").then((m) => ({ default: m.PhoneQr })))

// Five items for everyone: Home first (the way back to the start), FAQs last (reference). Our story shows their words, or the planner's layout with placeholders until they arrive.
const links = [
  { to: "/", key: "home", icon: Home },
  { to: "/the-day", key: "day", icon: CalendarDays },
  { to: "/travel", key: "travel", icon: TrainFront },
  { to: "/our-story", key: "story", icon: BookOpen },
  { to: "/faqs", key: "faqs", icon: CircleHelp },
] as const

/** Five items, rendered once: a dock on phones, a thin top bar from 768. A sage marker slides to the current page (200 ms). */
export function Nav() {
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
 * Scene behind, letter in front, and one top bar over both on every screen: the mark, the nav from 768, RSVP from
 * 768, then あ / A, music and the sun or moon. The bar is the only thing that stays put and never changes; the card
 * under it is a fixed frame whose content scrolls inside it.
 * No site footer: the letter ends with the sign-off.
 */
export function Layout() {
  const { t } = useLang()
  const { theme } = useTheme()
  const { household } = useHousehold()
  const { pathname } = useLocation()
  const page = pageOf(pathname)
  const { dim } = useSceneDim()
  const replied = Boolean(household?.respondedAt)
  // Each page its own title (WCAG 2.4.2), so a screen reader hears where a page change landed: "The day · Griffin & Nadia"
  useEffect(() => {
    const key = page === "qa" ? "faqs" : page
    document.title = key === "home" ? t.meta.title : `${t.nav[key]} · ${t.meta.title}`
  }, [page, t])
  // Sealed envelope on a first visit: their photo behind it, the dock and top bar hidden until it opens
  const [sealed, setSealed] = useState(() => firstPhase(page === "home") === "sealed")
  usePageTurn(!sealed)
  // "Seal it again" (Home): the card goes back into the envelope (the whole journey, envelope.tsx); tapping opens it as on the first visit
  const [resealed, setResealed] = useState(0)
  useEffect(() => {
    const on = () => { resetArrival(); letterScroll()?.scrollTo(0, 0); setSealed(true); setResealed((n) => n + 1) }
    window.addEventListener("ng-reseal", on)
    return () => window.removeEventListener("ng-reseal", on)
  }, [])
  // A new page starts at its top (the card scrolls, not the window), unless a link asked for a section (#hash)
  useLayoutEffect(() => { if (!location.hash) letterScroll()?.scrollTo(0, 0) }, [pathname])
  useEffect(() => {
    document.documentElement.toggleAttribute("data-sealed", sealed)
    return () => document.documentElement.removeAttribute("data-sealed")
  }, [sealed])
  return (
    <>
      <a href="#letter" className="skip-link">{t.letter.skip}</a>
      <Scene source={sceneFor(theme)} dim={dim} />
      <header className="site-bar">
        <Link to="/" className="site-mark">{t.meta.shortTitle}</Link>
        <Nav />
        {!replied && <Link to="/?rsvp=1" className="btn-primary site-rsvp hidden h-11 items-center rounded-(--button-radius) px-(--button-pad) font-label text-body font-medium md:inline-flex">{t.nav.rsvp}</Link>}
        <ModeSwitches className="chrome-lantern" />
      </header>

      <main className="letter-wrap">
        <Arrival reseal={resealed} enabled={page === "home"} onOpened={() => setSealed(false)}>
          <Letter id="letter" tabIndex={-1} data-page={page}>
            {/* The card is a fixed frame between the bar and the dock; what's on it scrolls in here (18e) */}
            <div className="letter-scroll">
            <Suspense>
              <div key={pathname} className="letter-body">
                <Outlet />
              </div>
            </Suspense>
            {page === "home" && <SignOff action={page === "home" && !sealed
              // A small delight (v3 S): fold the letter back into the envelope; tap it to open again
              ? <button type="button" className="btn-text -my-3 py-3 text-small" onClick={() => window.dispatchEvent(new Event("ng-reseal"))}>{t.home.reseal}</button>
              : null} />}
            </div>
          </Letter>
        </Arrival>
      </main>
      <Suspense><CreditMark /></Suspense>
      {/* The same small card in the same corner on every page (run 19), not just Home: the link is theirs on any page */}
      {!sealed && <Suspense><PhoneQr /></Suspense>}
    </>
  )
}
