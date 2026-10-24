import { useEffect, useRef, useState } from "react"
import { ART } from "@/lib/art"
import { useLang } from "@/lib/lang"
import { Button } from "@/components/ui/button"
import { Stage } from "../../stage"
import { still } from "../../motion"
import { useTake } from "../../params"
import { art, envelopeCss, LetterSheet } from "./art"

/**
 * Seal it again, played backwards (lab run 19). Home's "Seal it again" today just shows the sealed envelope; here the
 * letter goes back the way it came: up off the pocket, behind it, down into the envelope with a slight bend, the flap
 * turning shut on its hinge.
 * - reverse: exactly the opening backwards
 * - press: the same, then Nadia's wax seal is pressed: it lifts a little, comes down, squashes and settles, its shadow
 *   tightening as it meets the paper
 * - fade: the calm one, opacity only, half a second (also what reduced motion gets for every take)
 */
const P = "x-sr"
const css = `${envelopeCss(P)}
.${P}-wrap { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); margin-top: auto; margin-bottom: max(3svh, 12px); }
.${P}-letter.is-out { z-index: 5; }
/* Her wax seal on its own, exactly over the one drawn on the pocket, so it can be pressed */
.${P}-env .${P}-seal { position: absolute; z-index: 6; left: 38.4%; top: 69.2%; width: 19.4%; aspect-ratio: 128 / 125; opacity: 0; pointer-events: none;
  filter: drop-shadow(0 1px 1px rgb(60 10 10 / .35)); }
.${P}-note { min-height: 44px; display: flex; align-items: center; color: #fff; text-shadow: 0 1px 6px rgb(0 0 0 / .45); font: var(--type-body-size) / 1.2 var(--font-display); }
`
type Phase = "open" | "sealing" | "sealed"

export default function OpeningSealReverse() {
  const take = useTake("press")
  const { t } = useLang()
  const [phase, setPhase] = useState<Phase>("open")
  const env = useRef<HTMLDivElement>(null)
  const anims = useRef<Animation[]>([])
  const q = (s: string) => env.current?.querySelector<HTMLElement>(`.${P}-${s}`) ?? null
  const run = (el: HTMLElement | null, k: Keyframe[], o: KeyframeAnimationOptions) => {
    if (!el) return Promise.resolve()
    const a = el.animate(k, { fill: "forwards", ...o }); anims.current.push(a)
    return a.finished.catch(() => {})
  }
  useEffect(() => () => anims.current.forEach((a) => a.cancel()), [])
  const reset = () => { anims.current.forEach((a) => a.cancel()); anims.current = []; q("letter")?.classList.add("is-out"); q("closed-full")?.style.setProperty("opacity", "0"); setPhase("open") }

  const seal = async () => {
    setPhase("sealing")
    const letter = q("letter")
    if (still() || take === "fade") {
      await Promise.all([
        run(letter, [{ opacity: 1 }, { opacity: 0 }], { duration: 300 }),
        run(q("shade"), [{ opacity: 1 }, { opacity: 0 }], { duration: 300 }),
        run(q("flap-open"), [{ opacity: 1 }, { opacity: 0 }], { duration: 300, delay: 150 }),
        run(q("closed-full"), [{ opacity: 0 }, { opacity: 1 }], { duration: 350, delay: 150 }),
      ])
      setPhase("sealed"); return
    }
    // Up off the pocket and behind it, its shadow lifting away
    void run(q("shade"), [{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: "ease-in" })
    await run(letter, [{ transform: "translateY(-58%)" }, { transform: "translateY(-96%)" }], { duration: 300, easing: "cubic-bezier(.3,0,.2,1)" })
    letter?.classList.remove("is-out")
    // Down into the pocket, bending a little as the pocket takes it
    await run(letter, [
      { transform: "translateY(-92%) rotateX(0) scaleY(1)", "--bend": 0 } as Keyframe,
      { transform: "translateY(-50%) rotateX(-6deg) scaleY(.985)", "--bend": 1, offset: 0.55 } as Keyframe,
      { transform: "translateY(0) rotateX(0) scaleY(1)", "--bend": 0 } as Keyframe,
    ], { duration: 640, easing: "cubic-bezier(.45,0,.3,1)" })
    // The flap turns shut: the open piece down to edge-on, then the closed piece the rest of the way
    await run(q("flap-open"), [{ transform: "rotateX(0)", filter: "brightness(1)" }, { transform: "rotateX(-90deg)", filter: "brightness(.78)" }], { duration: 260, easing: "cubic-bezier(.5,0,.9,.6)" })
    await run(q("flap-closed"), [{ transform: "rotateX(90deg)", filter: "brightness(.82)" }, { transform: "rotateX(0)", filter: "brightness(1)" }], { duration: 300, easing: "cubic-bezier(.2,.6,.3,1.15)" })
    q("closed-full")?.style.setProperty("opacity", "1")
    if (take === "press") {
      navigator.vibrate?.(10)
      // Pressed: up a hair, down hard, a squash, settled. The shadow is tight when it touches, soft when it lifts
      await run(q("seal"), [
        { opacity: 0, transform: "translateY(-6%) scale(1.12)", filter: "drop-shadow(0 8px 6px rgb(60 10 10 / .25))" },
        { opacity: 1, transform: "translateY(-10%) scale(1.14)", filter: "drop-shadow(0 10px 8px rgb(60 10 10 / .22))", offset: 0.35 },
        { opacity: 1, transform: "translateY(0) scale(.95, .93)", filter: "drop-shadow(0 1px 1px rgb(60 10 10 / .45))", offset: 0.62 },
        { opacity: 1, transform: "translateY(0) scale(1.02, 1.01)", filter: "drop-shadow(0 1px 1px rgb(60 10 10 / .35))", offset: 0.82 },
        { opacity: 1, transform: "none", filter: "drop-shadow(0 1px 1px rgb(60 10 10 / .35))" },
      ], { duration: 560, easing: "cubic-bezier(.3,0,.3,1)" })
    }
    setPhase("sealed")
  }

  const sealSrc = `${import.meta.env.BASE_URL}${ART.seal.src}-256.webp`
  return (
    <Stage photo hint={'Home\'s "Seal it again", played backwards. Open it again to repeat.'}>
      <style>{css}</style>
      <div className={`${P}-wrap`}>
        <div ref={env} className={`${P}-env`}>
          <img className={`${P}-body`} src={art("open")} alt="" draggable={false} />
          <img className={`${P}-flap-open`} src={art("open")} alt="" draggable={false} />
          <LetterSheet className={`${P}-letter is-out`} style={{ transform: "translateY(-58%)" }} />
          <img className={`${P}-flap-closed`} src={art("closed")} alt="" draggable={false} style={{ transform: "rotateX(90deg)" }} />
          <img className={`${P}-front`} src={art("openFront")} alt="" draggable={false} />
          <span className={`${P}-shade`} style={{ top: "60%", opacity: 1 }} />
          <img className={`${P}-closed-full`} src={art("closed")} alt="" draggable={false} style={{ opacity: 0 }} />
          <img className={`${P}-seal`} src={sealSrc} alt="" draggable={false} />
        </div>
        <p className={`${P}-note`} aria-live="polite">{phase === "sealed" ? "Sealed again" : ""}</p>
        {phase === "sealed"
          ? <Button variant="secondary" onClick={reset}>{t.letter.note}</Button>
          : <Button onClick={seal} disabled={phase === "sealing"}>Seal it again</Button>}
      </div>
    </Stage>
  )
}
