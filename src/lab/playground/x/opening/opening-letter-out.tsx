import { useEffect, useRef, useState } from "react"
import { useHousehold } from "@/lib/household"
import { useLang } from "@/lib/lang"
import { Stage } from "../../stage"
import { spring, still } from "../../motion"
import { useTake } from "../../params"
import { art, envelopeCss, LetterSheet } from "./art"

/**
 * The letter out of Nadia's envelope, with paper that behaves like paper (lab run 19). Her envelope cut into its real
 * parts (art.tsx): the flap turns on its hinge in perspective, darkening as it faces away from the light; the letter
 * slides out of the pocket with a slight bend and the pocket's lip shading it; once clear it comes to rest in front,
 * casting a soft shadow on the pocket.
 * - hinge: the whole thing, unhurried (about 1.7 s)
 * - pull: the flap opens on a tap, then you draw the letter out with a finger (it bends with your speed); or the
 *   "Take it out" button, so dragging is never the only way (WCAG 2.5.7)
 * - quick: the site's length (about 1 s): flap and letter overlap, the envelope sinks away as on the site
 * Transforms, opacity and filter only, on four layers. Reduced motion: the letter is out, resting in front.
 */
const P = "x-lo"
const css = `${envelopeCss(P)}
.${P}-wrap { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); margin-top: auto; margin-bottom: max(3svh, 12px); }
.${P}-hit { border-radius: 12px; outline: 2px solid transparent; outline-offset: 6px; }
.${P}-hit:focus-visible { outline-color: var(--input-focus); }
.${P}-note { min-height: 44px; display: flex; align-items: center; color: #fff; text-shadow: 0 1px 6px rgb(0 0 0 / .45); font: var(--type-body-size) / 1.2 var(--font-display); }
.${P}-letter.is-out { z-index: 5; }
.${P}-letter.is-grab { cursor: grab; touch-action: none; }
`
type Phase = "sealed" | "flap" | "ready" | "out"

