import { useEffect, useState } from "react"

/** A quiet toast for a result that needs no action: one at a time, 4 s. Above the dock on phones, top right on desktop. Never for an error. */
export function toast(message: string) {
  window.dispatchEvent(new CustomEvent("ng-toast", { detail: message }))
}

export function Toaster() {
  const [msg, setMsg] = useState("")
  useEffect(() => {
    let t = 0
    const on = (e: Event) => { setMsg((e as CustomEvent<string>).detail); clearTimeout(t); t = window.setTimeout(() => setMsg(""), 4000) }
    window.addEventListener("ng-toast", on)
    return () => { window.removeEventListener("ng-toast", on); clearTimeout(t) }
  }, [])
  return (
    <div role="status" aria-live="polite" className="toast-region">
      {msg && <p className="toast-in rounded-full bg-foreground px-6 py-3 font-label text-(length:--type-ui-size) text-background shadow-paper">{msg}</p>}
    </div>
  )
}
