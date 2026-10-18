import type { ReactNode } from "react"
import { Link } from "react-router-dom"
import { useLang } from "@/lib/lang"
import { useTheme } from "@/lib/theme"
import { sceneFor } from "@/lib/scenes"
import { Nav } from "@/components/layout"
import { ModeSwitches } from "@/components/lantern-toggle"
import { Scene } from "@/components/letter/scene"
import { Letter } from "@/components/letter/letter"
import { CreditMark } from "@/components/credit-mark"

/**
 * The guest site's own shell around an experiment (18f): the same top bar (with the music and the sun or moon), the
 * card as a fixed frame between the bar and the dock with its words scrolling inside, the same card padding, the
 * dock, the photo behind and the credit outside the card. Built from the site's components and tokens, so only the
 * thing being tried differs from the live page.
 */
export function SiteShell({ children }: { children: ReactNode }) {
  const { t } = useLang()
  const { theme } = useTheme()
  return (
    <>
      <Scene source={sceneFor(theme)} />
      <header className="site-bar">
        <Link to="/" className="site-mark">{t.meta.shortTitle}</Link>
        <Nav />
        <ModeSwitches className="chrome-lantern" />
      </header>
      <main className="letter-wrap">
        <Letter id="letter" tabIndex={-1} data-page="lab">
          <div className="letter-scroll"><div className="letter-body">{children}</div></div>
        </Letter>
      </main>
      <CreditMark />
    </>
  )
}