export default function OpeningLetterOut() {
  const take = useTake("hinge")
  const { t } = useLang()
  const { household } = useHousehold()
  const first = household?.guests.filter((g) => !g.plusOne).map((g) => g.firstName).join(" & ") ?? ""
  const [phase, setPhase] = useState<Phase>(() => (still() ? "out" : "sealed"))
  const env = useRef<HTMLDivElement>(null)
  const anims = useRef<Animation[]>([])
  const q = (s: string) => env.current?.querySelector<HTMLElement>(`.${P}-${s}`) ?? null
  const run = (el: HTMLElement | null, k: Keyframe[], o: KeyframeAnimationOptions) => {
    if (!el) return Promise.resolve()
    const a = el.animate(k, { fill: "forwards", ...o }); anims.current.push(a)
    return a.finished.catch(() => {})
  }
  useEffect(() => () => anims.current.forEach((a) => a.cancel()), [])
  // The still version: the letter resting in front, its shadow on the pocket
  useEffect(() => { if (phase === "out" && still()) restingFront() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /** The flap: closed piece turns up to edge-on, then the open piece carries on to standing (one 180° turn) */
  const openFlap = async (d: number) => {
    await run(q("flap-closed"), [{ transform: "rotateX(0)", filter: "brightness(1)" }, { transform: "rotateX(90deg)", filter: "brightness(0.82)" }], { duration: d / 2, easing: "cubic-bezier(.5,0,.9,.6)" })
    await run(q("flap-open"), [{ transform: "rotateX(-90deg)", filter: "brightness(0.78)" }, { transform: "rotateX(0)", filter: "brightness(1)" }], { duration: d / 2, easing: "cubic-bezier(.15,.5,.35,1)" })
  }
  /** Out of the pocket: up with a slight bend that eases flat as it clears */
  const rise = (d: number, delay = 0) => run(q("letter"), [
    { transform: "translateY(0) rotateX(0) scaleY(1)", "--bend": 0, offset: 0 } as Keyframe,
    { transform: "translateY(-38%) rotateX(7deg) scaleY(0.985)", "--bend": 1, offset: 0.45 } as Keyframe,
    { transform: "translateY(-92%) rotateX(0) scaleY(1)", "--bend": 0, offset: 1 } as Keyframe,
  ], { duration: d, delay, easing: "cubic-bezier(.3,.7,.25,1)" })
  /** Over the top of the pocket and down to rest in front, its shadow arriving on the pocket */
  const settle = async (d: number) => {
    q("letter")?.classList.add("is-out")
    void run(q("shade"), [{ opacity: 0, transform: "scaleX(.8)" }, { opacity: 1, transform: "scaleX(1)" }], { duration: d, easing: "ease-out" })
    await run(q("letter"), [{ transform: "translateY(-92%)" }, { transform: "translateY(-96%)", offset: 0.3 }, { transform: "translateY(-58%)" }], { duration: d, easing: "cubic-bezier(.4,0,.2,1)" })
  }
  const restingFront = () => {
    const l = q("letter"), s = q("shade")
    l?.classList.add("is-out"); l?.style.setProperty("transform", "translateY(-58%)"); s?.style.setProperty("opacity", "1")
    q("flap-closed")?.style.setProperty("opacity", "0"); q("flap-open")?.style.setProperty("transform", "none")
  }

  const open = async () => {
    if (phase !== "sealed") return
    navigator.vibrate?.(8)
    setPhase("flap")
    if (take === "quick") {
      void openFlap(380)
      await rise(620, 200)
      setPhase("out")
      // As on the site: the envelope sinks and fades away under the letter
      for (const k of ["body", "flap-open", "front"]) void run(q(k), [{ translate: "0 0", opacity: 1 }, { translate: "0 14%", opacity: 0 }], { duration: 500, delay: 80, easing: "ease-in" })
      return
    }
    await openFlap(560)
    if (take === "pull") { setPhase("ready"); return }
    await rise(820, 40)
    await settle(420)
    setPhase("out")
  }
  const takeOut = async () => { setPhase("out"); await rise(640); await settle(380) }

  // pull: the letter follows a finger; its bend follows the finger's speed; past half way it's out
  const drag = useRef<{ y: number; h: number; p: number; v: number; t: number } | null>(null)
  const setPull = (p: number, bend: number) => {
    const l = q("letter"); if (!l) return
    l.style.transform = `translateY(${(-92 * p).toFixed(2)}%) rotateX(${bend.toFixed(2)}deg)`
    l.style.setProperty("--bend", String(Math.min(1, Math.abs(bend) / 7)))
  }
  const onDown = (e: React.PointerEvent) => {
    if (phase !== "ready") return
    const l = q("letter"); if (!l) return
    l.setPointerCapture(e.pointerId)
    drag.current = { y: e.clientY, h: l.offsetHeight * 0.92, p: 0, v: 0, t: performance.now() }
  }
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current; if (!d) return
    const now = performance.now(), p = Math.max(0, Math.min(1, (d.y - e.clientY) / d.h))
    d.v = (p - d.p) / Math.max(1, now - d.t) * 1000; d.p = p; d.t = now
    setPull(p, Math.max(-2, Math.min(8, d.v * 4)))
  }
  const onUp = () => {
    const d = drag.current; drag.current = null; if (!d) return
    if (d.p > 0.5 || d.v > 1.5) {
      setPhase("out")
      const from = d.p
      spring(from, 1, (v, done) => { setPull(v, (1 - v) * 3); if (done) void settle(380) }, { k: 220, c: 24, v: d.v })
    } else spring(d.p, 0, (v) => setPull(v, 0), { k: 260, c: 26 })
  }

  return (
    <Stage photo hint={take === "pull" ? "Tap to open the flap, then draw the letter out with your finger." : "Tap the envelope. Replay is in Options."}>
      <style>{css}</style>
      <div className={`${P}-wrap`}>
        <button type="button" className={`${P}-hit`} onClick={phase === "ready" ? takeOut : open} aria-label={phase === "ready" ? "Take the letter out" : t.letter.openLabel(first)} disabled={phase === "out" || phase === "flap"}>
          <div ref={env} className={`${P}-env`}>
            <img className={`${P}-body`} src={art("open")} alt="" draggable={false} />
            <img className={`${P}-flap-open`} src={art("open")} alt="" draggable={false} style={{ transform: "rotateX(-90deg)" }} />
            <LetterSheet className={`${P}-letter${phase === "ready" ? " is-grab" : ""}`} />
            <img className={`${P}-flap-closed`} src={art("closed")} alt="" draggable={false} />
            <img className={`${P}-front`} src={art("openFront")} alt="" draggable={false} />
            <img className={`${P}-closed-full`} src={art("closed")} alt="" draggable={false} style={{ opacity: phase === "sealed" ? 1 : 0 }} />
            <span className={`${P}-shade`} style={{ top: "60%" }} />
            {/* The drag surface for pull: over the letter only, once the flap is open */}
            {phase === "ready" && <span aria-hidden className="absolute inset-x-[9%] top-[30%] bottom-[20%] z-10" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} />}
          </div>
        </button>
        <p className={`${P}-note`} aria-live="polite">{phase === "sealed" ? t.letter.note : phase === "ready" ? "Draw it out, or tap to take it out" : phase === "out" ? "" : ""}</p>
      </div>
    </Stage>
  )
}
