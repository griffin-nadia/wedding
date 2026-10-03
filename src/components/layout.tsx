import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from "react"
import { Link, NavLink, Outlet, useLocation } from "react-router-dom"
import { BookOpen, CalendarDays, CircleHelp, Home, TrainFront } from "lucide-react"
import { useContent } from "@/lib/content"
import { cn } from "@/lib/utils"
import { useLang } from "@/lib/lang"
import { useTheme } from "@/lib/theme"
import { useHousehold } from "@/lib/household"
import { arrivalScene, pageOf, sceneFor, sceneKind } from "@/lib/scenes"
import { CreditMark } from "@/components/credit-mark"
import { setStoryLetter, usePageTurn, usePaperScroll } from "@/lib/page-turn"
import { usePaperGL } from "@/components/letter/use-paper-gl"
import { LanternToggle } from "@/components/lantern-toggle"
import { Scene } from "@/components/letter/scene"
import { Letter, SignOff, useSceneDim } from "@/components/letter/letter"
import { Arrival, firstPhase } from "@/components/envelope"
import { Qr } from "@/components/qr"
import { SiteTune } from "@/tune/launcher"
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

/** Four items, rendered once: a dock on phones, a thin top bar from 768. A sage marker slides to the current page (200 ms). */
function Nav() {
  const { t } = useLang()
  const { story } = useContent()
  const links = story.length ? [...baseLinks, storyLink] : baseLinks
  useEffect(() => { setStoryLetter(story.length > 0) }, [story.length])
  const { pathname } = useLocation()
  const list = useRef<HTMLUListElement>(null)
  const [mark, setMark] = useState<{ x: number; w: number; h: number; y: number } | null>(null)
  const [swipe, setSwipe] = useState(0)
  useEffect(() => {
    const on = (e: Event) => setSwipe((e as CustomEvent<number>).detail)
    window.addEventListener("ng-swipe", on)
    return () => window.removeEventListener("ng-swipe", on)
  }, [])
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
        {mark && <li aria-hidden className="nav-mark" style={{ transform: `translate(${mark.x + swipe * mark.w}px, ${mark.y}px)`, width: mark.w, height: mark.h, transition: swipe ? "none" : undefined }} />}
        {links.map((l) => (
          <li key={l.to}>
            <NavLink to={l.to} end className={({ isActive }) => cn("site-nav-link", isActive && "is-active")}>
              <l.icon className="size-6 md:hidden" strokeWidth={1.6} aria-hidden />
              <span>{t.nav[l.key]}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/** From 1024 only (never rendered on phones): a small "Open on your phone" card at the bottom right of the scene. */
function PhoneQr() {
  const { t } = useLang()
  const { household } = useHousehold()
  const [wide, setWide] = useState(() => window.matchMedia("(min-width: 1024px)").matches)
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)")
    const on = () => setWide(mq.matches)
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])
  if (!wide || !household) return null
  const url = `${location.origin}${import.meta.env.BASE_URL}?h=${household.token}`
  return (
    <aside aria-label={t.letter.phoneTitle} className="phone-qr">
      <Qr value={url} label={t.letter.phoneTitle} className="size-24 shrink-0 text-foreground" />
      <div className="flex flex-col gap-1">
        <p className="label-caps text-foreground">{t.letter.phoneTitle}</p>
        <p className="text-sm">{t.letter.phoneBody}</p>
      </div>
    </aside>
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
  useEffect(() => {
    document.documentElement.toggleAttribute("data-sealed", sealed)
    return () => document.documentElement.removeAttribute("data-sealed")
  }, [sealed])
  return (
    <>
      <a href="#letter" className="skip-link">{t.letter.skip}</a>
      <Scene source={sealed ? arrivalScene(theme) : sceneFor(page, theme, kind)} dim={dim} />
      <header className="site-bar">
        <Link to="/" className="site-mark hidden md:inline">{t.meta.shortTitle}</Link>
        <Nav />
        {!replied && <Link to="/?rsvp=1" className="btn-primary site-rsvp hidden h-11 items-center rounded-(--button-radius) px-5 font-label text-(length:--type-ui-size) font-medium md:inline-flex">{t.nav.rsvp}</Link>}
        {stampsOn && <Suspense><StampBook /></Suspense>}
        <LanternToggle className="chrome-lantern" />
      </header>

      <main className="letter-wrap">
        <Arrival enabled={page === "home"} onOpened={() => setSealed(false)}>
          <Letter id="letter" tabIndex={-1} data-page={page}>
            <div key={pathname} className="letter-body">
              <Outlet />
            </div>
            <SignOff />
          </Letter>
        </Arrival>
      </main>
      <PhoneQr />
      <CreditMark />
      <SiteTune />
    </>
  )
}
