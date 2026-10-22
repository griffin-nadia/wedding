import { useLang } from "@/lib/lang"
import { BrandSeal } from "@/components/brand-seal"
import { config } from "@/lib/config"

/**
 * The credit (run 19): laptops only, fixed at the very bottom left on every page. Nadia's seal, faint; hover or focus
 * reveals "Site by Jehan Baguley" beside it, linked to his LinkedIn (run 25). The words are always the link's name, so screen readers hear them at rest.
 * No credit on phones: the FAQs' "Who made this site?" says it.
 */
export function CreditMark() {
  const { t } = useLang()
  return (
    <a href={config.links.jehan} target="_blank" rel="noreferrer" className="credit-mark">
      <BrandSeal className="credit-seal" sizes="24px" />
      <span className="credit-text">{t.letter.credit}</span>
    </a>
  )
}
