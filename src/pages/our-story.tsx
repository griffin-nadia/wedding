import { useState } from "react"
import { useContent } from "@/lib/content"
import { useLang } from "@/lib/lang"
import { StoryJourney } from "@/components/story-journey"
import { Photo } from "@/components/photo"
import photos from "@/content/photos.json"
import { STORY_PLAN } from "@/content/story-plan"

/**
 * The opener (Figma 3b): one kid photo each, Griffin then Nadia, above the map. The photos stay in photos-private/
 * until Our story is switched on. Guests see the opener only once both exist; crew see it as soon as Nadia's does,
 * with Griffin's slot as an empty paper frame.
 */
function StoryOpener() {
  const [crew] = useState(() => { try { return Boolean(localStorage.getItem("ng-crew")) } catch { return false } })
  const has = (name: string) => name in photos
  if (!has("kid-nadia") || (!has("kid-griffin") && !crew)) return null
  return (
    <div className="story-kids">
      {has("kid-griffin")
        ? <Photo name="kid-griffin" treatment="print" sizes="(min-width: 768px) 200px, 40vw" />
        : <div className="story-kid-slot" aria-hidden />}
      <Photo name="kid-nadia" treatment="print" sizes="(min-width: 768px) 200px, 40vw" />
    </div>
  )
}

/** Our story (hidden until the story text exists in the Content tab): the journey map, their Figma plan. */
export function StoryPage() {
  const { t } = useLang()
  const { story, ready } = useContent()
  if (ready && story.length) {
    return (
      <>
        <h1 className="heading">{t.story.title}</h1>
        <StoryOpener />
        <StoryJourney chapters={story} />
      </>
    )
  }
  // Crew devices: the whole flow from the planner's Photos + story tab (kid opener, the eight photo stops, Kyoto),
  // with their own words to come. Guests never reach this page while the Content tab is empty.
  const crew = (() => { try { return Boolean(localStorage.getItem("ng-crew")) } catch { return false } })()
  if (ready && crew && !story.length) {
    return (
      <>
        <h1 className="heading">{t.story.title}</h1>
        <StoryOpener />
        <StoryJourney chapters={STORY_PLAN} />
      </>
    )
  }
  return (
    <div className="grid min-h-64 place-items-center text-center">
      <div className="flex flex-col items-center gap-4">
        <h1 className="heading">{t.letter.comingSoon}</h1>
        <p>{t.story.soonBody}</p>
      </div>
    </div>
  )
}
