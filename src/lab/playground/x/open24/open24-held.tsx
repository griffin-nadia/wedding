import { useEffect, useRef, useState } from "react"
import { useLang } from "@/lib/lang"
import { ART } from "@/lib/art"
import { Stage } from "../../stage"
import { useTake } from "../../params"
import { still, ms } from "../../motion"
import { privatePhoto } from "../../private"
import { P, commonCss, useChapters, capOf, LEAN, Polaroid, Opened } from "./common"

/**
 * Opening a photo (run 24), four ways a print is held until you open it. The story prints with their chapter's year
 * and place (and their words once opened), or the kid photos for the stack:
 * - tape: washi tape holds each print; hover lifts a corner, a click peels it off and the print drops into your hand
 * - sleeve: each print sits in Nadia's open envelope (the invite's own); hover pulls it up, a click slides it out
 * - fan: the kid cluster (Griffin's first day, Nadia in the car, Griffin's 1998 school portrait); hover or focus fans
 *   the three apart, a click brings one to the front, a click on the front one opens it
 * - string: prints hang from a string on wooden pegs, swing a little under the pointer or a swipe; a click unpegs one
 * Every take: real buttons, Enter opens, Escape closes, focus goes back to the print; reduced motion opens with a fade.
 */
const env = (n: string) => `${import.meta.env.BASE_URL}${n}-410.webp`
const env2 = (n: string) => `${import.meta.env.BASE_URL}${n}-410.webp 410w, ${import.meta.env.BASE_URL}${n}-820.webp 820w`
const later = (f: () => void, n: number) => (still() ? f() : void setTimeout(f, ms(n)))

const css = `
/* Tape */
.${P}-taped { position: relative; display: block; transition: transform .38s cubic-bezier(.3,.7,.3,1.2); }
.${P}-tape { position: absolute; z-index: 2; top: -9px; left: 28%; width: 46%; height: 19px; rotate: var(--tt); transform-origin: 0 50%; opacity: .86; transition: transform .25s var(--ease-paper), opacity .3s;
  background: var(--tape); mask: linear-gradient(90deg, transparent 0, #000 3px calc(100% - 3px), transparent 100%); box-shadow: 0 1px 1px rgb(var(--tint-shadow) / .12); }
.${P}-tape[data-c="0"] { --tape: color-mix(in oklab, var(--brand-hachimitsu) 58%, white); }
.${P}-tape[data-c="1"] { --tape: color-mix(in oklab, var(--brand-sabi) 42%, white); }
.${P}-tape[data-c="2"] { --tape: color-mix(in oklab, var(--brand-sage, #7f8f6a) 50%, white); }
@media (hover: hover) { .${P}-btn:hover .${P}-tape { transform: translateY(-2px) rotate(-8deg) scaleY(1.06); } }
.${P}-btn:focus-visible .${P}-tape { transform: translateY(-2px) rotate(-8deg); }
.${P}-btn[data-go] .${P}-tape { transform: translate(40%, -160%) rotate(-32deg); opacity: 0; transition-duration: .32s; }
.${P}-btn[data-go] .${P}-taped { transform: translateY(14px) rotate(calc(var(--lean) * -.6)); transition-delay: .12s; }

/* Sleeve: Nadia's open envelope, the print between its back and its pocket */
.${P}-sleeve { position: relative; display: block; aspect-ratio: 410 / 476; margin-top: 18%; }
.${P}-sleeve img { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.${P}-row[data-take="sleeve"] > li { width: clamp(120px, 34vw, 210px); }
.${P}-sleeve .${P}-in { position: absolute; left: 19%; top: 27%; width: 62%; transition: transform .4s cubic-bezier(.3,.8,.3,1.1); }
.${P}-sleeve .${P}-in .${P}-pol { rotate: 0deg; }
@media (hover: hover) { .${P}-btn:hover .${P}-in { transform: translateY(-24%); } }
.${P}-btn:focus-visible .${P}-in { transform: translateY(-24%); }
.${P}-btn[data-go] .${P}-in { transform: translateY(-70%); transition-duration: .36s; }

/* Fan: three prints in a pile, spread apart on hover or focus */
.${P}-fan { position: relative; width: 100%; max-width: 480px; aspect-ratio: 1.2; margin: var(--space-6) auto; }
.${P}-fan > button { position: absolute; left: 25%; top: 4%; width: 50%; transition: transform .5s cubic-bezier(.3,.8,.3,1.08); transform: translate(var(--sx), var(--sy)) rotate(var(--sr)); }
.${P}-fan[data-fanned] > button { transform: translate(var(--fx), var(--fy)) rotate(var(--fr)); }
.${P}-fan > button .${P}-pol { rotate: 0deg; }

/* String: pegged in a row, a sag at each peg */
.${P}-row[data-take="string"] { column-gap: 0; row-gap: var(--space-7, 48px); padding-top: var(--space-6); }
.${P}-row[data-take="string"] > li { position: relative; padding: 22px 10px 0; width: clamp(116px, 30vw, 196px); }
.${P}-string { position: absolute; left: 0; top: 0; width: 100%; height: 14px; overflow: visible; pointer-events: none; }
.${P}-string path { fill: none; stroke: color-mix(in oklab, var(--ink-soft) 70%, transparent); stroke-width: 1.3; }
.${P}-hang { display: block; transform-origin: 50% -14px; transition: transform .38s cubic-bezier(.4,0,.6,1); }
.${P}-hang .${P}-pol { rotate: calc(var(--lean) * .4); }
.${P}-peg { position: absolute; z-index: 3; left: 50%; top: 2px; width: 14px; height: 34px; translate: -50% 0; pointer-events: none; }
.${P}-peg i { position: absolute; top: 0; width: 7px; height: 100%; border-radius: 2px; transform-origin: 50% 40%; transition: transform .25s;
  background: linear-gradient(90deg, color-mix(in oklab, var(--brand-hachimitsu) 45%, var(--brand-kuri, #6b4a2c)), color-mix(in oklab, var(--brand-hachimitsu) 70%, var(--brand-kinari)));
  box-shadow: 0 1px 2px rgb(var(--tint-shadow) / .35); }
.${P}-peg i:first-child { left: 0; } .${P}-peg i:last-child { right: 0; }
.${P}-btn[data-go] .${P}-peg i:first-child { transform: rotate(16deg); } .${P}-btn[data-go] .${P}-peg i:last-child { transform: rotate(-16deg); }
.${P}-btn[data-go] .${P}-hang { transform: translateY(18px) rotate(5deg); transition-delay: .1s; }
@media (prefers-reduced-motion: reduce) {
  .${P}-taped, .${P}-tape, .${P}-in, .${P}-fan > button, .${P}-hang, .${P}-peg i { transition: none !important; }
  .${P}-btn[data-go] .${P}-tape, .${P}-btn[data-go] .${P}-taped, .${P}-btn[data-go] .${P}-in, .${P}-btn[data-go] .${P}-hang { transform: none; }
  .${P}-btn:hover .${P}-tape, .${P}-btn:hover .${P}-in { transform: none !important; }
}
`
const HINT: Record<string, string> = {
  tape: "Hover a print to lift its tape; click to peel it off",
  sleeve: "Hover an envelope to pull its print up; click to slide it out",
  fan: "Hover or tap the pile to fan it; pick one to bring it forward",
  string: "Swipe or hover along the string; click a print to unpeg it",
}
const SAG = ["M0 3 Q 26 3 50 9 Q 74 3 100 3", "M0 3 Q 24 2 50 8 Q 76 3 100 3", "M0 3 Q 27 3 50 10 Q 73 2 100 3"]
// The pile at rest (s) and fanned (f), per print: translate x, y and a turn
const PILE = [
  { s: ["-6%", "4%", "-5deg"], f: ["-64%", "8%", "-11deg"] },
  { s: ["5%", "1%", "4deg"], f: ["64%", "6%", "10deg"] },
  { s: ["0%", "0%", "-1deg"], f: ["0%", "-3%", "1deg"] },
]

