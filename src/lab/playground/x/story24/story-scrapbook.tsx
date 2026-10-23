import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { ART } from "@/lib/art"
import { useLang } from "@/lib/lang"
import { NamesArt } from "@/components/names-art"
import { useTake } from "../../params"
import { spring, still } from "../../motion"
import { Art, Controls, EndWords, JourneyStop, KIT_CSS, KidPrints, ListView, Polaroid, TILTS, Words, arrowKeys, caption, chapterPic, rnd, useAnnounce, useChapters, useMeta, useStops, useSwipe } from "./kit"

/**
 * B. Scrapbook album: Our story pasted into an album, one page turned at a time. On a phone it's one page (the print
 * taped in, the words under it); from 1024 it's a spread, the print on the left page and the words on the right.
 * The page turn is a real leaf on a hinge: drag it and it follows the finger all the way over, with the shade of the
 * curl moving across it; let go past a quarter (or flick) and it carries on over on a spring, short of that it falls
 * back. These are lib/page-turn.ts's rules for the letters (24px to start, 25% or a flick, a soft give at the ends,
 * reduced motion just cuts), on a hinge instead of a track. Arrows, dots, the arrow keys and See as a list as on the
 * live page. Nadia's gum leaves and wax seal are the stickers (on some pages, never all); her names lettering is on
 * the title page. Captions are the chapter's year and place in a written-feel hand, nothing invented.
 * - kraft: brown kraft pages, the ink dark (light) or cream (Lantern)
 * - black: the old black album pages, written on in cream "white pen"
 * Her maple leaf would join the stickers; its file isn't available yet.
 */
