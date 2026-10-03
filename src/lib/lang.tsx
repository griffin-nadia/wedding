import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { getContent, loadJapanese, type Lang } from "@/content"

const KEY = "ng-lang"
const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: ReturnType<typeof getContent> } | null>(null)

// The Japanese font files (hundreds of small subsets) only load when someone picks 日本語.
let jaFonts: Promise<unknown> | null = null
function loadJapaneseFonts() {
  jaFonts ??= Promise.all([
    import("@fontsource/zen-old-mincho/400.css"),
    import("@fontsource/klee-one/400.css"),
  ])
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try { return (localStorage.getItem(KEY) as Lang) || "en" } catch { return "en" }
  })
  const [, setLoaded] = useState(0)
  useEffect(() => {
    if (lang !== "ja") return
    loadJapaneseFonts()
    void loadJapanese().then(() => setLoaded((n) => n + 1))
    document.documentElement.lang = lang
  }, [lang])
  // Crew preview (v3 S): the Options panel's Language switch, until the Japanese is checked and guests get one
  useEffect(() => {
    // Only follow the Options switch when it changes, so it never undoes the あ / A button
    let prev = document.documentElement.getAttribute("data-opt-lang")
    const on = () => {
      const v = document.documentElement.getAttribute("data-opt-lang")
      if (v === prev) return
      prev = v; setLangState(v === "ja" ? "ja" : "en"); document.documentElement.lang = v === "ja" ? "ja" : "en"
    }
    window.addEventListener("ng-tune", on)
    if (prev === "ja") setLangState("ja")
    return () => window.removeEventListener("ng-tune", on)
  }, [])
  const setLang = (l: Lang) => {
    setLangState(l)
    document.documentElement.lang = l
    try { localStorage.setItem(KEY, l) } catch { /* ignore */ }
  }
  return <Ctx.Provider value={{ lang, setLang, t: getContent(lang) }}>{children}</Ctx.Provider>
}

export function useLang() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useLang must be used inside LangProvider")
  return ctx
}
