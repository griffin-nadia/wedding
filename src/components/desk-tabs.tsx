import { Link, useLocation } from "react-router-dom"
import { BookOpen, CalendarDays, CircleHelp, Home, TrainFront } from "lucide-react"
import { useContent } from "@/lib/content"
import { useLang } from "@/lib/lang"

const baseLinks = [
  { to: "/", key: "home", icon: Home },
  { to: "/the-day", key: "day", icon: CalendarDays },
  { to: "/travel", key: "travel", icon: TrainFront },
  { to: "/faqs", key: "faqs", icon: CircleHelp },
] as const
const storyLink = { to: "/our-story", key: "story", icon: BookOpen } as const

/**
 * Desk (preview, v3 S): from 1024 with Navigation → Desk, the other letters peek out from behind this one
 * as paper tabs down its right edge; clicking one brings that letter forward. Replaces the top-bar links.
 */
export function DeskTabs() {
  const { t } = useLang()
  const { story } = useContent()
  const { pathname } = useLocation()
  const links = story.length ? [...baseLinks, storyLink] : baseLinks
  return (
    <nav aria-label="Letters on the desk" className="desk-tabs">
      <ul>
        {links.filter((l) => l.to !== (pathname.replace(/\/$/, "") || "/")).map((l, i) => (
          <li key={l.to} style={{ rotate: `${[1.5, -1, 2, -1.5, 1][i % 5]}deg` }}><Link to={l.to} className="desk-tab">{t.nav[l.key]}</Link></li>
        ))}
      </ul>
    </nav>
  )
}
