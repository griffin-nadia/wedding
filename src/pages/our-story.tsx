import { useContent } from "@/lib/content"
import { useLang } from "@/lib/lang"
import { StoryJourney } from "@/components/story-journey"
import { Photo } from "@/components/photo"
import photos from "@/content/photos.json"
import { PageHeader } from "@/components/ui/page-header"
import { STORY_PLAN } from "@/content/story-plan"
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
export function StoryPage() {
  const { t, lang } = useLang()
  const { story, ready } = useContent()
  const chapters = ready && story.length ? story : STORY_PLAN.map((c) => (c.body.length ? c : { ...c, body: [pending("story.chapterBody", lang)] }))
  return (
    <>
      <PageHeader title={t.story.title} />
      <StoryJourney chapters={chapters} opener={<Opener />} />
    </>
  )
}
