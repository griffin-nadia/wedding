import { useEffect, useState } from "react"

/** A quiet toast: one line, bottom of the screen, 2.4 s, announced politely. Call toast("Copied"). */
export function toast(message: string) {
  window.dispatchEvent(new CustomEvent("ng-toast", { detail: message }))
}

export function Toaster() {
  const [msg, setMsg] = useState("")
  useEffect(() => {
    let t = 0
    const on = (e: Event) => { setMsg((e as CustomEvent<string>).detail); clearTimeout(t); t = window.setTimeout(() => setMsg(""), 2400) }
    window.addEventListener("ng-toast", on)
    return () => { window.removeEventListener("ng-toast", on); clearTimeout(t) }
  }, [])
  return (
    <div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[60] flex justify-center px-4 md:bottom-8">
      {msg && <p className="toast-in rounded-full bg-foreground px-5 py-3 text-sm text-background shadow-paper">{msg}</p>}
    </div>
  )
}
