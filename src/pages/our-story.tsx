import { useContent } from "@/lib/content"
import { useLang } from "@/lib/lang"
import { StoryJourney } from "@/components/story-journey"
import { Photo } from "@/components/photo"
import photos from "@/content/photos.json"
import { PageHeader } from "@/components/ui/page-header"
import { STORY_PLAN } from "@/content/story-plan"
import type { Chapter } from "@/lib/content"
import { KYOTO, PLACES } from "@/lib/journey"
import { onMap } from "@/lib/map-land"
import { pending } from "@/content/pending"

/**
 * The opener (run 24): a little pile of instant prints. In front, Griffin's 1998 school portrait and Nadia's home
 * photo, tilted opposite ways, hers leaning into his, a strip of tape across where they overlap; tucked half under his,
 * his first day of school (his own pick, run 23). Sized to fill the spread.
 */
function Opener() {
  const has = (name: string) => name in photos
  if (!has("kid-griffin-1998") || !has("kid-nadia-home")) return null
  const sizes = "(min-width: 1024px) 240px, 46vw"
  return (
    <div className="story-kids">
      {has("kid-griffin") && <div className="story-kid story-kid-behind"><Photo name="kid-griffin" treatment="print" sizes={sizes} className="story-print" /></div>}
      <div className="story-kid story-kid-him"><Photo name="kid-griffin-1998" treatment="print" sizes={sizes} className="story-print" /></div>
      <div className="story-kid story-kid-her"><Photo name="kid-nadia-home" treatment="print" sizes={sizes} className="story-print" /></div>
      <span aria-hidden className="story-kids-tape" />
    </div>
  )
}

/**
 * Our story, for everyone: their chapters from the Content tab once they're written; until then the planner's
 * layout (the kid opener, the eight photo stops, Kyoto) with a placeholder line where their words will go.
 */
/** Where each chapter's place sits on the map (the story_N_place values in the Content tab). Taiwan isn't on the flat
 *  map's regions yet (run 24's map work), so it has no spot. */
const AT: Record<string, [number, number]> = {
  "Kansai Gaidai, Hirakata": onMap("JP", 34.81, 135.65), Japan: PLACES.japan, Canada: PLACES.canada,
  Australia: onMap("AU", -25.5, 134), "Australia (Brisbane)": PLACES.brisbane, Kyoto: KYOTO,
}
/** Photos with no words of their own (run 23): STORY_PLAN's Back to Japan (after chapter 3, Australia, 2018–2019) and
 *  the 2024 Canada visit (after chapter 5), as photo-only stops between chapters, in date order */
const PHOTO_STOPS: Record<string, Chapter> = {
  "3": { ...STORY_PLAN.find((c) => c.photo === "story-4")!, key: "photo-4", body: [] },
  "5": { ...STORY_PLAN.find((c) => c.photo === "story-8")!, key: "photo-8", body: [] },
}
function withStops(story: Chapter[]): Chapter[] {
  return story.flatMap((c) => {
    const ch = { ...c, at: c.at ?? (c.place ? AT[c.place] : undefined), photo: c.photo || undefined }
    return PHOTO_STOPS[c.key] ? [ch, PHOTO_STOPS[c.key]] : [ch]
  })
}

export function StoryPage() {
  const { t, lang } = useLang()
  const { story, ready } = useContent()
  const chapters = ready && story.length ? withStops(story) : STORY_PLAN.map((c) => (c.body.length ? c : { ...c, body: [pending("story.chapterBody", lang)] }))
  return (
    <>
      <PageHeader title={t.story.title} lettering="ourStory" />
      <StoryJourney chapters={chapters} opener={<Opener />} />
    </>
  )
}
