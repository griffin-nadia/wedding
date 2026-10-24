import { useContent } from "@/lib/content"
import { useLang } from "@/lib/lang"
import { PhotoOpen, StoryJourney } from "@/components/story-journey"
import { Photo } from "@/components/photo"
import photos from "@/content/photos.json"
import { PageHeader } from "@/components/ui/page-header"
import { STORY_PLAN } from "@/content/story-plan"
import type { Chapter } from "@/lib/content"
import { KYOTO, PLACES } from "@/lib/journey"
import { onMap } from "@/lib/map-land"
import { pending } from "@/content/pending"

/**
 * The opener (run 24): one print each, tilted opposite ways, hers leaning into his and over his corner, with a strip
 * of washi tape across her top edge like the other taped prints. Run 26c (Jehan, 24 Oct): Griffin's one photo is his
 * first day of school (the yellow jumper, kid-griffin), shown whole, and Nadia's is her home photo; each print carries
 * just a name on its bottom border, and opens full screen.
 */
function Opener() {
  const { t } = useLang()
  const has = (name: string) => name in photos
  if (!has("kid-griffin") || !has("kid-nadia-home")) return null
  const print = (name: string, where: string, note: string) => (
    <div className={`story-kid story-kid-${where}`}>
      <PhotoOpen name={name} label={t.photos[name]?.alt ?? ""}><Photo name={name} treatment="print" sizes="(min-width: 1024px) 260px, 56vw" className="story-print" note={note} /></PhotoOpen>
    </div>
  )
  return (
    <div className="story-kids">
      {print("kid-griffin", "him", "griffin")}
      {print("kid-nadia-home", "her", "nadia")}
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
/** Run 26: a place's photo when the Content tab gives its chapter none (Taiwan: their edited tea-field selfie). A photo
 *  set in the Content tab (story_N_photo) still wins */
const PLACE_PHOTO: Record<string, string> = { Taiwan: "story-taiwan" }
/** Run 26c: no photo-only stops any more (the Canada visit went with the review; Back to Japan in run 26) */
function withStops(story: Chapter[]): Chapter[] {
  return story.map((c) => ({ ...c, at: c.at ?? (c.place ? AT[c.place] : undefined), photo: c.photo || (c.place ? PLACE_PHOTO[c.place] : undefined) }))
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
