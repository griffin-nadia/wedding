import { Hanko } from "@/components/hanko"
import { useEffect, useRef, useState } from "react"
import { nextFrame } from "@/lib/frame"
import { FORTUNES } from "@/content/en"
import { getFortunes, saveDraw, type Fortune } from "@/lib/api"
import { config } from "@/lib/config"
import { useLang } from "@/lib/lang"
import { canShake, draftsOn, drawnKey, finePointer, FORTUNE_EVENT, keepDraws, localDraws, saveFortuneImage } from "@/lib/fortune"
import { fortuneFor, fortuneIndex, lastDraw, mergeDraws, pickFor, randomPick, type Draw } from "@/lib/draws"
import { Button } from "@/components/ui/button"
import { Shuffle } from "lucide-react"
import { cn } from "@/lib/utils"
import { kanjiNumber } from "@/lib/kanji"

/** The first travel tips (all 大吉) as fortunes: what shows until the sheet's Fortunes tab answers, or if it's empty.
 *  (Not the story-based drafts: those are Fortunes tab rows marked Draft, see config.storyFortunes.) */
export const DRAFT_FORTUNES: Fortune[] = FORTUNES.map((text, i) => ({ no: i + 1, tier: "Great Blessing", tierJa: "大吉", category: "", text }))

export { fortuneIndex } // the lab's slips import it from here

/** Run 26: each tier's colour on the slip (tokens.css --tier-*), by the Fortunes tab's tier names; anything else 大吉 */
const TIERS: Record<string, string> = { "Good Blessing": "good", "Great Blessing": "great", "Special Blessing": "special", "Grand Blessing": "grand", "Super Blessing": "super", 良い吉: "good", 大吉: "great", 特別吉: "special", 素晴吉: "grand", メガ吉: "super" }
const tierOf = (f: Fortune) => TIERS[f.tier] ?? TIERS[f.tierJa] ?? "great"

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
 * real omikuji (run 19): run 26c, it comes out folded in half and opens from the middle like a letter, the top half up
 * and the bottom half down together, each with its shade lifting as it flattens and a little give as it lands; then the
 * crease eases out to the faint line the paper keeps (about 1.1 s, then 0.9 s). The real slip holds its place from the start,
 * so nothing below moves, and takes focus. Android phones can shake to draw. Reduced motion: no shake, no fold, the
 * slip fades in (no fold). The fortune is the household's for good, on any device. Run 25: the tin comes back on each visit, so
 * the fold plays on a first reply and after an update (once per visit; within a visit it opens on the slip). Before,
 * a slip drawn once opened already unfolded for ever after, which is why it never folded after an update on Jehan's
 * Android phone. Run 26: "Draw another" under the slip. Each draw is saved with its number (lib/draws.ts), never over
 * an earlier one; the slip shows the latest. No bad luck still: every tier is a blessing, and drafts aren't drawn.
 */
const FOLD_MS = 1100
/** Run 27: the Fortunes tab's list once it has answered, kept for the visit, so a second card (Home's after the reply
 *  sheet's) starts on it instead of the built-in tips */
