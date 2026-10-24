import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { ApiError, getHousehold, type Household } from "./api"
import { LINK_GONE } from "./call"

const KEY = "ng-invite"

/** This device's invite link token: from ?h= (remembered), or the one remembered from before */
export function readToken(): string {
  const fromUrl = new URLSearchParams(window.location.search).get("h")?.trim()
  if (fromUrl) {
    try { localStorage.setItem(KEY, fromUrl) } catch { /* private mode */ }
    return fromUrl
  }
  try { return localStorage.getItem(KEY) ?? "" } catch { return "" }
}

function forgetToken() {
  try { localStorage.removeItem(KEY); localStorage.removeItem(CACHE); localStorage.removeItem(CACHE_AT) } catch { /* private mode */ }
}

// The last copy of this household, kept on the guest's own device so return visits show at once. If the back end is
// down (19 Oct 2026), a copy from the last 24 hours still shows the invite; an older one waits for the back end.
const CACHE = "ng-household", CACHE_AT = "ng-household-at", DAY = 24 * 60 * 60 * 1000
function readCached(token: string): Household | null {
  try {
    const h = JSON.parse(localStorage.getItem(CACHE) ?? "null") as Household | null
    return h && h.token === token ? h : null
  } catch { return null }
}
const freshCache = () => { try { return Date.now() - Number(localStorage.getItem(CACHE_AT) ?? 0) < DAY } catch { return false } }
function writeCached(h: Household) {
  try { localStorage.setItem(CACHE, JSON.stringify(h)); localStorage.setItem(CACHE_AT, String(Date.now())) } catch { /* private mode */ }
}

type State = {
  household: Household | null
  // missing: no link at all · unknown: a link we don't recognise · error: couldn't reach the back end · trouble: the
  // back end answered with an error of its own
  status: "loading" | "ready" | "missing" | "unknown" | "error" | "paused" | "trouble"
  setHousehold: (h: Household) => void
  retry: () => void
}

const Ctx = createContext<State | null>(null)

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const [household, setHouseholdState] = useState<Household | null>(null)
  const [status, setStatus] = useState<State["status"]>("loading")

  const setHousehold = useCallback((h: Household) => {
    setHouseholdState(h)
    writeCached(h)
  }, [])

  // Show the saved copy straight away (if any), then refresh quietly in the background.
  const load = useCallback(() => {
    const token = readToken() || (import.meta.env.DEV ? "sample" : "")
    if (!token) return setStatus("missing")
    const cached = readCached(token)
    if (cached) {
      setHouseholdState(cached)
      setStatus("ready")
    } else {
      setStatus("loading")
    }
    getHousehold(token)
      .then((h) => {
        if (!h) {
          forgetToken()
          setHouseholdState(null)
          return setStatus("unknown")
        }
        setHousehold(h)
        setStatus("ready")
      })
      .catch((err) => {
        if (err instanceof ApiError && err.code === "not_found") return setStatus("unknown")
        // With a saved copy from the last day, stay on it (read only, as replies need the back end) and try again next visit
        if (!cached || !freshCache()) setStatus(!(err instanceof ApiError) ? "error" : err.code === "paused" ? "paused" : err.code === "server" ? "trouble" : "error")
      })
  }, [setHousehold])

  useEffect(load, [load])

  // The back end stopped knowing this link while the page was open (it was replaced): straight to the
  // "That link doesn't look right" page, which can email the current link
  useEffect(() => {
    const gone = () => {
      forgetToken()
      setHouseholdState(null)
      setStatus("unknown")
    }
    window.addEventListener(LINK_GONE, gone)
    return () => window.removeEventListener(LINK_GONE, gone)
  }, [])

  return <Ctx.Provider value={{ household, status, setHousehold, retry: load }}>{children}</Ctx.Provider>
}

export function useHousehold() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useHousehold must be used inside HouseholdProvider")
  return ctx
}
