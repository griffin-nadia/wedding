import { useEffect, useRef } from "react"
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

/**
 * The opener (run 24): one print each, tilted opposite ways, hers leaning into his and over his corner, with a strip
 * of washi tape across her top edge like the other taped prints. Run 26c (Jehan, 24 Oct): Griffin's one photo is his
 * first day of school (the yellow jumper, kid-griffin), shown whole, and Nadia's is her home photo; each print carries
 * just a name on its bottom border, and opens full screen.
 */
/** The opener's prints' sizes, the same as index.html's preload for this page (so both pick the same file) */
const OPENER_SIZES = "(min-width: 1024px) 260px, 56vw"
function Opener() {
  const { t } = useLang()
  const box = useRef<HTMLDivElement>(null)
  // Run 27 (P1): the page's largest paint. Fetched first (index.html preloads them on this page), and once both are in,
  // App.tsx's warm-up may start
  useEffect(() => {
    const imgs = [...(box.current?.querySelectorAll("img") ?? [])]
    void Promise.all(imgs.map((i) => (i.complete ? null : new Promise((r) => { i.addEventListener("load", r, { once: true }); i.addEventListener("error", r, { once: true }) }))))
      .then(() => { (window as { __ngStoryPhotos?: boolean }).__ngStoryPhotos = true; window.dispatchEvent(new Event("ng-story-photos")) })
  }, [])
  const has = (name: string) => name in photos
  if (!has("kid-griffin") || !has("kid-nadia-home")) return null
  const print = (name: string, where: string, note: string) => (
    <div className={`story-kid story-kid-${where}`}>
      <PhotoOpen name={name} label={t.photos[name]?.alt ?? ""}><Photo name={name} treatment="print" sizes={OPENER_SIZES} priority className="story-print" note={note} /></PhotoOpen>
    </div>
  )
  return (
    <div ref={box} className="story-kids">
      {print("kid-griffin", "him", "griffin")}
      {print("kid-nadia-home", "her", "nadia")}
    </div>
  )
}

/**
 * Our story, for everyone: the kid opener, then their chapters from the Content tab (story-plan.ts, the same chapters,
 * until it answers), Kyoto last with the journey map.
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
  const { t } = useLang()
  const { story, ready } = useContent()
  const chapters = withStops(ready && story.length ? story : STORY_PLAN)
  return (
    <>
      <PageHeader title={t.story.title} lettering="ourStory" />
      <StoryJourney chapters={chapters} opener={<Opener />} />
    </>
  )
}
