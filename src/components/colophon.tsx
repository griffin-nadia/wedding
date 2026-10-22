import { useLang } from "@/lib/lang"
import { config } from "@/lib/config"

/**
 * The colophon (run 25): who made the site, at the end of FAQs and in the laptop seal (credit-mark.tsx). Words by
 * Griffin, drawings by Nadia, designed and built by Jehan, and the music. Jehan's and the music's links come from
 * config.links; empty shows the words without a link.
 */
export function Colophon({ className }: { className?: string }) {
  const { t } = useLang()
  const c = t.qa.colophon
  return (
    <ul aria-label={c.label} className={className ?? "colophon"}>
      {c.lines.map((l) => {
        const href = "link" in l && l.link ? config.links[l.link as keyof typeof config.links] : ""
        return (
          <li key={l.before}>
            {l.before}
            {"text" in l && (href ? <a href={href} target="_blank" rel="noreferrer">{l.text}</a> : l.text)}
            {"after" in l && l.after}
          </li>
        )
      })}
    </ul>
  )
}
