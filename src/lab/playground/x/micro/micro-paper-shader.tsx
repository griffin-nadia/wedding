import { useEffect, useRef, useState } from "react"
import { PaperTexture } from "@paper-design/shaders-react"
import { useTheme } from "@/lib/theme"
import { useLang } from "@/lib/lang"
import { loop } from "@/lib/frame"
import { Stage } from "../../stage"
import { still } from "../../motion"

/**
 * One letter, two papers, split by a divider you drag: on the left Paper's PaperTexture shader running live, on the
 * right the baked images the site ships (grain and washi fibres over the paper colour). The frame rate shown is this
 * page's, so you can see what the live shader costs on the device in your hand.
 */
const css = `
.x-ps { position: relative; width: min(100%, 560px); aspect-ratio: 4 / 5; border-radius: var(--letter-radius); overflow: hidden; box-shadow: var(--elevation-paper); touch-action: none; user-select: none; }
.x-ps-layer { position: absolute; inset: 0; }
.x-ps-live canvas { width: 100% !important; height: 100% !important; display: block; }
.x-ps-baked { background-color: var(--letter-bg); background-image: var(--texture-hatch); background-size: 512px; background-blend-mode: var(--paper-blend); }
.x-ps-baked::after { content: ""; position: absolute; inset: 0; background-image: var(--texture-grain); background-size: 256px; mix-blend-mode: var(--texture-blend); opacity: 0.35; }
.x-ps-words { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: center; gap: var(--space-3); padding: var(--space-7); color: var(--ink); pointer-events: none; }
.x-ps-words p { color: var(--ink-soft); }
.x-ps-divider { position: absolute; top: 0; bottom: 0; width: 44px; translate: -50% 0; display: grid; place-items: center; cursor: ew-resize; outline: none; }
.x-ps-divider::before { content: ""; position: absolute; top: 0; bottom: 0; width: 2px; background: var(--action); }
.x-ps-knob { position: relative; width: 32px; height: 32px; border-radius: 50%; background: var(--action); box-shadow: 0 2px 6px rgb(0 0 0 / 0.25); }
.x-ps-divider:focus-visible .x-ps-knob { outline: 2px solid var(--input-focus); outline-offset: 3px; }
.x-ps-tag { position: absolute; top: var(--space-3); padding: var(--space-1) var(--space-2); border-radius: var(--radius-pill); background: color-mix(in oklab, var(--letter-bg) 85%, transparent); font: 500 var(--type-label-size) / 1.4 var(--font-label); color: var(--ink); }
.x-ps-fps { font: 500 var(--type-small-size) / 1.4 var(--font-label); color: var(--ink-soft); font-variant-numeric: tabular-nums; }
`

export default function PaperShader() {
  const { theme } = useTheme()
  const { t } = useLang()
  const [split, setSplit] = useState(50)
  const [fps, setFps] = useState(0)
  const box = useRef<HTMLDivElement>(null)
  // Frames per second over the last second, from the shared loop
  useEffect(() => {
    let n = 0, from = performance.now()
    return loop((now) => { n++; if (now - from >= 1000) { setFps(Math.round((n * 1000) / (now - from))); n = 0; from = now } })
  }, [])
  const drag = (e: React.PointerEvent) => {
    const r = box.current!.getBoundingClientRect()
    setSplit(Math.min(95, Math.max(5, ((e.clientX - r.left) / r.width) * 100)))
  }
  const dark = theme === "lantern"
  return (
    <Stage hint="Drag the divider. Left: the live shader. Right: the images the site uses.">
      <style>{css}</style>
      <div ref={box} className="x-ps" onPointerMove={(e) => e.buttons && drag(e)} onPointerDown={(e) => { (e.target as Element).setPointerCapture?.(e.pointerId); drag(e) }}>
        <div className="x-ps-layer x-ps-live" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}>
          <PaperTexture speed={still() ? 0 : 0.4} colorBack={dark ? "#22160e" : "#f3e7d3"} colorPaper={dark ? "#2f2016" : "#fbf5ea"} colorShadow={dark ? "#0b0705" : "#c9b48f"}
            fiber={0.35} crumples={0.2} folds={0.15} drops={0.1} roughness={0.35} fit="cover" style={{ width: "100%", height: "100%" }} />
        </div>
        <div className="x-ps-layer x-ps-baked" style={{ clipPath: `inset(0 0 0 ${split}%)` }} />
        <div className="x-ps-words"><h2 className="names">{t.meta.shortTitle}</h2><p>{t.home.dateLine}</p><p>{t.home.greetingLine}</p></div>
        <span className="x-ps-tag" style={{ left: 12 }}>Live shader</span>
        <span className="x-ps-tag" style={{ right: 12 }}>Baked images</span>
        <div className="x-ps-divider" style={{ left: `${split}%` }} role="slider" tabIndex={0} aria-label="Where the papers meet" aria-valuemin={5} aria-valuemax={95} aria-valuenow={Math.round(split)}
          onKeyDown={(e) => { if (e.key === "ArrowLeft") setSplit((s) => Math.max(5, s - 5)); if (e.key === "ArrowRight") setSplit((s) => Math.min(95, s + 5)) }}>
          <span className="x-ps-knob" />
        </div>
      </div>
      <p className="x-ps-fps" aria-live="off">This page: {fps} frames a second{still() ? " (the shader is still under reduced motion)" : ""}</p>
    </Stage>
  )
}
