import { useEffect, useRef, useState } from "react"
import { FORTUNES } from "@/content/en"
import { getFortunes } from "@/lib/api"
import { useLang } from "@/lib/lang"
import { toast } from "@/components/toast"
import { copyText } from "@/lib/copy"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/** The same fortune for a household on any device: picked from its token. */
export function fortuneIndex(token: string, of = 12) {
  let h = 0
  for (const c of token) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h % of
}

const drawnKey = (token: string) => `ng-fortune-${token}`
const KANJI = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"]
/** 1 → 一, 12 → 十二: the slip's number, as on a real omikuji (第七番) */
export const kanjiNumber = (n: number) => (n <= 10 ? KANJI[n] : `十${KANJI[n - 10]}`)

/** This household's fortune: Griffin's lines from the Content tab once they're in, the drafts until then. */
export function useFortune(token: string) {
  const [tips, setTips] = useState(FORTUNES)
  useEffect(() => { getFortunes().then((f) => f && f.length === 12 && setTips(f)) }, [])
  const i = fortuneIndex(token, tips.length)
  return { i, of: tips.length, text: tips[i], drawn: () => { try { localStorage.setItem(drawnKey(token), "1") } catch { /* private mode */ } } }
}

/** Android lets a page read a shake without asking; iPhones need a permission prompt, so there it's tap only. */
const canShake = () => typeof window !== "undefined" && "DeviceMotionEvent" in window
  && typeof (DeviceMotionEvent as unknown as { requestPermission?: unknown }).requestPermission !== "function"
  && window.matchMedia("(pointer: coarse)").matches

/** The box: a hexagonal 御籤 tin in rust with a cream label; its stick rises as the fortune comes out. */
function Box({ drawing }: { drawing: boolean }) {
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
 * Omikuji after RSVP, all 大吉 (no branch, per Nadia). Closed: the tin, a line and "Draw one"; the tin itself is
 * also the button. Drawing shakes the tin (900 ms) and raises its stick, then the slip unfolds (300 ms) and
 * takes focus. Android phones can shake to draw. Reduced motion: no shake, the slip fades in. Return visits
 * open on the slip. The fortune is the household's for good, on any device.
 */
export function FortuneCard({ token, className }: { token: string; className?: string }) {
  const { t } = useLang()
  const [tips, setTips] = useState(FORTUNES)
  const [state, setState] = useState<"closed" | "drawing" | "open">(() => {
    try { return localStorage.getItem(drawnKey(token)) ? "open" : "closed" } catch { return "closed" }
  })
  const slip = useRef<HTMLDivElement>(null)
  const shaky = useRef(canShake())
  useEffect(() => { getFortunes().then((f) => f && f.length === 12 && setTips(f)) }, [])
  const i = fortuneIndex(token, tips.length)
  const text = tips[i]

  function draw() {
    if (state !== "closed") return
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    setState("drawing")
    if (!still) navigator.vibrate?.(12)
    window.setTimeout(() => {
      setState("open")
      try { localStorage.setItem(drawnKey(token), "1") } catch { /* private mode */ }
      requestAnimationFrame(() => slip.current?.focus())
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
  async function save() {
    const words = `${t.fortune.blessing} ${t.fortune.blessingEn}. ${text}`
    try {
      if (navigator.share) await navigator.share({ title: t.fortune.title, text: words })
      else if (await copyText(words)) toast(t.fortune.copied)
    } catch { /* cancelled */ }
  }

  if (state !== "open") {
    return (
      <section aria-labelledby="fortune" className={cn("omikuji flex items-center gap-5 rounded-md border bg-card p-4", className)}>
        <button type="button" onClick={draw} disabled={state === "drawing"} aria-label={t.fortune.boxLabel} className="omikuji-hit">
          <Box drawing={state === "drawing"} />
        </button>
        <div className="flex flex-1 flex-col items-start gap-2">
          <h3 id="fortune" className="text-base font-medium text-foreground">{t.fortune.title}</h3>
          <p className="text-sm text-muted-foreground" aria-live="polite">{state === "drawing" ? t.fortune.drawing : shaky.current ? t.fortune.hintShake : t.fortune.hint}</p>
          <Button variant="outline" onClick={draw} disabled={state === "drawing"} aria-busy={state === "drawing"}>{t.fortune.draw}</Button>
        </div>
      </section>
    )
  }
  return (
    <div ref={slip} tabIndex={-1} role="group" aria-labelledby="fortune-head" className={cn("omikuji-slip", className)}>
      <p lang="ja" className="omikuji-no font-ja" aria-hidden>第{kanjiNumber(i + 1)}番</p>
      <p id="fortune-head" className="flex flex-col items-center gap-1">
        <span lang="ja" className="omikuji-kichi font-ja">{t.fortune.blessing}</span>
        <span className="label-caps">{t.fortune.blessingEn}</span>
      </p>
      <p className="omikuji-text">{text}</p>
      <p className="label-caps omikuji-count">{t.fortune.number(i + 1, tips.length)}</p>
      <button type="button" onClick={save} className="omikuji-save">{t.fortune.save}</button>
    </div>
  )
}
