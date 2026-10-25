import { toast } from "@/components/ui/toast"
import { copyText } from "@/lib/copy"
import type { useLang } from "@/lib/lang"
import type { Fortune } from "@/lib/api"
import { config } from "@/lib/config"
import { isDraws, mergeDraws, type Draw } from "@/lib/draws"

export const drawnKey = (token: string) => `ng-fortune-${token}`

/** A draw or a reveal happened (the reply sheet's card and Home's stay in step) */
export const FORTUNE_EVENT = "ng-fortune"

/** This device's draws for a household (run 26), append only: what an older back end can't keep */
const drawsKey = (token: string) => `ng-draws-${token}`
export function localDraws(token: string): Draw[] {
  try { const v = JSON.parse(localStorage.getItem(drawsKey(token)) ?? "[]"); return isDraws(v) ? v : [] } catch { return [] }
}
/** Adds to this device's list (never replacing a draw already in it), and tells any other fortune card on the page */
export function keepDraws(token: string, more: Draw[]) {
  const list = mergeDraws(localDraws(token), more)
  try { localStorage.setItem(drawsKey(token), JSON.stringify(list)) } catch { /* private mode: the back end has it */ }
  window.dispatchEvent(new Event(FORTUNE_EVENT))
  return list
}
/** Story-based drafts are drawn only with the switch on, or with ?preview in the address (to read them before) */
export const draftsOn = () => config.storyFortunes || (typeof location !== "undefined" && new URLSearchParams(location.search).has("preview"))

/** Android lets a page read a shake without asking; iPhones need a permission prompt, so there it's tap only. */
export const canShake = () => typeof window !== "undefined" && "DeviceMotionEvent" in window
  && typeof (DeviceMotionEvent as unknown as { requestPermission?: unknown }).requestPermission !== "function"
  && window.matchMedia("(pointer: coarse)").matches

/** Save to my phone: the share sheet where there is one, otherwise copied for their notes. */
export async function saveFortune(t: ReturnType<typeof useLang>["t"], f: Fortune) {
  const words = `${[f.tierJa, f.tier].filter(Boolean).join(" ")}${f.tier ? "." : "。"} ${f.text}`
  try {
    if (navigator.share) await navigator.share({ title: t.fortune.title, text: words })
    else if (await copyText(words)) toast(t.fortune.copied)
  } catch { /* cancelled */ }
}


/** Laptops and desktops (a mouse or trackpad): "Save as a picture" there, "Save to my phone" on phones */
export const finePointer = () => typeof window !== "undefined" && window.matchMedia("(pointer: fine)").matches

/** Words across lines no wider than the box: by word, or by character for Japanese (no spaces to break at) */
function wrapLines(g: CanvasRenderingContext2D, text: string, width: number) {
  const spaced = /\s/.test(text.trim())
  const parts = spaced ? text.trim().split(/\s+/) : [...text.trim()]
  const lines: string[] = []
  let line = ""
  for (const p of parts) {
    const next = line ? (spaced ? `${line} ${p}` : line + p) : p
    if (line && g.measureText(next).width > width + 1) { lines.push(line); line = p } else line = next
  }
  if (line) lines.push(line)
  return lines
}

/**
 * Run 27 (Jehan): the slip as a picture, without the save link. Drawn on a canvas from the slip on screen (its paper,
 * the two printed bands, each line of words where it sits, and the seal), so it matches the phone or laptop layout.
 * The page's own fonts are already loaded, so the canvas uses them. null where a canvas can't be made.
 */
