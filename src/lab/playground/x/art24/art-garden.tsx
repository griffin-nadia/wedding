import { Flower2, UtensilsCrossed, Wine } from "lucide-react"
import { PageHeader } from "@/components/ui/page-header"
import { VenueMark } from "@/components/venue-mark"
import { useLang } from "@/lib/lang"
import { jstLabel } from "@/lib/time"
import { useTake } from "../../params"
import { A, ART_CSS, PrivImg } from "./parts"

/**
 * Nadia's garden ink drawing (the ceremony garden: benches either side of the aisle, the arch, the pagoda behind;
 * photos-private/art/web/garden-ink.webp, from her 6 Oct scans, not used before) on The day's ceremony row, "The
 * Garden" (run 24, section 8). A mock of The day's first screen and timeline with the site's own classes.
 * - print: a small tilted print of it in the ceremony row, under "The Garden"
 * - ink: the drawing straight on the card behind the ceremony row, its paper gone (multiply by day, the ink turned
 *   light under the Lantern)
 */
const P = "x-garden"
const ICONS = [Flower2, Wine, UtensilsCrossed]
const css = `
.${P}-print { display: block; width: min(200px, 60%); margin-top: var(--space-3); padding: 5px 5px 7px; background: var(--brand-paper-bright); rotate: -2deg; border-radius: 2px;
  box-shadow: 0 0 0 .5px rgb(var(--tint-shadow) / .18), 0 1px 2px rgb(var(--tint-shadow) / .2), 0 12px 24px -12px rgb(var(--tint-shadow) / .5); }
.${P}-print img, .${P}-print .${A}-paper { display: block; width: 100%; aspect-ratio: 960 / 1475; object-fit: cover; }
.${P}-row { position: relative; isolation: isolate; }
.${P}-ink { position: absolute; z-index: -1; right: -4%; top: -36px; width: min(260px, 58%); opacity: .5; pointer-events: none; mix-blend-mode: multiply;
  mask: linear-gradient(to bottom, #000 55%, transparent); }
.${P}-ink img, .${P}-ink .${A}-paper { display: block; width: 100%; aspect-ratio: 960 / 1475; object-fit: cover; }
.${P}-ink .${A}-paper { opacity: 0; }
[data-theme="lantern"] .${P}-ink { mix-blend-mode: screen; opacity: .42; }
/* Phones: no room beside the words, so it sits under "The Garden" in the row's own space, never under text */
@media (max-width: 767px) { .${P}-ink { position: static; display: block; width: 78%; margin-top: var(--space-2); opacity: .6; mask: linear-gradient(to bottom, #000 60%, transparent); }
  [data-theme="lantern"] .${P}-ink { opacity: .5; } }
[data-theme="lantern"] .${P}-ink img { filter: invert(1) sepia(.35); }
`
const ALT = "Nadia's ink drawing of the ceremony garden: benches either side of the aisle, a flowering arch, a pagoda behind"

export default function ArtGarden() {
  const take = useTake("print")
  const { t, lang } = useLang()
  return (
    <div className="flex flex-col gap-6">
      <style>{ART_CSS + css}</style>
      <PageHeader title={t.day.title} lettering="theDay"><p className="font-medium text-foreground">{t.day.dateLong}</p></PageHeader>
      <div className="flex flex-col">
        <VenueMark className="mb-3" />
        {t.day.addressLines.map((l) => <p key={l}>{l}</p>)}
      </div>
      <ol className="timeline" aria-label={t.day.timelineLabel}>
        <span aria-hidden className="timeline-line" />
        {t.day.schedule.map((s, i) => {
          const Icon = ICONS[i] ?? Flower2
          const garden = i === 0
          return (
            <li key={s.time} className={`timeline-row ${garden && take === "ink" ? `${P}-row` : ""}`}>
              <p className="timeline-time numerals whitespace-nowrap text-foreground">{jstLabel(s.time, lang)}</p>
              <span aria-hidden className="timeline-icon"><Icon className="size-5" /></span>
              <div className="timeline-text">
                <p className="font-medium text-foreground">{s.label}</p>
                <p>{s.where}</p>
                {garden && take === "print" && <span className={`${P}-print`}><PrivImg file="art/web/garden-ink.webp" alt={ALT} /></span>}
                {garden && take === "ink" && <span className={`${P}-ink`}><PrivImg file="art/web/garden-ink.webp" alt={ALT} /></span>}
              </div>
            </li>
          )
        })}
      </ol>
      <p className="text-small text-muted-foreground">{t.day.japanTime}</p>
    </div>
  )
}
