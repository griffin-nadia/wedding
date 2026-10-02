import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"
import { ApiError, getHousehold, type Household } from "./api"

const KEY = "ng-invite"

function readToken(): string {
  const fromUrl = new URLSearchParams(window.location.search).get("h")?.trim()
  if (fromUrl) {
    try { localStorage.setItem(KEY, fromUrl) } catch { /* private mode */ }
    return fromUrl
  }
  try { return localStorage.getItem(KEY) ?? "" } catch { return "" }
}

function forgetToken() {
  try { localStorage.removeItem(KEY); localStorage.removeItem(CACHE) } catch { /* private mode */ }
}

// The last copy of this household, kept on the guest's own device so return visits show at once.
const CACHE = "ng-household"
function readCached(token: string): Household | null {
  try {
    const h = JSON.parse(localStorage.getItem(CACHE) ?? "null") as Household | null
    return h && h.token === token ? h : null
  } catch { return null }
}
function writeCached(h: Household) {
  try { localStorage.setItem(CACHE, JSON.stringify(h)) } catch { /* private mode */ }
}

type State = {
  household: Household | null
  // missing: no link at all · unknown: a link we don't recognise · error: couldn't reach the back end
  status: "loading" | "ready" | "missing" | "unknown" | "error"
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
        if (!cached) setStatus("error") // with a saved copy, stay on it and try again next visit
      })
  }, [setHousehold])

  useEffect(load, [load])

  return <Ctx.Provider value={{ household, status, setHousehold, retry: load }}>{children}</Ctx.Provider>
}

export function useHousehold() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useHousehold must be used inside HouseholdProvider")
  return ctx
}
