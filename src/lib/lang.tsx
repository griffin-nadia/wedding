import { createContext, useContext, useState, type ReactNode } from "react"
import { getContent, type Lang } from "@/content"

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
  if (lang === "ja") loadJapaneseFonts()
  const setLang = (l: Lang) => {
    if (l === "ja") loadJapaneseFonts()
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
