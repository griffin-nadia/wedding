import { useEffect, useState } from "react"
import { privateArt } from "../../private"

/**
 * Nadia's map pieces as stickers (run 24, LAB ONLY until Nadia says yes): the pagoda, Yasaka Shrine's gate,
 * Kiyomizu-dera and Kyoto Tower, cut from her venue map (private/nadia-art-22oct/venue-map-v2.png, 1800 × 1500) in the
 * browser at run time, in a worker (stickers.worker.ts). Nothing is exported into the repo: the map comes from the lab's dev server only, and in any build the address is
 * empty, so the stickers simply don't show. The cut: her paper background (light, low colour) is flooded
 * away from the crop's edges, so only what's joined to the edge goes and the drawing's own whites stay.
 */
export type Sticker = "pagoda" | "gate" | "kiyomizu" | "tower"
const CUTS: Record<Sticker, [x: number, y: number, w: number, h: number]> = {
  pagoda: [912, 572, 160, 360],
  gate: [1076, 184, 266, 196],
  kiyomizu: [1324, 628, 440, 296],
  tower: [412, 760, 110, 236],
}
export const STICKER_ALT: Record<Sticker, string> = {
  pagoda: "Yasaka Pagoda, from Nadia's map", gate: "Yasaka Shrine's gate, from Nadia's map",
  kiyomizu: "Kiyomizu-dera, from Nadia's map", tower: "Kyoto Tower, from Nadia's map",
}

let job: Promise<Partial<Record<Sticker, string>>> | null = null
function load() {
  const url = privateArt("nadia-art-22oct/venue-map-v2.png")
  if (!url) return Promise.resolve({}) // a build: no private art at all
  job ??= fetch(url).then(async (res) => {
    if (!res.ok) return {}
    const map = await res.blob()
    const worker = new Worker(new URL("./stickers.worker.ts", import.meta.url), { type: "module" })
    const blobs = await new Promise<Record<string, Blob>>((ok, no) => { worker.onmessage = (e) => ok(e.data); worker.onerror = no; worker.postMessage({ map, cuts: CUTS }) })
    worker.terminate()
    return Object.fromEntries(Object.entries(blobs).map(([k, b]) => [k, URL.createObjectURL(b)])) as Partial<Record<Sticker, string>>
  }).catch(() => ({}))
  return job
}

/** The stickers once they're cut (an empty record until then, or for good in a test build) */
export function useStickers(on = true) {
  const [s, setS] = useState<Partial<Record<Sticker, string>>>({})
  useEffect(() => { if (!on) return; let live = true; void load().then((x) => { if (live) setS(x) }); return () => { live = false } }, [on])
  return s
}
