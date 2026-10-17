import { useLang } from "@/lib/lang"

/**
 * The credit (18e): "Site by Jehan Baguley" as a plain link, outside the card. From 1024 it sits faint at the very
 * bottom left of the screen on every page, full strength on hover or focus; on phones it's the last line of Home,
 * under the card (foot).
 */
export function CreditMark({ foot = false }: { foot?: boolean }) {
  const { t } = useLang()
  return <a href="https://github.com/JehanBaguley" target="_blank" rel="noreferrer" className={foot ? "credit-mark credit-foot" : "credit-mark"}>{t.letter.credit}</a>
}
