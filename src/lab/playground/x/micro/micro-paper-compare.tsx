import { useTheme } from "@/lib/theme"
import { useLang } from "@/lib/lang"
import { PaperTexture } from "@paper-design/shaders-react"
import { PAPER, inkFor, nightOf } from "@/lib/paper"
import { Stage } from "../../stage"

/**
 * Paper's own live PaperTexture beside ours, with the same settings (final run): on the left the shader running live
 * on the card, as on shaders.paper.design; on the right the site's way, the same shader drawn once at this screen's
 * pixel size, kept lossless and laid over the card (--paper-live, src/lib/paper-live.ts). They should look alike;
 * any difference is what the site's version costs.
 */
const css = `
.x-pc { display: grid; gap: var(--space-4); grid-template-columns: repeat(2, minmax(0, 1fr)); width: min(100%, 760px); }
.x-pc-card { position: relative; isolation: isolate; aspect-ratio: 3 / 4; border-radius: var(--letter-radius); overflow: hidden; background: var(--letter-bg); color: var(--ink); box-shadow: var(--elevation-paper); display: grid; align-content: end; padding: var(--space-4); }
.x-pc-card > div:first-child { position: absolute !important; inset: 0; z-index: 2; pointer-events: none; }
.x-pc-ours::after { content: ""; position: absolute; inset: 0; z-index: 2; pointer-events: none; background: var(--paper-live, none) center / cover no-repeat; mix-blend-mode: var(--paper-blend); opacity: var(--paper-on, var(--paper-strength)); }
.x-pc-card p { position: relative; z-index: 1; font: 500 var(--type-small-size) / 1.4 var(--font-label); }
`
export default function PaperCompare() {
  const { theme } = useTheme()
  const { t } = useLang()
  const night = theme === "lantern"
  const strength = night ? 0.2 : 0.14
  return (
    <Stage hint="Left: Paper's own shader, live. Right: the site's, made once and laid over. Same settings.">
      <style>{css}</style>
      <div className="x-pc">
        <div className="x-pc-card">
          <PaperTexture speed={0} fit="cover" {...(night ? nightOf(PAPER) : PAPER)} {...inkFor(night)} style={{ mixBlendMode: night ? "screen" : "multiply", opacity: strength }} />
          <p>{t.meta.shortTitle} · Paper, live</p>
        </div>
        <div className="x-pc-card x-pc-ours"><p>{t.meta.shortTitle} · the site's</p></div>
      </div>
    </Stage>
  )
}
