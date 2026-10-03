import { lazy, Suspense, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { SlidersHorizontal } from "lucide-react"
import { apply, load } from "./store"
import { checkCrew } from "@/lib/api"

/**
 * The tuning panel only exists in dev, or in a build made with VITE_TUNE=1. Anywhere else this is a
 * compile-time false, so the panel code is left out of the bundle entirely.
 */
export const tuneEnabled = import.meta.env.DEV || import.meta.env.VITE_TUNE === "1"
const Panel = tuneEnabled ? lazy(() => import("./panel").then((m) => ({ default: m.TunePanel }))) : null

// Saved overrides apply on every page load (only where tuning is enabled), and follow changes made
// in another tab or in the lab's side panel (the lab previews the real site in frames).
if (tuneEnabled && typeof window !== "undefined") {
  apply(load())
  window.addEventListener("storage", (e) => {
    if (e.key !== "ng-tune") return
    apply(load())
    window.dispatchEvent(new Event("ng-tune"))
  })
}

/** "Adjust" button (used on /kit). */
export function TuneLauncher() {
  const [open, setOpen] = useState(false)
  if (!Panel) return null
  return (
    <>
      <button type="button" aria-pressed={open} onClick={() => setOpen(!open)} className="state inline-flex min-h-11 items-center gap-2 rounded-sm px-3 text-foreground">
        <SlidersHorizontal className="size-5" aria-hidden />Adjust
      </button>
      {open && createPortal(<Suspense><Panel onClose={() => setOpen(false)} /></Suspense>, document.body)}
    </>
  )
}

/**
 * On the site itself, for crew only (v3 S): once a crew link has been opened on this device (or ?c=<crew
 * token> on any page), a small Options button appears in the corner and opens the panel on its Options tab,
 * over the real page. ?tune=1 still opens it for this visit. Guests never have a crew token, so never see it.
 */
export function SiteTune() {
  const [crew, setCrew] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!tuneEnabled) return
    try {
      const q = new URLSearchParams(location.search)
      if (q.get("tune") === "1") sessionStorage.setItem("ng-tune-open", "1")
      if (q.get("tune") === "0") sessionStorage.removeItem("ng-tune-open")
      setOpen(sessionStorage.getItem("ng-tune-open") === "1")
      const given = q.get("c")
      if (given) void checkCrew(given).then((r) => { if (r === "yes") { try { localStorage.setItem("ng-crew", given) } catch { /* fine */ } setCrew(true) } })
      else if (localStorage.getItem("ng-crew")) setCrew(true)
    } catch { /* ignore */ }
  }, [])
  if (!Panel) return null
  const close = () => { setOpen(false); try { sessionStorage.removeItem("ng-tune-open") } catch { /* ignore */ } }
  return (
    <>
      {crew && !open && (
        <button type="button" onClick={() => setOpen(true)} aria-label="Options (crew only)" title="Options (crew only)" className="crew-options press">
          <SlidersHorizontal className="size-5" aria-hidden />
        </button>
      )}
      {open && createPortal(<Suspense><Panel onClose={close} startTab="options" /></Suspense>, document.body)}
    </>
  )
}
