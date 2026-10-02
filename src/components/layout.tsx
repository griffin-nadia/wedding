import { NavLink, Outlet, useLocation } from "react-router-dom"
import { CalendarDays, CircleHelp, Home, Lamp, Plane, Sun } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLang } from "@/lib/lang"
import { useTheme } from "@/lib/theme"

// 日本語 toggle hidden until the Japanese copy is proofread (needs-from-nadia.md).
const SHOW_JA = false

const links = [
  { to: "/", key: "home", icon: Home },
  { to: "/the-day", key: "day", icon: CalendarDays },
  { to: "/travel", key: "travel", icon: Plane },
  { to: "/qa", key: "qa", icon: CircleHelp },
] as const

export function Layout() {
  const { t, lang, setLang } = useLang()
  const { theme, setTheme } = useTheme()
  const lantern = theme === "lantern"
  const { pathname } = useLocation()
  return (
    <div className="min-h-dvh pb-[calc(4rem+env(safe-area-inset-bottom)+1.5rem)] md:pb-0">
      <header className="site-header mx-auto flex max-w-[60rem] items-center justify-between gap-4 px-4 py-3 md:px-8 md:py-4">
        <span className="font-display text-xl">{t.meta.shortTitle}</span>
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end className={({ isActive }) => cn(
              "relative inline-flex min-h-11 items-center rounded-full px-4 text-sm text-body transition-colors hover:text-foreground",
              isActive && "bg-secondary font-semibold text-foreground",
            )}>
              {({ isActive }) => (<>{isActive && <span aria-hidden className="mr-2 size-1.5 rounded-full bg-leaf" />}{t.nav[l.key]}</>)}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          {SHOW_JA && (
            <button type="button" onClick={() => setLang(lang === "en" ? "ja" : "en")}
              className="inline-flex min-h-11 items-center px-2 text-sm text-body hover:text-foreground" aria-label="Switch language">
              <span className={cn(lang === "en" && "font-bold text-foreground")}>EN</span> · <span className={cn(lang === "ja" && "font-bold text-foreground")}>日本語</span>
            </button>
          )}
          <button type="button" onClick={() => setTheme(lantern ? "autumn" : "lantern")} aria-pressed={lantern}
            className="inline-flex size-11 items-center justify-center rounded-full text-body transition-colors hover:bg-secondary hover:text-foreground"
            title={t.theme.label}>
            {lantern ? <Sun className="size-5" strokeWidth={1.6} aria-hidden /> : <Lamp className="size-5" strokeWidth={1.6} aria-hidden />}
            <span className="sr-only">{t.theme.label}</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[60rem] px-4 md:px-8">
        <div key={pathname} className="page-in">
          <Outlet />
        </div>
      </main>

      {/* Phone tab bar: 64px plus the safe area, labels always under icons */}
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_-8px_rgb(var(--shadow-tint)/0.2)] backdrop-blur md:hidden">
        <ul className="grid h-16 grid-cols-4 px-2">
          {links.map((l) => (
            <li key={l.to} className="flex">
              <NavLink to={l.to} end className={({ isActive }) => cn(
                "flex flex-1 flex-col items-center justify-center gap-1 text-[13px] text-muted-foreground",
                isActive && "font-semibold text-foreground",
              )}>
                {({ isActive }) => (<>
                  <span className={cn("relative flex h-7 w-14 items-center justify-center rounded-full transition-colors", isActive && "bg-secondary")}>
                    <l.icon className="size-6" strokeWidth={1.6} aria-hidden />
                    {isActive && <span aria-hidden className="absolute -right-1 top-1 size-1.5 rounded-full bg-leaf" />}
                  </span>
                  {t.nav[l.key]}
                </>)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
