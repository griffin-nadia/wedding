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
 * The opener (Figma 3b): one kid photo each, Griffin then Nadia, as the first slide. Little Griffin is his pick, his
 * first day of school (run 23).
 */
function Opener() {
  const has = (name: string) => name in photos
  if (!has("kid-nadia") || !has("kid-griffin")) return null
  return (
    <div className="story-kids">
      <Photo name="kid-griffin" treatment="print" sizes="(min-width: 768px) 200px, 40vw" />
      <Photo name="kid-nadia" treatment="print" sizes="(min-width: 768px) 200px, 40vw" />
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
