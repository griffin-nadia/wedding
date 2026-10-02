import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { getHousehold, type Household } from "./api"

const KEY = "ng-invite"

function readToken(): string {
  const fromUrl = new URLSearchParams(window.location.search).get("h")
  if (fromUrl) {
    try { localStorage.setItem(KEY, fromUrl) } catch { /* private mode */ }
    return fromUrl
  }
  try { return localStorage.getItem(KEY) ?? "" } catch { return "" }
}

type State = {
  household: Household | null
  status: "loading" | "ready" | "missing" | "error"
  setHousehold: (h: Household) => void
}

const Ctx = createContext<State | null>(null)

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const [household, setHousehold] = useState<Household | null>(null)
  const [status, setStatus] = useState<State["status"]>("loading")

  useEffect(() => {
    const token = readToken() || (import.meta.env.DEV ? "sample" : "")
    if (!token) return setStatus("missing")
    getHousehold(token)
      .then((h) => { setHousehold(h); setStatus(h ? "ready" : "missing") })
      .catch(() => setStatus("error"))
  }, [])

  return <Ctx.Provider value={{ household, status, setHousehold }}>{children}</Ctx.Provider>
}

export function useHousehold() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useHousehold must be used inside HouseholdProvider")
  return ctx
}
