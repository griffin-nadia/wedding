import { useLang } from "@/lib/lang"
import { BrandSeal } from "@/components/brand-seal"

/** The credit (v3 A): a 24px G&N mark, 18% until hovered. Bottom left of the scene on laptops, and at the foot of Home there
 * (foot). Phones have the "Who made this site?" FAQ instead. */
export function CreditMark({ foot = false }: { foot?: boolean }) {
  const { t } = useLang()
  return (
    <a href="https://github.com/JehanBaguley" target="_blank" rel="noreferrer" className={foot ? "credit-mark credit-foot" : "credit-mark"} aria-label={t.letter.credit}>
      <BrandSeal className="size-6" sizes="24px" />
      <span role="tooltip" className="credit-tip">{t.letter.credit}</span>
    </a>
  )
}