type Open = { i: number; from: HTMLElement; at: HTMLElement }

export default function OpenHeld() {
  const take = useTake("tape")
  return take === "fan" ? <Fan /> : <Held take={take in HINT ? take : "tape"} />
}

function Held({ take }: { take: string }) {
  const chapters = useChapters()
  const [open, setOpen] = useState<Open | null>(null)
  const row = useRef<HTMLUListElement>(null)
  // String: a swing under the pointer or a passing finger (Web Animations, so it follows the lab's speed)
  const swing = (el: Element | null | undefined) => {
    const h = el?.closest(`.${P}-btn`)?.querySelector<HTMLElement>(`.${P}-hang`)
    if (!h || still() || h.getAnimations().length) return
    h.animate([{ transform: "rotate(0)" }, { transform: "rotate(4deg)" }, { transform: "rotate(-3deg)" }, { transform: "rotate(1.6deg)" }, { transform: "rotate(-.6deg)" }, { transform: "rotate(0)" }], { duration: 1300, easing: "ease-out" })
  }
  useEffect(() => {
    const el = row.current
    if (take !== "string" || !el) return
    const touch = (e: TouchEvent) => { const t = e.touches[0]; if (t) swing(document.elementFromPoint(t.clientX, t.clientY)) }
    el.addEventListener("touchmove", touch, { passive: true })
    return () => el.removeEventListener("touchmove", touch)
  }, [take])
  const go = (i: number, btn: HTMLButtonElement) => {
    if (open) return
    btn.setAttribute("data-go", "")
    const at = btn.querySelector<HTMLElement>(`.${P}-pol`) ?? btn
    later(() => setOpen({ i, from: btn, at }), take === "sleeve" ? 380 : 440)
  }
  const closed = () => { open?.from.removeAttribute("data-go"); setOpen(null) }
  const c = open ? chapters[open.i] : null
  return (
    <Stage hint={HINT[take]}>
      <style>{commonCss + css}</style>
      <ul ref={row} className={`${P}-row`} data-take={take}>
        {chapters.map((ch, i) => {
          const pol = <Polaroid name={ch.photo} alt={ch.title} cap={capOf(ch)} lean={take === "sleeve" ? 0 : LEAN[i]} />
          return (
            <li key={ch.key}>
              {take === "string" && <svg className={`${P}-string`} viewBox="0 0 100 14" preserveAspectRatio="none" aria-hidden><path d={SAG[i % 3]} vectorEffect="non-scaling-stroke" /></svg>}
              <button type="button" className={`${P}-btn`} aria-label={`${ch.title}, ${ch.year}. Open`} aria-haspopup="dialog" style={{ ["--lean" as string]: `${LEAN[i]}deg` }}
                onClick={(e) => go(i, e.currentTarget)} onPointerEnter={(e) => take === "string" && e.pointerType === "mouse" && swing(e.currentTarget)}>
                {take === "tape" && <span className={`${P}-taped`}><span className={`${P}-tape`} data-c={i % 3} style={{ ["--tt" as string]: `${((i % 3) - 1) * 4}deg` }} aria-hidden />{pol}</span>}
                {take === "sleeve" && (
                  <span className={`${P}-sleeve`}>
                    <img src={env(ART.drawnEnvelope.open)} srcSet={env2(ART.drawnEnvelope.open)} sizes="180px" alt="" />
                    <span className={`${P}-in`}>{pol}</span>
                    <img src={env(ART.drawnEnvelope.openFront)} srcSet={env2(ART.drawnEnvelope.openFront)} sizes="180px" alt="" />
                  </span>
                )}
                {take === "string" && <><span className={`${P}-peg`} aria-hidden><i /><i /></span><span className={`${P}-hang`}>{pol}</span></>}
              </button>
            </li>
          )
        })}
      </ul>
      {open && c && (
        <Opened from={open.from} at={open.at} label={c.title} onClose={closed} words={c}
          print={<Polaroid name={c.photo} alt={c.title} cap={capOf(c)} sizes="(min-width: 900px) 440px, 84vw" />} />
      )}
    </Stage>
  )
}

