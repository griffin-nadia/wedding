import { useLang } from "@/lib/lang"
import { BrandSeal } from "@/components/brand-seal"

/** The credit (v3 A): a 24px G&N mark, 18% until hovered. Bottom left of the scene on laptops, in Home's card footer
 * there (foot), and on phones (inline) in the strip under the letter. */
export function CreditMark({ inline = false, foot = false }: { inline?: boolean; foot?: boolean }) {
  const { t } = useLang()
  return (
    <a href="https://github.com/JehanBaguley" target="_blank" rel="noreferrer" className={foot ? "credit-mark credit-foot" : inline ? "credit-inline" : "credit-mark"} aria-label={t.letter.credit}>
      <BrandSeal className="size-6" />
      <span role="tooltip" className="credit-tip">{t.letter.credit}</span>
    </a>
  )
}
