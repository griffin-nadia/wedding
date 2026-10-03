import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from "react"
import { Link, NavLink, Outlet, useLocation } from "react-router-dom"
import { BookOpen, CalendarDays, CircleHelp, Home, TrainFront } from "lucide-react"
import { useContent } from "@/lib/content"
import { cn } from "@/lib/utils"
import { useLang } from "@/lib/lang"
import { useTheme } from "@/lib/theme"
import { useHousehold } from "@/lib/household"
import { arrivalScene, pageOf, sceneFor, sceneKind } from "@/lib/scenes"
import { setStoryLetter, usePageTurn, usePaperScroll } from "@/lib/page-turn"
import { usePaperGL } from "@/components/letter/use-paper-gl"
import { ModeSwitches } from "@/components/lantern-toggle"
import { HomeCountdown } from "@/components/home-countdown"
import { Scene } from "@/components/letter/scene"
import { Letter, SignOff, useSceneDim } from "@/components/letter/letter"
import { Arrival, firstPhase, resetArrival } from "@/components/envelope"
import { SiteTune } from "@/tune/launcher"
// Desktop only, so it loads after the first screen
// Desktop only too: the credit mark and the Desk preview tabs
const CreditMark = lazy(() => import("@/components/credit-mark").then((m) => ({ default: m.CreditMark })))
const DeskTabs = lazy(() => import("@/components/desk-tabs").then((m) => ({ default: m.DeskTabs })))
const PhoneQr = lazy(() => import("@/components/phone-qr").then((m) => ({ default: m.PhoneQr })))
import { useOption } from "@/lib/options"

const baseLinks = [
  { to: "/", key: "home", icon: Home },
  { to: "/the-day", key: "day", icon: CalendarDays },
  { to: "/travel", key: "travel", icon: TrainFront },
  { to: "/faqs", key: "faqs", icon: CircleHelp },
] as const
// The stamp book (December, walk scene only) loads only when the lab turns it on
const StampBook = lazy(() => import("@/components/stamp-book").then((m) => ({ default: m.StampBook })))
const storyLink = { to: "/our-story", key: "story", icon: BookOpen } as const
const MECHANICS = ["glow", "inkset", "countin", "thread", "hoverprint", "haptics"]

/** Four items, rendered once: a dock on phones, a thin top bar from 768. A sage marker slides to the current page (200 ms). */
function Nav() {
  const { t } = useLang()
  const { story } = useContent()
  const links = story.length ? [...baseLinks, storyLink] : baseLinks
  useEffect(() => { setStoryLetter(story.length > 0) }, [story.length])
  const { pathname } = useLocation()
  const list = useRef<HTMLUListElement>(null)
  const [mark, setMark] = useState<{ x: number; w: number; h: number; y: number } | null>(null)
  useLayoutEffect(() => {
    const place = () => {
      const a = list.current?.querySelector<HTMLElement>("a.is-active")
      if (!a || !list.current) return setMark(null)
      const r = a.getBoundingClientRect(), l = list.current.getBoundingClientRect()
      setMark({ x: r.left - l.left, w: r.width, y: r.top - l.top, h: r.height })
    }
    place()
    window.addEventListener("resize", place)
    document.fonts?.ready.then(place)
    return () => window.removeEventListener("resize", place)
  }, [pathname])
  return (
    <nav aria-label="Main" className="site-nav">
      <ul ref={list}>
        {mark && <li aria-hidden className="nav-mark" style={{ transform: `translate(${mark.x}px, ${mark.y}px)`, width: mark.w, height: mark.h }} />}
        {links.map((l) => (
          <li key={l.to}>
            <NavLink to={l.to} end className={({ isActive }) => cn("site-nav-link", isActive && "is-active")}>
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
  const kind = sceneKind(useOption("scene"), useOption("preset"))
  // Sealed envelope on a first visit: their photo behind it, the dock and top bar hidden until it opens
  const [sealed, setSealed] = useState(() => firstPhase(page === "home") === "sealed")
  usePageTurn(!sealed)
  const glOption = useOption("gl")
  const stampsOn = useOption("stamps") === "on"
  usePaperGL(!sealed && kind === "paper" && glOption !== "off")
  usePaperScroll()
  // "Put it back in the envelope" (Home): seal it again; tapping opens it as on the first visit
  const [resealed, setResealed] = useState(0)
  useEffect(() => {
    const on = () => { resetArrival(); window.scrollTo(0, 0); setSealed(true); setResealed((n) => n + 1) }
    window.addEventListener("ng-reseal", on)
    return () => window.removeEventListener("ng-reseal", on)
  }, [])
  const signOffEverywhere = useOption("signoff") === "all"
  // Kit mechanics (v3 U): their code loads only once one of their Options switches is on
  useEffect(() => {
    const check = () => { if (MECHANICS.some((k) => document.documentElement.hasAttribute(`data-opt-${k}`))) void import("@/mechanics").then((m) => m.install()) }
    check(); addEventListener("ng-tune", check)
    return () => removeEventListener("ng-tune", check)
  }, [])
  useEffect(() => {
    document.documentElement.toggleAttribute("data-sealed", sealed)
    return () => document.documentElement.removeAttribute("data-sealed")
  }, [sealed])
  return (
    <>
      <a href="#letter" className="skip-link">{t.letter.skip}</a>
      <Scene source={sealed ? arrivalScene(theme) : sceneFor(page, theme, kind)} dim={dim} />
      {/* Phones (v3 U): the same scene again, clipped to the strip from 8px above the dock down. The scene never
          moves, so the copy matches it exactly and the letter seems to end 8px above the dock, even on a bounce. */}
      {!sealed && <Scene source={sceneFor(page, theme, kind)} dim={dim} className="scene-band" />}
      <header className="site-bar">
        <Link to="/" className="site-mark hidden md:inline">{t.meta.shortTitle}</Link>
        <Nav />
        {!replied && <Link to="/?rsvp=1" className="btn-primary site-rsvp hidden h-11 items-center rounded-(--button-radius) px-5 font-label text-(length:--type-ui-size) font-medium md:inline-flex">{t.nav.rsvp}</Link>}
        {stampsOn && <Suspense><StampBook /></Suspense>}
        <ModeSwitches className="chrome-lantern" />
      </header>

      <main className="letter-wrap">
        <Arrival key={resealed} sealedAgain={resealed > 0} enabled={page === "home"} onOpened={() => setSealed(false)}>
          <Letter id="letter" tabIndex={-1} data-page={page}>
            <ModeSwitches className="letter-lantern" />
            <div key={pathname} className="letter-body">
              <Outlet />
            </div>
            {(page === "home" || signOffEverywhere) && <SignOff action={page === "home" && !sealed
              // A small delight (v3 S): fold the letter back into the envelope; tap it to open again
              ? <button type="button" className="btn-text -my-3 py-3 text-sm" onClick={() => window.dispatchEvent(new Event("ng-reseal"))}>{t.home.reseal}</button>
              : null} />}
          </Letter>
        </Arrival>
        {page === "home" && !sealed && <HomeCountdown />}
        {/* Phones: the made-by mark waits in the hidden strip under the letter. A bounce past the end shows it;
            on a short page it simply sits under the letter. */}
        {!sealed && <Suspense><CreditMark inline /></Suspense>}
      </main>
      {!sealed && <Suspense><DeskTabs /></Suspense>}
      <Suspense><PhoneQr /></Suspense>
      <Suspense><CreditMark /></Suspense>
      <SiteTune />
    </>
  )
}