const P = "x-sb"
const NOISE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 .2 0 0 0 0 .12 0 0 0 0 .05 0 0 0 .55 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
const css = `
.${P} { gap: var(--space-3); justify-content: center; }
.${P}-book { --bh: min(calc(100svh - 250px), calc((100vw - 32px) * 1.48), 600px); --bw: min(calc(100vw - 32px), calc(var(--bh) / 1.45), 420px);
  position: relative; width: var(--bw); height: var(--bh); perspective: 2200px; margin-left: 0; }
@media (min-width: 1024px) { .${P}-book { --bh: min(calc(100svh - 230px), 660px); --bw: min(calc(var(--bh) * .76), 45vw); width: calc(var(--bw) * 2); } }
/* The kraft: a warm brown, fibres and grain (one still SVG noise, drawn once), the ink tokens swapped for ones that hold on it */
.${P}-page { --kraft: color-mix(in oklab, var(--brand-kare) 72%, var(--brand-wara)); --ink: var(--brand-kogecha); --ink-soft: var(--brand-kogecha); --ink-muted: var(--brand-kogecha); --ink-link: var(--brand-kogecha); --hand: var(--brand-kogecha);
  position: absolute; inset: 0; overflow: hidden; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--space-4); padding: 8% 7%; border-radius: 3px 8px 8px 3px;
  background: ${NOISE}, repeating-linear-gradient(97deg, transparent 0 13px, rgb(66 26 5 / .035) 13px 14px, transparent 14px 37px), var(--kraft); color: var(--ink); }
[data-theme="lantern"] .${P}-page { --kraft: color-mix(in oklab, var(--brand-yoru-fill) 62%, var(--brand-nikkei)); --ink: var(--brand-kinari); --ink-soft: var(--brand-kinari); --ink-muted: var(--brand-kinari); --ink-link: var(--brand-kinari); --hand: var(--brand-kinari); }
.${P}[data-take="black"] .${P}-page { --kraft: var(--brand-ink-deep); --ink: var(--brand-kinari); --ink-soft: var(--brand-kinari); --ink-muted: var(--brand-kinari); --ink-link: var(--brand-kinari); --hand: var(--brand-shiro-kinari); }
/* The spine: each page darkens into the gutter */
.${P}-page::before { content: ""; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(90deg, rgb(42 18 6 / .28), transparent 9%, transparent 94%, rgb(255 240 220 / .06)); }
.${P}-back .${P}-page::before, .${P}-base .${P}-page::before { background: linear-gradient(270deg, rgb(42 18 6 / .3), transparent 10%, transparent 95%, rgb(255 240 220 / .06)); }
.${P}-base { position: absolute; left: 0; top: 0; width: 50%; height: 100%; box-shadow: 0 30px 50px -30px rgb(42 18 6 / .6); border-radius: 8px 3px 3px 8px; }
.${P}-base .${P}-page { border-radius: 8px 3px 3px 8px; }
.${P}-under { position: absolute; inset: 0; border-radius: 3px 8px 8px 3px; box-shadow: 2px 2px 0 -1px var(--brand-wara), 4px 4px 0 -2px var(--brand-kare), 0 30px 50px -30px rgb(42 18 6 / .6); background: var(--brand-kare); }
@media (min-width: 1024px) { .${P}-under { left: 50%; } }
.${P}-leaf { position: absolute; left: 0; top: 0; width: 100%; height: 100%; transform-origin: 0 50%; transform-style: preserve-3d; will-change: transform; }
@media (min-width: 1024px) { .${P}-leaf { left: 50%; width: 50%; } }
.${P}-face { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; }
.${P}-back { transform: rotateY(180deg); }
.${P}-back .${P}-page { border-radius: 8px 3px 3px 8px; }
/* The curl's shade: darker on the face turning away, lighter on the one coming round */
.${P}-shade { position: absolute; inset: 0; z-index: 5; pointer-events: none; opacity: 0; border-radius: inherit; background: linear-gradient(90deg, rgb(42 18 6 / .05), rgb(42 18 6 / .4)); }
.${P}-back .${P}-shade { background: linear-gradient(270deg, rgb(42 18 6 / .05), rgb(42 18 6 / .35)); }
.${P}-page .x-s24-pol { --pw: min(calc(var(--bw) * .66), calc((var(--bh) - 230px) / 1.3)); }
@media (min-width: 1024px) { .${P}-page .x-s24-pol { --pw: min(calc(var(--bw) * .66), calc(var(--bh) * .58)); } }
.${P}-page .x-s24-kids { --kw: min(calc(var(--bw) * .44), calc(var(--bh) * .36)); }
.${P}-page .x-s24-kids .x-s24-pol { --pw: var(--kw); }
.${P}-page .x-s24-cap { color: var(--brand-kogecha); }
.${P}-corner { position: absolute; z-index: 3; width: 34%; height: 9%; max-height: 22px; opacity: .78; mask: linear-gradient(90deg, transparent 0, #000 3px calc(100% - 3px), transparent 100%);
  background: color-mix(in oklab, var(--brand-sage) 45%, var(--brand-paper-bright)); }
.${P}-corner.is-a { left: -10%; top: 2%; rotate: -38deg; } .${P}-corner.is-b { right: -10%; bottom: 10%; rotate: -38deg; background: color-mix(in oklab, var(--brand-sabi) 30%, var(--brand-paper-bright)); }
.${P}-pasted { position: relative; }
.${P}-sticker { position: absolute; z-index: 4; pointer-events: none; filter: drop-shadow(0 1px 1px rgb(42 18 6 / .35)) drop-shadow(0 4px 6px rgb(42 18 6 / .2)); }
.${P}-sticker img { display: block; width: 100%; height: auto; }
.${P}-words { text-align: left; width: 100%; max-width: 30rem; }
.${P}-words .x-s24-title { font-style: italic; rotate: -1.5deg; transform-origin: left; color: var(--hand); }
.${P}-words .x-s24-meta { letter-spacing: .02em; }
.${P}-hand { font: italic 400 clamp(22px, calc(var(--bw) * .08), 34px) / 1.1 var(--font-display); color: var(--hand); rotate: -2deg; }
.${P}-names { width: 78%; color: var(--hand); }
.${P}-names .names-art-wrap { display: block; width: 100%; position: relative; }
.${P}-names .names-art-ink, .${P}-names .names-art-amp { background: var(--hand); }
.${P}-page .x-s24-journey .journey-globe { width: min(100%, 340px, calc(var(--bh) - 230px)); }
@media (min-width: 1024px) { .${P}-page .x-s24-journey .journey-globe { width: min(100%, 360px, calc(var(--bh) - 120px)); } }
@media (prefers-reduced-motion: reduce) { .${P}-leaf { will-change: auto; } }
`

