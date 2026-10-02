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
  try { localStorage.removeItem(KEY) } catch { /* private mode */ }
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
  const [household, setHousehold] = useState<Household | null>(null)
  const [status, setStatus] = useState<State["status"]>("loading")

  const load = useCallback(() => {
    const token = readToken() || (import.meta.env.DEV ? "sample" : "")
    if (!token) return setStatus("missing")
    setStatus("loading")
    getHousehold(token)
      .then((h) => {
        setHousehold(h)
        if (!h) forgetToken()
        setStatus(h ? "ready" : "unknown")
      })
      .catch((err) => setStatus(err instanceof ApiError && err.code === "not_found" ? "unknown" : "error"))
  }, [])

  useEffect(load, [load])

  return <Ctx.Provider value={{ household, status, setHousehold, retry: load }}>{children}</Ctx.Provider>
}

export function useHousehold() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useHousehold must be used inside HouseholdProvider")
  return ctx
}
