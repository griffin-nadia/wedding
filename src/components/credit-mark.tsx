import { useLang } from "@/lib/lang"
import { BrandSeal } from "@/components/brand-seal"

/** The credit (v3 A): a 24px N&G mark, bottom left of the scene, 18% until hovered. On phones (inline) it sits in the strip under the letter. */
export function CreditMark({ inline = false }: { inline?: boolean }) {
  const { t } = useLang()
  return (
    <a href="https://github.com/JehanBaguley" target="_blank" rel="noreferrer" className={inline ? "credit-inline" : "credit-mark"} aria-label={t.letter.credit}>
      <BrandSeal className="size-6" />
      <span role="tooltip" className="credit-tip">{t.letter.credit}</span>
    </a>
  )
}
