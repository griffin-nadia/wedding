import { useState } from "react"
import { Segmented } from "@/components/segmented"
import { Photo } from "@/components/photo"
import { Stage } from "../../stage"

/**
 * Our story's prints, three ways (final run): washi tape across the top (what ships), photo corners, or plain (the
 * border and shadow alone). Same soft print, same seeded tilt and tape colour as the site.
 */
const css = `
.x-ss { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--space-6); padding-top: var(--space-4); }
.x-ss .story-print > div { width: min(40vw, 200px); height: auto; }
.x-ss[data-v="plain"] .story-print::before { display: none; }
.x-ss[data-v="corners"] .story-print::before { display: none; }
.x-ss[data-v="corners"] .story-print > div { -webkit-mask: none; }
.x-ss-corner { display: none; position: absolute; z-index: 2; width: 22px; height: 22px; background: color-mix(in oklab, var(--brand-kogecha) 82%, transparent); clip-path: polygon(0 0, 100% 0, 0 100%); }
.x-ss[data-v="corners"] .x-ss-corner { display: block; }
.x-ss-corner.tl { top: 2px; left: 2px; } .x-ss-corner.tr { top: 2px; right: 2px; rotate: 90deg; } .x-ss-corner.br { bottom: 6px; right: 2px; rotate: 180deg; } .x-ss-corner.bl { bottom: 6px; left: 2px; rotate: 270deg; }
`
export default function StoryStyling() {
  const [v, setV] = useState<"tape" | "corners" | "plain">("tape")
  return (
    <Stage hint="Tape is what ships. Corners and plain to compare.">
      <style>{css}</style>
      <Segmented label="Prints" value={v} onChange={setV} items={[{ value: "tape", label: "Tape" }, { value: "corners", label: "Corners" }, { value: "plain", label: "Plain" }]} />
      <div className="x-ss" data-v={v}>
        {["story-1", "story-3", "story-2"].map((n) => (
          <div key={n} className="relative">
            <Photo name={n} treatment="print" vary sizes="200px" className="story-print" />
            {["tl", "tr", "br", "bl"].map((k) => <span key={k} aria-hidden className={`x-ss-corner ${k}`} />)}
          </div>
        ))}
      </div>
    </Stage>
  )
}
