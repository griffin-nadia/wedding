import { useEffect } from "react"

/** Run the paper shader only when it costs nothing that matters (v3 L): never on reduced motion, low memory, data saver or a low battery. */
async function canRun() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean }; getBattery?: () => Promise<{ charging: boolean; level: number }> }
  if ((nav.deviceMemory ?? 8) < 4 || nav.connection?.saveData) return false
  try { const b = await nav.getBattery?.(); if (b && !b.charging && b.level < 0.2) return false } catch { /* no battery API */ }
  try { return Boolean(document.createElement("canvas").getContext("webgl")) } catch { return false }
}

/** Lazy-loads the paper layer after the envelope has opened, on the paper scene only. */
export function usePaperGL(on: boolean) {
  useEffect(() => {
    if (!on) return
    let stop: (() => void) | undefined, dead = false
    const id = window.setTimeout(() => {
      void canRun().then((ok) => {
        if (!ok || dead) return
        void import("./paper-gl").then((m) => { if (!dead) stop = m.startPaper(__PAPER_ART__) })
      })
    }, 1200) // after the letter has settled, never on the first paint
    return () => { dead = true; clearTimeout(id); stop?.() }
  }, [on])
}
