import { lazy, Suspense, useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { SlidersHorizontal } from "lucide-react"
import { apply, load } from "./store"

/**
 * The tuning panel only exists in dev, or in a build made with VITE_TUNE=1. Anywhere else this is a
 * compile-time false, so the panel code is left out of the bundle entirely.
 */
export const tuneEnabled = import.meta.env.DEV || import.meta.env.VITE_TUNE === "1"
const Panel = tuneEnabled ? lazy(() => import("./panel").then((m) => ({ default: m.TunePanel }))) : null

// Saved overrides apply on every page load (only where tuning is enabled)
if (tuneEnabled && typeof window !== "undefined") apply(load())

/** "Adjust" button (used on /kit). */
export function TuneLauncher() {
  const [open, setOpen] = useState(false)
  if (!Panel) return null
  return (
    <>
      <button type="button" aria-pressed={open} onClick={() => setOpen(!open)} className="state inline-flex min-h-11 items-center gap-2 rounded-sm px-3 text-foreground">
        <SlidersHorizontal className="size-4" aria-hidden />Adjust
      </button>
      {open && createPortal(<Suspense><Panel onClose={() => setOpen(false)} /></Suspense>, document.body)}
    </>
  )
}

/** On the site itself: ?tune=1 opens the panel (and keeps it for this visit). */
export function SiteTune() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!tuneEnabled) return
    try {
      const q = new URLSearchParams(location.search).get("tune")
      if (q === "1") sessionStorage.setItem("ng-tune-open", "1")
      if (q === "0") sessionStorage.removeItem("ng-tune-open")
      setOpen(sessionStorage.getItem("ng-tune-open") === "1")
    } catch { /* ignore */ }
  }, [])
  if (!Panel || !open) return null
  return createPortal(<Suspense><Panel onClose={() => { setOpen(false); try { sessionStorage.removeItem("ng-tune-open") } catch { /* ignore */ } }} /></Suspense>, document.body)
}