export default function StoryScrapbook() {
  const { t } = useLang()
  const take = useTake("kraft")
  const s = useChapters()
  const meta = useMeta(s)
  const { at, go, list, setList } = useStops(s.total)
  const [wide, setWide] = useState(() => matchMedia("(min-width: 1024px)").matches)
  useEffect(() => { const m = matchMedia("(min-width: 1024px)"), f = () => setWide(m.matches); m.addEventListener("change", f); return () => m.removeEventListener("change", f) }, [])
  const region = useRef<HTMLDivElement>(null), book = useRef<HTMLDivElement>(null)
  const leaves = useRef<(HTMLDivElement | null)[]>([])
  const angle = useRef<number[]>([]), springs = useRef<(() => void)[]>([])
  const n = s.total, end = n - 1

  // One leaf's angle (0 lying right, -180 turned over), its shade, and its place in the pile, written straight to it
  const paint = useCallback((k: number, a: number, moving = false) => {
    angle.current[k] = a
    const el = leaves.current[k]
    if (!el) return
    el.style.transform = `rotateY(${a}deg)`
    el.style.zIndex = String(moving ? 1000 : a < -90 ? k + 1 : n - k + 1)
    const curl = Math.sin((-a * Math.PI) / 180)
    el.querySelectorAll<HTMLElement>(`.${P}-shade`).forEach((sh) => { sh.style.opacity = String(curl * 0.9) })
    // On a phone a turned page has nowhere to lie: it's hidden once it's over
    el.style.visibility = !wide && a <= -179.5 ? "hidden" : ""
  }, [n, wide])
  const turnTo = useCallback((k: number, to: number, v = 0) => {
    springs.current[k]?.()
    const from = angle.current[k] ?? 0
    if (still()) { paint(k, to); return }
    springs.current[k] = spring(from, to, (x, done) => paint(k, x, !done), { k: 120, c: 19, v })
  }, [paint])
  useLayoutEffect(() => { for (let k = 0; k < n; k++) { springs.current[k]?.(); paint(k, k < at ? -180 : 0) } }, [wide, n]) // eslint-disable-line react-hooks/exhaustive-deps
  const [shown, setShown] = useState(0)
  useEffect(() => { if (shown === at) return; for (let k = 0; k < n; k++) { const to = k < at ? -180 : 0; if ((angle.current[k] ?? 0) !== to) turnTo(k, to) } setShown(at) }, [at, n, shown, turnTo])

  const step = useCallback((d: 1 | -1) => go(at + d), [go, at])
  const dragDir = useRef<0 | 1 | -1>(0)
  // Dragging a page: the leaf follows the finger (a page's width is the whole turn); let go past a quarter or flick
  const drag = useCallback((dx: number | null, v: number) => {
    const w = book.current ? book.current.clientWidth / (wide ? 2 : 1) : 360
    const fwd = dragDir.current
    if (dx !== null) {
      if (still()) return
      if (dragDir.current === 0) dragDir.current = dx < 0 ? 1 : -1
      const k = dragDir.current === 1 ? at : at - 1
      if (k < 0 || k >= n || (dragDir.current === 1 && at >= end)) { return }
      const p = Math.max(0, Math.min(1, (dragDir.current === 1 ? -dx : dx) / w))
      springs.current[k]?.()
      paint(k, dragDir.current === 1 ? -180 * p : -180 + 180 * p, true)
      return
    }
    dragDir.current = 0
    if (still() || fwd === 0) return false
    const k = fwd === 1 ? at : at - 1
    if (k < 0 || k >= n || (fwd === 1 && at >= end)) return true
    const p = fwd === 1 ? -(angle.current[k] ?? 0) / 180 : 1 + (angle.current[k] ?? -180) / 180
    const flick = Math.abs(v) > 0.35 && Math.sign(-v) === fwd
    if (p > 0.25 || flick) { go(at + fwd); turnTo(k, fwd === 1 ? -180 : 0, (v * 1000 * 180) / w); setShown(at + fwd) }
    else turnTo(k, fwd === 1 ? 0 : -180)
    return true
  }, [at, n, end, wide, go, paint, turnTo])
  useSwipe(region, step, drag)
  const said = useAnnounce(s, at)
  if (list) return <div className={`x-s24-root ${P}`} data-take={take}><style>{KIT_CSS + css}</style><ListView s={s} onBack={() => setList(false)} /></div>

  // What's pasted on each stop's pages
  const stick = (k: number): ReactNode => {
    const r = rnd(k, 3)
    if (k === 0 || k === end) return null
    if (r < 0.4) return <span className={`${P}-sticker`} style={{ width: "30%", right: "-5%", top: "-3%", rotate: `${150 + r * 40}deg` }}><Art src={ART.leaves.src} widths={ART.leaves.widths} sizes="160px" /></span>
    if (r < 0.7) return <span className={`${P}-sticker`} style={{ width: "15%", left: "5%", top: "4%", rotate: `${-12 + r * 20}deg` }}><Art src={ART.seal.src} widths={ART.seal.widths} sizes="80px" /></span>
    return null
  }
  const media = (k: number): ReactNode => {
    if (k === 0) return <KidPrints />
    if (k === end) return <JourneyStop active={at === end} />
    const c = s.stops[k - 1]
    return (
      <span className={`${P}-pasted`}>
        <Polaroid pic={chapterPic(c)} cap={caption(c)} tilt={TILTS[(k - 1) % TILTS.length] * 0.7} sizes="(min-width: 1024px) 360px, 70vw" eager={k <= 2} />
        {k % 2 === 1 ? <><span aria-hidden className={`${P}-corner is-a`} /><span aria-hidden className={`${P}-corner is-b`} /></> : <span aria-hidden className="x-s24-tape" style={{ ["--pw" as string]: "200px" }} />}
      </span>
    )
  }
  const words = (k: number): ReactNode => {
    if (k === 0) return <><span className={`${P}-names`}><NamesArt /></span><p aria-hidden className={`${P}-hand`}>{t.story.title.toLowerCase()}</p><span className={`${P}-sticker`} style={{ width: "30%", left: "4%", bottom: "3%", rotate: "-24deg" }}><Art src={ART.leaves.src} widths={ART.leaves.widths} sizes="200px" /></span><span className={`${P}-sticker`} style={{ width: "16%", right: "12%", top: "10%", rotate: "10deg" }}><Art src={ART.seal.src} widths={ART.seal.widths} sizes="80px" /></span></>
    if (k === end) return <EndWords s={s} className={`${P}-words`} />
    const c = s.stops[k - 1]
    return <Words c={c} meta={meta(c)} className={`${P}-words`} />
  }
  const page = (_k: number, kids: ReactNode, live: boolean, extra?: ReactNode) => (
    <div className={`${P}-page`} inert={!live || undefined} aria-hidden={!live || undefined}>{kids}{extra}<span aria-hidden className={`${P}-shade`} /></div>
  )
  return (
    <div className={`x-s24-root ${P}`} data-take={take}>
      <style>{KIT_CSS + css}</style>
      <h1 className="x-s24-h1">{t.story.title}</h1>
      <div ref={region} className="x-s24-region" role="region" aria-roledescription="carousel" aria-label={t.story.title} tabIndex={0} onKeyDown={arrowKeys(step)}>
        <div ref={book} className={`${P}-book`} role="group" aria-roledescription="slide" aria-label={t.story.slide(at + 1, n)}>
          <span aria-hidden className={`${P}-under`} />
          {wide && <div className={`${P}-base`}>{page(0, media(0), at === 0, stick(0))}</div>}
          {Array.from({ length: n }, (_, k) => (
            <div key={k} ref={(el) => { leaves.current[k] = el }} className={`${P}-leaf`}>
              <div className={`${P}-face`}>{wide ? page(k, words(k), at === k) : page(k, <>{media(k)}{words(k)}</>, at === k, stick(k))}</div>
              <div className={`${P}-face ${P}-back`}>{wide && k + 1 < n ? page(k + 1, media(k + 1), at === k + 1, stick(k + 1)) : page(-1, null, false)}</div>
            </div>
          ))}
        </div>
        <p className="sr-only" aria-live="polite">{said}</p>
      </div>
      <Controls at={at} total={n} go={go} onList={() => setList(true)} />
    </div>
  )
}
