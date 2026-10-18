import { useLang } from "@/lib/lang"
import { BrandSeal } from "@/components/brand-seal"

/**
 * The credit (run 19): laptops only, fixed at the very bottom left on every page. Nadia's seal, faint; hover or focus
 * reveals "Site by Jehan Baguley" beside it. The words are always the link's name, so screen readers hear them at rest.
 * No credit on phones: the FAQs' "Who made this site?" says it.
 */
export function CreditMark() {
  const { t } = useLang()
  return (
    <a href="https://github.com/JehanBaguley" target="_blank" rel="noreferrer" className="credit-mark">
      <BrandSeal className="credit-seal" sizes="24px" />
      <span className="credit-text">{t.letter.credit}</span>
    </a>
  )
}
