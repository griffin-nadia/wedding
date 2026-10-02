import { NavLink, Outlet } from "react-router-dom"
import { CalendarDays, CircleHelp, Home, Plane } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLang } from "@/lib/lang"

const links = [
  { to: "/", key: "home", icon: Home },
  { to: "/the-day", key: "day", icon: CalendarDays },
  { to: "/travel", key: "travel", icon: Plane },
  { to: "/qa", key: "qa", icon: CircleHelp },
] as const

export function Layout() {
  const { t, lang, setLang } = useLang()
  return (
    <div className="min-h-dvh pb-24 md:pb-0">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-10">
        <span className="font-display text-xl">{t.meta.shortTitle}</span>
        <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end className={({ isActive }) => cn("text-sm text-body hover:text-foreground", isActive && "font-bold text-primary")}>
              {t.nav[l.key]}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => setLang(lang === "en" ? "ja" : "en")}
          className="text-sm text-body hover:text-foreground"
          aria-label="Switch language"
        >
          <span className={cn(lang === "en" && "font-bold text-foreground")}>EN</span> · <span className={cn(lang === "ja" && "font-bold text-foreground")}>日本語</span>
        </button>
      </header>

      <main className="mx-auto max-w-6xl px-5 md:px-10">
        <Outlet />
      </main>

      {/* Phone tab bar: labels always under icons */}
      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
        <ul className="grid grid-cols-4">
          {links.map((l) => (
            <li key={l.to}>
              <NavLink to={l.to} end className={({ isActive }) => cn("flex flex-col items-center gap-1 py-3 text-[11px] text-muted-foreground", isActive && "font-bold text-primary")}>
                <l.icon className="size-5" strokeWidth={1.5} aria-hidden />
                {t.nav[l.key]}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