export async function slipImage(slip: HTMLElement): Promise<Blob | null> {
  try { await document.fonts?.ready } catch { /* older browsers */ }
  const box = slip.getBoundingClientRect()
  if (!box.width || !box.height) return null
  const pad = 32, scale = 3
  const w = Math.round(box.width + pad * 2), h = Math.round(box.height + pad * 2)
  const canvas = document.createElement("canvas")
  canvas.width = w * scale; canvas.height = h * scale
  const g = canvas.getContext("2d")
  if (!g) return null
  g.scale(scale, scale)
  const slipStyle = getComputedStyle(slip)
  const ink = getComputedStyle(slip.querySelector(".omikuji-no") ?? slip).color
  // Around the slip: the letter's paper, so it reads as a slip lying on it
  g.fillStyle = "#e9dcc3"; g.fillRect(0, 0, w, h)
  const radius = parseFloat(slipStyle.borderTopLeftRadius) || 6
  g.save()
  g.shadowColor = "rgb(66 26 5 / 0.18)"; g.shadowBlur = 18; g.shadowOffsetY = 6
  g.fillStyle = "#f8f1e2"
  g.beginPath(); g.roundRect(pad, pad, box.width, box.height, radius); g.fill()
  g.restore()
  // The printed bands at the top and bottom, in the tier's ink
  g.globalAlpha = 0.8; g.fillStyle = ink
  g.fillRect(pad + 10, pad + 8, box.width - 20, 6)
  g.fillRect(pad + 10, pad + box.height - 14, box.width - 20, 6)
  g.globalAlpha = 1
  for (const el of slip.querySelectorAll<HTMLElement>(".omikuji-no, .omikuji-kichi, .omikuji-tier, .omikuji-text, .omikuji-count")) {
    const r = el.getBoundingClientRect(), s = getComputedStyle(el), text = el.textContent ?? ""
    if (!r.width || !text.trim()) continue
    g.font = `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`
    if ("letterSpacing" in g) (g as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = s.letterSpacing === "normal" ? "0px" : s.letterSpacing
    g.fillStyle = s.color; g.textBaseline = "middle"
    const size = parseFloat(s.fontSize), lead = parseFloat(s.lineHeight) || size * 1.35
    const lines = wrapLines(g, text, r.width)
    const left = r.left - box.left + pad, top = r.top - box.top + pad
    // Centred in its box, the way the slip lays each line out
    const block = lines.length * lead, y0 = top + (r.height - block) / 2
    lines.forEach((line, k) => {
      const lw = g.measureText(line).width
      const x = s.textAlign === "center" ? left + (r.width - lw) / 2 : s.textAlign === "right" || s.textAlign === "end" ? left + r.width - lw : left
      g.fillText(line, x, y0 + k * lead + lead / 2)
    })
  }
  // The seal: its own drawing, in the tier's ink, turned a little as on the slip
  const seal = slip.querySelector<HTMLElement>(".omikuji-seal"), svg = seal?.querySelector("svg")
  if (seal && svg) {
    try {
      const copy = svg.cloneNode(true) as SVGSVGElement
      copy.setAttribute("xmlns", "http://www.w3.org/2000/svg")
      copy.setAttribute("width", "100"); copy.setAttribute("height", "100")
      copy.style.color = ink
      copy.querySelectorAll("path, text").forEach((p) => {
        if (p.getAttribute("stroke") === "currentColor") p.setAttribute("stroke", ink)
        if (p.getAttribute("fill") === "currentColor") p.setAttribute("fill", ink)
      })
      copy.querySelectorAll("text").forEach((x) => x.setAttribute("font-family", "serif"))
      const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copy)], { type: "image/svg+xml" }))
      const img = new Image()
      await new Promise<void>((ok, no) => { img.onload = () => ok(); img.onerror = () => no(new Error("seal")); img.src = url })
      const r = seal.getBoundingClientRect()
      g.save()
      g.globalAlpha = 0.9
      g.translate(r.left - box.left + pad + r.width / 2, r.top - box.top + pad + r.height / 2)
      g.rotate((6 * Math.PI) / 180)
      g.drawImage(img, -r.width / 2, -r.height / 2, r.width, r.height)
      g.restore()
      URL.revokeObjectURL(url)
    } catch { /* the words are the picture; the seal is a nicety */ }
  }
  return new Promise((done) => canvas.toBlob((b) => done(b), "image/png"))
}

/**
 * Run 27: save the slip as a picture. Phones: the share sheet with the picture (Save Image, Photos, a chat). Laptops:
 * downloaded as omikuji.png. Where a picture can't be made or shared, the words as before (share or copy).
 */
export async function saveFortuneImage(t: ReturnType<typeof useLang>["t"], slip: HTMLElement | null, f: Fortune) {
  try {
    const blob = slip ? await slipImage(slip) : null
    if (blob) {
      const file = new File([blob], "omikuji.png", { type: "image/png" })
      if (!finePointer() && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: t.fortune.title })
        return
      }
      const url = URL.createObjectURL(blob), a = document.createElement("a")
      a.href = url; a.download = "omikuji.png"
      document.body.append(a); a.click(); a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 5000)
      toast(t.fortune.savedPicture)
      return
    }
  } catch (err) {
    if ((err as Error)?.name === "AbortError") return // they closed the share sheet
  }
  await saveFortune(t, f)
}
