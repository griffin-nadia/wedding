import { createContext, useContext, useState, type ReactNode } from "react"

export type Theme = "autumn" | "lantern"

const KEY = "ng-theme"
const COLOURS: Record<Theme, string> = { autumn: "#f3e7d3", lantern: "#2e1b12" }

function apply(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme)
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", COLOURS[theme])
}

const Ctx = createContext<{ theme: Theme; setTheme: (t: Theme) => void } | null>(null)

/** Day (autumn) by default, whatever the device's setting; Lantern (night) is the switch, remembered once picked (run 26). */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => (document.documentElement.getAttribute("data-theme") === "lantern" ? "lantern" : "autumn"))
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