const answered = new Map<string, Fortune[]>()
export function FortuneCard({ token, className, title }: { token: string; className?: string; title?: string }) {
  const { t, lang } = useLang()
  const [tips, setTips] = useState(() => answered.get(token) ?? DRAFT_FORTUNES)
  // Run 27 (Jehan: it showed a blue slip, then switched to another): no slip until the Fortunes tab has answered (or
  // can't), so the built-in tips never show first and get swapped for the real fortune of the same number
  const [ready, setReady] = useState(() => answered.has(token) || !config.apiUrl)
  const readyRef = useRef(ready)
  readyRef.current = ready
  // Run 26: every draw, numbered, append only (this device's list, merged with the back end's Draws tab)
  const [draws, setDraws] = useState<Draw[]>(() => localDraws(token))
  const [state, setState] = useState<"closed" | "drawing" | "open">(() => {
    try { return sessionStorage.getItem(drawnKey(token)) ? "open" : "closed" } catch { return "closed" }
  })
  const slip = useRef<HTMLDivElement>(null)
  // "folding": the paper copies fold open over the real slip (hidden, holding its place); "settling": the real slip,
  // its creases easing out; null: a slip opened before, or reduced motion
  const [fold, setFold] = useState<"folding" | "settling" | null>(null)
  const shaky = useRef(canShake())
  const live = useRef(true)
  const keeps = useRef(false) // the back end keeps draws (an older one doesn't: nothing is sent to it)
  useEffect(() => {
    live.current = true
    document.fonts?.load("500 20px Caveat").catch(() => {}) // the slip's hand, fetched while the tin is still closed
    getFortunes(token).then((r) => {
      if (!live.current) return
      if (r?.fortunes.length) { answered.set(token, r.fortunes); setTips(r.fortunes) }
      setReady(true)
      if (!r) return
      if (!r.draws) return // an older back end: this device's list is the record
      keeps.current = true
      // Draws made here but not in the sheet yet (before its Draws tab, or offline) go up; nothing there is rewritten
      for (const d of localDraws(token)) if (!r.draws.some((x) => x.draw === d.draw)) saveDraw(token, d)
      setDraws((now) => mergeDraws(now, keepDraws(token, r.draws!)))
    })
    // The other card on the page (the reply sheet's, or Home's) drew or opened one: show the same
    const sync = () => {
      setDraws((now) => mergeDraws(now, localDraws(token)))
      setState((s) => { try { return s === "closed" && sessionStorage.getItem(drawnKey(token)) ? "open" : s } catch { return s } })
    }
    window.addEventListener(FORTUNE_EVENT, sync)
    return () => { live.current = false; window.removeEventListener(FORTUNE_EVENT, sync) }
  }, [token])
  // The whole numbered pool, drafts included, so every household's pick is the same as before run 26; a draft is
  // stepped past while the switch is off (all drafts: the built-in tips)
  const drafts = draftsOn()
  const pool = tips.some((f) => drafts || !f.draft) ? tips : DRAFT_FORTUNES
  const n = Math.max(1, lastDraw(draws)) // a slip opened before run 26 kept no list: that was draw 1
  // The latest draw's saved fortune where there is one (so a later change to the pool never changes a saved slip),
  // otherwise its pick
  const savedNo = draws.find((d) => d.draw === n)?.no
  const saved = savedNo ? pool.findIndex((f) => f.no === savedNo && (drafts || !f.draft)) : -1
  const i = saved >= 0 ? saved : fortuneFor(token, n, pool, drafts)
  const fortune = pool[i]

  function record(draw: number) {
    // The first is the household's own; a redraw is random and always a new slip (run 26 review)
    const k = draw > 1 ? randomPick(pool, drafts, fortune.no) : pickFor(token, draw, pool, drafts)
    const d = { draw, no: pool[k].no }
    setDraws((now) => mergeDraws(now, [d]))
    keepDraws(token, [d])
    if (keeps.current) saveDraw(token, d) // before the back end answers, the load above sends it up instead
  }
  function unfold(still: boolean) {
    if (!still) { setFold("folding"); window.setTimeout(() => setFold("settling"), FOLD_MS) }
    // Run 27 (Jehan's recording): focus without the browser's own scroll, which jumped the sheet about on Draw another;
    // only if the slip isn't fully in view, the least scroll that shows it
    nextFrame(() => { const el = slip.current; if (!el) return; el.focus({ preventScroll: true }); el.scrollIntoView({ block: "nearest" }) })
  }
  function draw() {
    if (state !== "closed") return
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    shakeUntil.current = Date.now() + (still ? 0 : 900)
    setState("drawing")
    if (!still) navigator.vibrate?.(8) // a tiny tick on Android (iPhones have no vibrate); none under reduced motion
  }
  // Run 27: the slip comes out once the shake is over and the Fortunes tab has answered, so the first draw is picked
  // from the real list and never a built-in tip first (that showed one slip, then switched to another)
  const shakeUntil = useRef(0)
  useEffect(() => {
    if (state !== "drawing" || !ready) return
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const id = window.setTimeout(() => {
      if (!lastDraw(draws)) record(1) // the first draw is saved too; a later visit's reveal shows the latest, no new draw
      setState("open")
      try { sessionStorage.setItem(drawnKey(token), "1") } catch { /* private mode */ }
      window.dispatchEvent(new Event(FORTUNE_EVENT))
      unfold(still)
    }, Math.max(0, shakeUntil.current - Date.now()))
    return () => window.clearTimeout(id)
    // record and unfold read this render's list, which is the real one once ready is true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, ready])
  // Run 26: draw another. The next number, saved as a new draw (the ones before stay as they were), and the new slip
  // folds open in place (fades under reduced motion)
  function again() {
    record(n + 1)
    unfold(window.matchMedia("(prefers-reduced-motion: reduce)").matches)
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
  // Run 27: the slip as a picture (shared on phones, downloaded on laptops), the words if that can't be done
  const save = () => saveFortuneImage(t, slip.current, lang === "ja" && fortune.textJa ? { ...fortune, text: fortune.textJa, tier: "" } : fortune)
  const saveLabel = finePointer() ? t.fortune.saveDesktop : t.fortune.save

  // A slip opened earlier this visit waits for the real list too (the tin, still, until it answers)
  if (state !== "open" || !ready) {
    const busy = state !== "closed"
    return (
      <section aria-labelledby={`fortune-${token}`} className={cn("omikuji paper-feel flex items-center gap-6 rounded-md border bg-card p-4", className)}>
        <button type="button" onClick={draw} disabled={busy} aria-label={t.fortune.boxLabel} className="omikuji-hit">
          <Box drawing={busy} />
        </button>
        <div className="flex flex-1 flex-col items-start gap-2">
          <h3 id={`fortune-${token}`} className="text-body font-medium text-foreground">{title ?? t.fortune.title}</h3>
          <p className="text-small text-muted-foreground" aria-live="polite">{busy ? t.fortune.drawing : shaky.current ? t.fortune.hintShake : t.fortune.hint}</p>
          <Button variant="secondary" onClick={draw} disabled={busy} aria-busy={busy}>{t.fortune.draw}</Button>
        </div>
      </section>
    )
  }
  return (
    <div data-tier={tierOf(fortune)} className={cn("omikuji-stage", className)}>
      <div className="omikuji-paper">
        <div key={n} ref={slip} data-tier={tierOf(fortune)} tabIndex={-1} role="group" aria-labelledby={`fortune-head-${token}`} className={cn("omikuji-slip paper-feel", fold === "folding" && "is-folded", fold === "settling" && "is-fresh")}>
          <span aria-hidden className="omikuji-creases" />
          <SlipWords i={i} of={pool.length} fortune={fortune} headId={`fortune-head-${token}`} />
          <Button variant="link" onClick={save} className="omikuji-save">{saveLabel}</Button>
        </div>
        {fold === "folding" && <Fold key={n} i={i} of={pool.length} fortune={fortune} />}
      </div>
      {/* Run 26c (Jehan): the site's own secondary button, like every other next step */}
      <Button variant="secondary" size="md" onClick={again} disabled={fold === "folding"} className="omikuji-again"><Shuffle className="size-4" aria-hidden />{t.fortune.again}</Button>
    </div>
  )
}

/**
 * The fold: two paper copies of the slip, each cut to its half. Run 26c (Jehan's phone check, 24 Oct): it opens from
 * the middle like a letter: the slip comes out folded in half towards you, then the top half swings up and the bottom
 * half swings down together, the words showing as each flattens, so neither half is ever blank. Looks only (inert,
 * hidden from screen readers): the real slip under it is the one that's read and focused.
 */
function Fold({ i, of, fortune }: { i: number; of: number; fortune: Fortune }) {
  const { t } = useLang()
  const half = (side: "top" | "bottom") => (
    <div className={`omikuji-leaf omikuji-leaf-${side}`}>
      <div data-tier={tierOf(fortune)} className={`omikuji-slip paper-feel omikuji-copy omikuji-half-${side}`}>
        <span className="omikuji-creases" />
        <SlipWords i={i} of={of} fortune={fortune} copy />
        <Button variant="link" tabIndex={-1} className="omikuji-save">{finePointer() ? t.fortune.saveDesktop : t.fortune.save}</Button>
        <span className="omikuji-shade" />
      </div>
    </div>
  )
  return <div className="omikuji-fold" aria-hidden inert>{half("top")}{half("bottom")}</div>
}

/** The words on the slip: 第七番, its tier (素晴吉 large, Grand Blessing in small caps), its category, the line, No. 7 of
 *  25. Run 26: with Japanese on, the line in Japanese where the Fortunes tab has it, otherwise their English, marked
 *  lang="en". Shared by both reveals. */
export function SlipWords({ i, of, fortune, copy = false, headId = "fortune-head" }: { i: number; of: number; fortune: Fortune; copy?: boolean; headId?: string }) {
  const { t, lang } = useLang()
  const ja = lang === "ja" ? fortune.textJa : ""
  return (
    <>
      <p lang="ja" className="omikuji-no font-ja" aria-hidden>第{kanjiNumber(fortune.no || i + 1)}番</p>
      <p id={copy ? undefined : headId} className="omikuji-head flex flex-col items-center gap-1">
        <span lang="ja" className="omikuji-kichi font-ja">{fortune.tierJa}</span>
        {/* Run 27: with Japanese on, the tier is its Japanese name only (the kanji above), and no English category */}
        {!ja && <span lang="en" className="omikuji-hand omikuji-tier">{fortune.tier}</span>}
      </p>
      {/* Run 27 (Jehan): no category line, the slip says less (the tier, the fortune, its number) */}
      <p lang={ja ? "ja" : "en"} className="omikuji-text">{ja || fortune.text}</p>
      {/* The fortune's own number from the Fortunes tab (the slip's place in the list only for the drafts) */}
      <p className="omikuji-hand omikuji-count">{t.fortune.number(fortune.no || i + 1, of)}</p>
      {/* The same hand-cut 寿 seal as the confirmation's head, small, as if stamped on the slip */}
      <Hanko size="sm" className="omikuji-seal" />
    </>
  )
}
