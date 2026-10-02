import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

export type Theme = "autumn" | "lantern"

const KEY = "ng-theme"
const COLOURS: Record<Theme, string> = { autumn: "#f3e7d3", lantern: "#22160e" }

function apply(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme)
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", COLOURS[theme])
}

function saved(): Theme | null {
  try {
    const v = localStorage.getItem(KEY)
    return v === "autumn" || v === "lantern" ? v : null
  } catch {
    return null
  }
}

const Ctx = createContext<{ theme: Theme; setTheme: (t: Theme) => void } | null>(null)

/** Light (autumn) or Lantern mode. Follows the device until the guest picks one, then remembers it. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => (document.documentElement.getAttribute("data-theme") === "lantern" ? "lantern" : "autumn"))
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)")
    if (!mq) return
    const follow = () => {
      if (saved()) return
      const next: Theme = mq.matches ? "lantern" : "autumn"
      apply(next)
      setThemeState(next)
    }
    mq.addEventListener("change", follow)
    return () => mq.removeEventListener("change", follow)
  }, [])
  const setTheme = (next: Theme) => {
    apply(next)
    setThemeState(next)
    try { localStorage.setItem(KEY, next) } catch { /* private mode: still switches for this visit */ }
  }
  return <Ctx.Provider value={{ theme, setTheme }}>{children}</Ctx.Provider>
}

export function useTheme() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider")
  return ctx
}
