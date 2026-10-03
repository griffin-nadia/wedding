import { useLang } from "@/lib/lang"

/** Our story (hidden route): "Coming soon" in display type until the couple's story is written. */
export function StoryPage() {
  const { t } = useLang()
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
