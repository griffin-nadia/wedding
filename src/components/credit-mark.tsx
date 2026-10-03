import { useLang } from "@/lib/lang"
import { BrandSeal } from "@/components/brand-seal"

/** The credit (v3 A): a 24px N&G mark, bottom left of the scene, 18% until hovered. Not on phones. */
export function CreditMark() {
  const { t } = useLang()
  return (
    <a href="https://github.com/JehanBaguley" target="_blank" rel="noreferrer" className="credit-mark" aria-label={t.letter.credit}>
      <BrandSeal className="size-6" />
      <span role="tooltip" className="credit-tip">{t.letter.credit}</span>
    </a>
  )
}
