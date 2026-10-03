import { useRef } from "react"
import { NavLink, Outlet, useLocation } from "react-router-dom"
import { BedDouble, CalendarDays, CircleHelp, Home, Lamp, Sun, TrainFront } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLang } from "@/lib/lang"
import { useTheme } from "@/lib/theme"
import { pageOf, sceneFor } from "@/lib/scenes"
import { Scene } from "@/components/letter/scene"
import { Letter, SignOff, useSceneDim } from "@/components/letter/letter"
import { Arrival } from "@/components/envelope"

const links = [
  { to: "/", key: "home", icon: Home },
  { to: "/the-day", key: "day", icon: CalendarDays },
  { to: "/getting-there", key: "travel", icon: TrainFront },
  { to: "/stay", key: "stay", icon: BedDouble },
  { to: "/qa", key: "qa", icon: CircleHelp },
] as const

/**
 * Scene behind, letter in front. The nav is rendered once: a thin bar along the top from 768,
 * a tab bar along the bottom on phones. No site footer; the letter ends with the sign-off.
 */
export function Layout() {
  const { t } = useLang()
  const { theme, setTheme } = useTheme()
  const lantern = theme === "lantern"
  const { pathname } = useLocation()
  const page = pageOf(pathname)
  const { dim } = useSceneDim()
  // Page content fades on page changes only: the first page paints straight away
  const firstPath = useRef(pathname)
  return (
    <>
      <a href="#letter" className="skip-link">{t.letter.skip}</a>
      <Scene source={sceneFor(page, theme)} dim={dim} />
      <header className="site-bar">
        <span className="site-mark hidden md:inline">{t.meta.shortTitle}</span>
        <nav aria-label="Main" className="site-nav">
          <ul>
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
        <button type="button" onClick={() => setTheme(lantern ? "autumn" : "lantern")} aria-pressed={lantern} title={t.theme.label}
          className="theme-toggle press">
          {lantern ? <Sun className="size-5" strokeWidth={1.6} aria-hidden /> : <Lamp className="size-5" strokeWidth={1.6} aria-hidden />}
          <span className="sr-only">{t.theme.label}</span>
        </button>
      </header>

      <main className="letter-wrap">
        <Arrival enabled={page === "home"}>
          <Letter id="letter" tabIndex={-1} data-page={page}>
            <div key={pathname} className={cn("letter-body", pathname !== firstPath.current && "page-in")}>
              <Outlet />
            </div>
            <SignOff />
          </Letter>
        </Arrival>
      </main>
    </>
  )
}
