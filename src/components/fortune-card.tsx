import { Hanko } from "@/components/hanko"
import { useEffect, useRef, useState } from "react"
import { nextFrame } from "@/lib/frame"
import { FORTUNES } from "@/content/en"
import { getFortunes, type Fortune } from "@/lib/api"
import { useLang } from "@/lib/lang"
import { canShake, drawnKey, saveFortune } from "@/lib/fortune"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { kanjiNumber } from "@/lib/kanji"

/** The drafts (all 大吉) as fortunes: what shows until the sheet's Fortunes tab answers, or if it's empty */
export const DRAFT_FORTUNES: Fortune[] = FORTUNES.map((text, i) => ({ no: i + 1, tier: "Great Blessing", tierJa: "大吉", category: "", text }))

/** The same fortune for a household on any device: picked from its token, over however many there are. */
export function fortuneIndex(token: string, of: number) {
  let h = 0
  for (const c of token) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h % of
}


/** The box: a hexagonal 御籤 tin in rust with a cream label; its stick rises as the fortune comes out. */
export function Box({ drawing }: { drawing: boolean }) {
  return (
    <svg viewBox="0 0 64 96" className={cn("omikuji-tin", drawing && "is-drawing")} aria-hidden>
      <rect className="omikuji-stick" x="29" y="2" width="6" height="34" rx="1.5" />
      <path className="omikuji-body" d="M10 22 L32 14 L54 22 L54 90 L10 90 Z" />
      <path className="omikuji-top" d="M10 22 L32 14 L54 22 L32 30 Z" />
      <rect className="omikuji-label" x="22" y="40" width="20" height="38" rx="2" />
      <text className="omikuji-glyph" x="32" y="56" textAnchor="middle">御</text>
      <text className="omikuji-glyph" x="32" y="72" textAnchor="middle">籤</text>
    </svg>
  )
}

/**
 * Omikuji after RSVP: Nadia's 25 (22 Oct), five tiers of five (大吉, 素晴吉, 良い吉, 特別吉, メガ吉), one per category
 * (Food, Travel, Social, Shopping, Fun), from the sheet's Fortunes tab; the slip shows its own tier. No bad luck. Closed: the tin, a line and "Draw one"; the tin itself is
 * also the button. Drawing shakes the tin (900 ms) and raises its stick, then the slip, centred, folds open like a
 * real omikuji (run 19): it comes out folded in three, 大吉 on top; the middle third swings down from behind, then the
 * last, each a paper fold with its shade lifting as it flattens and a little give as it lands; then the creases ease
 * out to the two faint lines the paper keeps (about 1.1 s, then 0.9 s). The real slip holds its place from the start,
 * so nothing below moves, and takes focus. Android phones can shake to draw. Reduced motion: no shake, no fold, the
 * slip fades in. The fortune is the household's for good, on any device. Run 25: the tin comes back on each visit, so
 * the fold plays on a first reply and after an update (once per visit; within a visit it opens on the slip). Before,
 * a slip drawn once opened already unfolded for ever after, which is why it never folded after an update on Jehan's
 * Android phone.
 */