/** The kid cluster: Griffin's first day and Nadia in the car from the site, Griffin's 1998 portrait from the lab only */
function Fan() {
  const { t } = useLang()
  const kids = [
    { key: "kid-griffin", name: "kid-griffin", alt: t.photos["kid-griffin"]?.alt ?? "Griffin as a little boy" },
    { key: "kid-nadia", name: "kid-nadia", alt: t.photos["kid-nadia"]?.alt ?? "Nadia as a little girl" },
    { key: "portrait", src: privatePhoto("griffin-kid-portrait-1998-800.webp"), alt: "Griffin's school portrait, 1998" },
  ]
  const [order, setOrder] = useState([0, 1, 2]) // last is on top
  const [hover, setHover] = useState(false)
  const [focus, setFocus] = useState(false)
  const [tapped, setTapped] = useState(false)
  const [open, setOpen] = useState<Open | null>(null)
  const kind = useRef("mouse")
  const fanned = hover || focus || tapped || !!open
  const pick = (i: number, btn: HTMLButtonElement) => {
    if (kind.current !== "mouse" && !fanned) { setTapped(true); return } // a first tap on a phone fans the pile
    if (order[order.length - 1] !== i) { setOrder([...order.filter((k) => k !== i), i]); return }
    setOpen({ i, from: btn, at: btn.querySelector<HTMLElement>(`.${P}-pol`) ?? btn })
  }
  const k = open ? kids[open.i] : null
  return (
    <Stage hint={HINT.fan}>
      <style>{commonCss + css}</style>
      <div className={`${P}-fan`} data-fanned={fanned || undefined} role="group" aria-label="Three childhood photos in a pile"
        onPointerEnter={(e) => e.pointerType === "mouse" && setHover(true)} onPointerLeave={(e) => e.pointerType === "mouse" && setHover(false)}
        onFocus={() => kind.current === "mouse" && setFocus(true)} onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && setFocus(false)}>
        {kids.map((kid, i) => {
          const top = order[order.length - 1] === i, p = PILE[i]
          return (
            <button key={kid.key} type="button" className={`${P}-btn`} aria-haspopup={top ? "dialog" : undefined}
              aria-label={`${kid.alt}. ${top ? "Open" : "Bring to the front"}`}
              style={{ zIndex: order.indexOf(i) + 1, ["--sx" as string]: p.s[0], ["--sy" as string]: p.s[1], ["--sr" as string]: p.s[2], ["--fx" as string]: p.f[0], ["--fy" as string]: p.f[1], ["--fr" as string]: p.f[2] }}
              onPointerDown={(e) => { kind.current = e.pointerType }} onClick={(e) => { pick(i, e.currentTarget); kind.current = "mouse" }}>
              <Polaroid name={kid.name} src={kid.src} alt={kid.alt} sizes="(min-width: 768px) 220px, 42vw" />
            </button>
          )
        })}
      </div>
      {open && k && (
        <Opened from={open.from} at={open.at} label={k.alt} onClose={() => setOpen(null)}
          print={<Polaroid name={k.name} src={k.src} alt={k.alt} sizes="(min-width: 900px) 440px, 84vw" />} />
      )}
    </Stage>
  )
}
