import { OurStory } from "@/components/slots"
import slots from "@/content/slots.json"
import { useLang } from "@/lib/lang"

/** Our story (hidden route): the journey map once the couple's story is written; "Coming soon" in display type until then. */
export function StoryPage() {
  const { t } = useLang()
  if (slots.ourStory.show) return <OurStory />
  return (
    <div className="grid min-h-64 place-items-center text-center">
      <div className="flex flex-col items-center gap-4">
        <h1 className="names text-(length:--type-heading-size)!">{t.letter.comingSoon}</h1>
        <span aria-hidden className="moss-rule" />
        <p>{t.story.soonBody}</p>
      </div>
    </div>
  )
}
