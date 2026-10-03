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

/**
 * Omikuji after RSVP, all 大吉. Closed: a box and "Draw one". Drawing tilts the box three times
 * (900 ms) and unfolds the slip (400 ms); reduced motion just fades. The slip gets focus.
 * Return visits show it already drawn.
 */
export function FortuneCard({ token, className }: { token: string; className?: string }) {
  const { t } = useLang()
  const [tips, setTips] = useState(FORTUNES)
  const [state, setState] = useState<"closed" | "drawing" | "open">(() => {
    try { return localStorage.getItem(drawnKey(token)) ? "open" : "closed" } catch { return "closed" }
  })
  const slip = useRef<HTMLDivElement>(null)
  useEffect(() => { getFortunes().then((f) => f && f.length === 12 && setTips(f)) }, [])
  const i = fortuneIndex(token, tips.length)
  const text = tips[i]

  function draw() {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    setState("drawing")
    window.setTimeout(() => {
      setState("open")
      try { localStorage.setItem(drawnKey(token), "1") } catch { /* private mode */ }
      requestAnimationFrame(() => slip.current?.focus())
    }, still ? 0 : 900)
  }
  async function save() {
    const words = `${t.fortune.blessing} ${t.fortune.blessingEn} · ${text}`
    try {
      if (navigator.share) await navigator.share({ title: t.fortune.title, text: words })
      else if (await copyText(words)) toast(t.fortune.copied)
    } catch { /* cancelled */ }
  }

  if (state !== "open") {
    return (
      <section aria-labelledby="fortune" className={cn("flex items-center gap-4 rounded-md border bg-card p-4", className)}>
        <span aria-hidden className={cn("omikuji-box grid h-14 w-10 shrink-0 place-items-center rounded-sm bg-primary font-ja text-primary-foreground", state === "drawing" && "omikuji-shake")}>籤</span>
        <div className="flex flex-1 flex-col items-start gap-2">
          <h3 id="fortune" className="font-sans text-base font-semibold text-foreground">{t.fortune.title}</h3>
          <Button variant="outline" onClick={draw} disabled={state === "drawing"} aria-busy={state === "drawing"}>{t.fortune.draw}</Button>
        </div>
      </section>
    )
  }
  return (
    <div ref={slip} tabIndex={-1} role="group" aria-labelledby="fortune-head"
      className={cn("omikuji-slip flex flex-col gap-2 rounded-sm border border-[#e5d0a8] bg-[#fffdf8] p-4 text-[#421a05] shadow-paper outline-2 outline-offset-2 outline-transparent focus-visible:outline-ring", className)}>
      <p id="fortune-head" className="flex items-baseline justify-between gap-3">
        <span><span lang="ja" className="font-ja text-2xl text-[#a43108]">{t.fortune.blessing}</span> <span className="label-caps text-[#754b38]">{t.fortune.blessingEn}</span></span>
        <span className="label-caps text-[#754b38]">{t.fortune.number(i + 1, tips.length)}</span>
      </p>
      <p className="hand">{text}</p>
      <button type="button" onClick={save} className="min-h-11 self-start text-[#a43108] underline underline-offset-4 outline-2 outline-offset-2 outline-transparent focus-visible:outline-[#a43108]">{t.fortune.save}</button>
    </div>
  )
}
