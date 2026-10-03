import { createContext, useContext, useState, type ReactNode } from "react"
import { useLang } from "@/lib/lang"
import { cn } from "@/lib/utils"

/**
 * The letter: the cream sheet every page is read on. 620px wide from 1024 (180px from the left,
 * 120px from the top), 6px forest edge on top (honey in Lantern), 24px radius, a soft blur of the
 * scene within 24px of its edge so it reads as paper. The only UI surface on the site.
 */
export function Letter({ children, className, as: Tag = "article", ...rest }: { children: ReactNode; className?: string; as?: "article" | "div" | "section" } & React.HTMLAttributes<HTMLElement>) {
  return <Tag className={cn("letter paper", className)} {...rest}>{children}</Tag>
}

/** End of every letter: their sign-off and nothing else (Nadia's handwriting replaces Klee One when it arrives). */
export function SignOff({ action }: { action?: ReactNode }) {
  const { t } = useLang()
  return (
    <footer className="letter-end mt-auto flex flex-wrap items-center justify-between gap-x-4 pt-2">
      {__SIGNOFF_ART__
        ? <img src={`${import.meta.env.BASE_URL}brand/signoff.svg`} alt={t.letter.signOff} className="h-12 w-auto" />
        : <p className="hand text-foreground">{t.letter.signOff}</p>}
      {action}
    </footer>
  )
}

/** The scene dims while the RSVP letter is open over it. */
const DimCtx = createContext<{ dim: boolean; setDim: (d: boolean) => void }>({ dim: false, setDim: () => {} })
export function SceneDimProvider({ children }: { children: ReactNode }) {
  const [dim, setDim] = useState(false)
  return <DimCtx.Provider value={{ dim, setDim }}>{children}</DimCtx.Provider>
}
export const useSceneDim = () => useContext(DimCtx)