const FOLD_MS = 1100
export function FortuneCard({ token, className }: { token: string; className?: string }) {
  const { t } = useLang()
  const [tips, setTips] = useState(DRAFT_FORTUNES)
  const [state, setState] = useState<"closed" | "drawing" | "open">(() => {
    try { return sessionStorage.getItem(drawnKey(token)) ? "open" : "closed" } catch { return "closed" }
  })
  const slip = useRef<HTMLDivElement>(null)
  // "folding": the paper copies fold open over the real slip (hidden, holding its place); "settling": the real slip,
  // its creases easing out; null: a slip opened before, or reduced motion
  const [fold, setFold] = useState<"folding" | "settling" | null>(null)
  const shaky = useRef(canShake())
  useEffect(() => { getFortunes(token).then((f) => f && f.length && setTips(f)) }, [token])
  const i = fortuneIndex(token, tips.length)
  const fortune = tips[i]

  function draw() {
    if (state !== "closed") return
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    setState("drawing")
    if (!still) navigator.vibrate?.(8) // a tiny tick on Android (iPhones have no vibrate); none under reduced motion
    window.setTimeout(() => {
      setState("open")
      if (!still) { setFold("folding"); window.setTimeout(() => setFold("settling"), FOLD_MS) }
      try { sessionStorage.setItem(drawnKey(token), "1") } catch { /* private mode */ }
      nextFrame(() => slip.current?.focus())
    }, still ? 0 : 900)
  }
  // Shake to draw (Android): a firm shake, not a wobble while reading
  useEffect(() => {
    if (state !== "closed" || !shaky.current) return
    const on = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity
      if (a && Math.hypot(a.x ?? 0, a.y ?? 0, a.z ?? 0) > 24) draw()
    }
    window.addEventListener("devicemotion", on)
    return () => window.removeEventListener("devicemotion", on)
  })
  const save = () => saveFortune(t, fortune)

  if (state !== "open") {
    return (
      <section aria-labelledby="fortune" className={cn("omikuji paper-feel flex items-center gap-6 rounded-md border bg-card p-4", className)}>
        <button type="button" onClick={draw} disabled={state === "drawing"} aria-label={t.fortune.boxLabel} className="omikuji-hit">
          <Box drawing={state === "drawing"} />
        </button>
        <div className="flex flex-1 flex-col items-start gap-2">
          <h3 id="fortune" className="text-body font-medium text-foreground">{t.fortune.title}</h3>
          <p className="text-small text-muted-foreground" aria-live="polite">{state === "drawing" ? t.fortune.drawing : shaky.current ? t.fortune.hintShake : t.fortune.hint}</p>
          <Button variant="secondary" onClick={draw} disabled={state === "drawing"} aria-busy={state === "drawing"}>{t.fortune.draw}</Button>
        </div>
      </section>
    )
  }
  return (
    <div className={cn("omikuji-stage", className)}>
      <div ref={slip} tabIndex={-1} role="group" aria-labelledby="fortune-head" className={cn("omikuji-slip paper-feel", fold === "folding" && "is-folded", fold === "settling" && "is-fresh")}>
        <span aria-hidden className="omikuji-creases" />
        <SlipWords i={i} of={tips.length} fortune={fortune} />
        <Button variant="link" onClick={save} className="omikuji-save">{t.fortune.save}</Button>
      </div>
      {fold === "folding" && <Fold i={i} of={tips.length} fortune={fortune} />}
    </div>
  )
}

/**
 * The fold: three paper copies of the slip, each cut to its third. The top third stays; the middle hangs from the
 * first crease and the last from the second, so the last rides with the middle until it opens in turn. Looks only
 * (inert, hidden from screen readers): the real slip under it is the one that's read and focused.
 */
function Fold({ i, of, fortune }: { i: number; of: number; fortune: Fortune }) {
  const { t } = useLang()
  const copy = (part: number) => (
    <div className={`omikuji-slip paper-feel omikuji-copy omikuji-part-${part}`}>
      <span className="omikuji-creases" />
      <SlipWords i={i} of={of} fortune={fortune} copy />
      <Button variant="link" tabIndex={-1} className="omikuji-save">{t.fortune.save}</Button>
      {part > 1 && <span className="omikuji-shade" />}
    </div>
  )
  return (
    <div className="omikuji-fold" aria-hidden inert>
      {copy(1)}
      <div className="omikuji-leaf omikuji-leaf-2">
        {copy(2)}<span className="omikuji-back omikuji-back-2" />
        <div className="omikuji-leaf omikuji-leaf-3">{copy(3)}<span className="omikuji-back omikuji-back-3" /></div>
      </div>
    </div>
  )
}

/** The words on the slip: 第七番, its tier (素晴吉 large, Grand Blessing in small caps), its category, the line, No. 7 of
 *  25. Their words stay in English on the Japanese site too, marked lang="en". Shared by both reveals. */
export function SlipWords({ i, of, fortune, copy = false }: { i: number; of: number; fortune: Fortune; copy?: boolean }) {
  const { t } = useLang()
  return (
    <>
      <p lang="ja" className="omikuji-no font-ja" aria-hidden>第{kanjiNumber(fortune.no || i + 1)}番</p>
      <p id={copy ? undefined : "fortune-head"} className="flex flex-col items-center gap-1">
        <span lang="ja" className="omikuji-kichi font-ja">{fortune.tierJa}</span>
        <span lang="en" className="label-caps">{fortune.tier}</span>
      </p>
      {fortune.category && <p lang="en" className="label-caps omikuji-category">{fortune.category}</p>}
      <p lang="en" className="omikuji-text">{fortune.text}</p>
      {/* The fortune's own number from the Fortunes tab (the slip's place in the list only for the drafts) */}
      <p className="label-caps omikuji-count">{t.fortune.number(fortune.no || i + 1, of)}</p>
      {/* The same hand-cut 寿 seal as the confirmation's head, small, as if stamped on the slip */}
      <Hanko size="sm" className="omikuji-seal" />
    </>
  )
}
