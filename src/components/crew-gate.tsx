import { lazy, Suspense, useEffect, useState } from "react"
import { checkCrew } from "@/lib/api"

const KitPage = lazy(() => import("@/pages/kit").then((m) => ({ default: m.KitPage })))
const LabPage = lazy(() => import("@/pages/lab").then((m) => ({ default: m.LabPage })))

const KEY = "ng-crew"

/**
 * /kit and /lab open only from a crew link (?c=<token>, checked against the Crew tab). The token is kept
 * for this tab's session. Until it checks out the page is blank paper, and the kit or lab chunk is never requested.
 */
export function CrewGate({ page }: { page: "kit" | "lab" }) {
  const [ok, setOk] = useState<boolean | null>(null)
  useEffect(() => {
    const given = new URLSearchParams(location.search).get("c") ?? ""
    let kept = ""
    try { kept = sessionStorage.getItem(KEY) ?? "" } catch { /* private window */ }
    const token = given || kept
    checkCrew(token).then((yes) => {
      if (yes && token) { try { sessionStorage.setItem(KEY, token) } catch { /* fine */ } }
      setOk(yes)
    })
  }, [])
  if (!ok) return <main aria-busy={ok === null} className="crew-blank" />
  return <Suspense>{page === "kit" ? <KitPage /> : <LabPage />}</Suspense>
}
