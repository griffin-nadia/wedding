/**
 * The lab's frame (lab-frame.html, local only): the real pages in one of four layouts and three styles, so the shell
 * can show each at phone and laptop size. ?layout=A|B|C|D&style=paper|quiet|ink. Tuning from the Options panel
 * applies here too (the same ng-tune store), live.
 */
/* eslint-disable react-refresh/only-export-components -- an entry file: it renders itself, nothing imports it */
import "../styles/fonts.css"
import "../index.css"
import "../styles/polish.css"
import "./lab.css"
import { StrictMode, useEffect, useState, type ReactNode } from "react"
import { createRoot } from "react-dom/client"
import { createPortal } from "react-dom"
import { MemoryRouter } from "react-router-dom"
import { PaperTexture } from "@paper-design/shaders-react"
import { COLOURS, PAPER, forTone } from "@/lib/paper"
import { ThemeProvider, useTheme } from "@/lib/theme"
import { LangProvider, useLang } from "@/lib/lang"
import { HouseholdProvider } from "@/lib/household"
import { SceneDimProvider, Letter } from "@/components/letter/letter"
import { Toaster } from "@/components/ui/toast"
import { Scene } from "@/components/letter/scene"
import { sceneFor } from "@/lib/scenes"
import { Gate } from "@/App"
import { HomePage } from "@/pages/home"
import { DayPage } from "@/pages/day"
import { TravelPage } from "@/pages/travel"
import { FaqsPage } from "@/pages/faqs"
import { StoryPage } from "@/pages/our-story"
import { Sheet, SheetBody, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { apply, load } from "@/tune/store"
import { cn } from "@/lib/utils"

const q = new URLSearchParams(location.search)
const LAYOUT = q.get("layout") ?? "A"
const STYLE = q.get("style") ?? "site"
document.documentElement.dataset.labStyle = STYLE
apply(load())
addEventListener("storage", (e) => { if (e.key === "ng-tune") apply(load()) })

/** Paper style: Paper's shader as a still frame behind every letter, with the site's grain over it. */
function PaperLetters() {
  const { theme } = useTheme()
  const [letters, setLetters] = useState<HTMLElement[]>([])
  useEffect(() => {
    const find = () => setLetters([...document.querySelectorAll<HTMLElement>(".letter")])
    find()
    const mo = new MutationObserver(find)
    mo.observe(document.body, { childList: true, subtree: true })
    return () => mo.disconnect()
  }, [])
  const dark = theme === "lantern"
  return <>{letters.map((el, i) => createPortal(
    <PaperTexture key={i} className="lab-paper" speed={0} frame={0} {...forTone(PAPER, dark ? "lantern" : "light")} {...COLOURS[dark ? "lantern" : "light"]} fit="cover" />, el))}</>
}

const PAGES: [string, () => ReactNode][] = [["The day", () => <DayPage />], ["Travel", () => <TravelPage />], ["FAQs", () => <FaqsPage />], ["Our story", () => <StoryPage />]]

/** B: one scrolling letter, each page a chapter, a progress bar along the top driven by the scroll (CSS only). */
function OneLetter() {
  const { theme } = useTheme()
  return (
    <>
      <Scene source={sceneFor(theme)} />
      <div aria-hidden className="lab-progress" />
      <main className="letter-wrap lab-one">
        <Letter id="letter">
          {/* The card's padding lives on its scrolling inside since the frame (18e), as on the site (18f: B had none) */}
          <div className="letter-scroll">
            <section className="letter-body"><HomePage /></section>
            {PAGES.map(([name, page]) => <section key={name} className="letter-body lab-chapter">{page()}</section>)}
          </div>
        </Letter>
      </main>
    </>
  )
}

/** C: the invite is home; everything else opens as the one sheet over it. */
function InviteHome() {
  const { theme } = useTheme()
  return (
    <>
      <Scene source={sceneFor(theme)} />
      <main className="letter-wrap">
        <Letter id="letter">
          <div className="letter-body"><HomePage /></div>
          <nav aria-label="More" className="flex flex-wrap gap-2">
            {PAGES.map(([name, page]) => (
              <Sheet key={name}>
                <SheetTrigger asChild><button type="button" className="state chip">{name}</button></SheetTrigger>
                <SheetContent aria-describedby={undefined}><SheetTitle className="sr-only">{name}</SheetTitle><SheetBody className="flex flex-col gap-6">{page()}</SheetBody></SheetContent>
              </Sheet>
            ))}
          </nav>
        </Letter>
      </main>
    </>
  )
}

/** D: three tabs. Invite (Home), Plan (The day, Travel and FAQs in one), Story. */
function ThreeTabs() {
  const { theme } = useTheme()
  const [tab, setTab] = useState(0)
  const tabs = ["Invite", "Plan", "Story"]
  return (
    <>
      <Scene source={sceneFor(theme)} />
      <main className="letter-wrap">
        <Letter id="letter">
          <div className="letter-body">
            {tab === 0 && <HomePage />}
            {tab === 1 && <><DayPage /><TravelPage /><FaqsPage /></>}
            {tab === 2 && <StoryPage />}
          </div>
        </Letter>
      </main>
      <nav aria-label="Main" className="site-nav lab-tabs">
        <ul role="tablist">
          {tabs.map((name, i) => <li key={name}><button type="button" role="tab" aria-selected={tab === i} className={cn("site-nav-link", tab === i && "is-active")} onClick={() => { setTab(i); scrollTo(0, 0) }}><span>{name}</span></button></li>)}
        </ul>
      </nav>
    </>
  )
}

function Frame() {
  useLang()
  return (
    <>
      {LAYOUT === "A" ? <Gate /> : LAYOUT === "B" ? <OneLetter /> : LAYOUT === "C" ? <InviteHome /> : <ThreeTabs />}
      {STYLE === "paper" && <PaperLetters />}
    </>
  )
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider><LangProvider><HouseholdProvider><SceneDimProvider>
      <MemoryRouter initialEntries={[q.get("path") ?? "/"]}><Frame /></MemoryRouter>
      <Toaster />
    </SceneDimProvider></HouseholdProvider></LangProvider></ThemeProvider>
  </StrictMode>,
)
