import { useEffect, useState } from "react"

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

/** Light (autumn) or Lantern mode. Follows the device until the guest picks one, then remembers it. */
export function useTheme() {
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
  return { theme, setTheme }
}
