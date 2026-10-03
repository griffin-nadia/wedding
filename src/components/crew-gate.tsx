import { lazy, Suspense, useEffect, useState } from "react"
import { checkCrew } from "@/lib/api"

const KitPage = lazy(() => import("@/pages/kit").then((m) => ({ default: m.KitPage })))
const LabPage = lazy(() => import("@/pages/lab").then((m) => ({ default: m.LabPage })))

const KEY = "ng-crew"

/**
 * /kit and /lab open only from a crew link (?c=<token>, checked against the Crew tab). The token is then
 * kept on this device, so the plain address works afterwards. Until it checks out, a quiet note on paper
 * says what's missing (no link, a link that isn't right, or the check couldn't get through); the kit or
 * lab chunk is never requested. A device that was let in before stays in if the check can't get through.
 */
export function CrewGate({ page }: { page: "kit" | "lab" }) {
  const [state, setState] = useState<"checking" | "yes" | "none" | "no" | "error">("checking")
  const [tries, setTries] = useState(0)
  useEffect(() => {
    const given = new URLSearchParams(location.search).get("c") ?? ""
    let kept = ""
    try { kept = localStorage.getItem(KEY) ?? sessionStorage.getItem(KEY) ?? "" } catch { /* private window */ }
    const token = given || kept
    if (!token) { setState("none"); return }
    setState("checking")
    checkCrew(token).then((r) => {
      if (r === "yes") { try { localStorage.setItem(KEY, token) } catch { /* fine */ } }
      setState(r === "yes" || (r === "error" && kept && kept === token) ? "yes" : r === "error" ? "error" : given ? "no" : "none")
    })
  }, [tries])
  if (state === "yes") return <Suspense>{page === "kit" ? <KitPage /> : <LabPage />}</Suspense>
  return (
    <main aria-busy={state === "checking"} className="crew-blank grid place-items-center p-6">
      {state !== "checking" && (
        <div className="flex max-w-sm flex-col items-center gap-3 text-center">
          <p className="text-foreground">{state === "error" ? "Couldn't check your link just now." : state === "no" ? "That link isn't a crew link." : "This page opens from a crew link."}</p>
          <p className="text-sm text-muted-foreground">{state === "error" ? "Check your connection and try again." : "Use your link from the Crew tab in Site-Data. After that, this address works on its own."}</p>
          {state === "error" && <button type="button" className="btn-text min-h-11" onClick={() => setTries((n) => n + 1)}>Try again</button>}
        </div>
      )}
    </main>
  )
}
