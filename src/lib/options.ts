import { useEffect, useState } from "react"

/**
 * Prototype options from the options lab (/lab), read from <html data-opt-*>. Each one is a prop on
 * the real component, not a separate build. Absent = the shipped default.
 */
export function useOption(key: string) {
  const read = () => document.documentElement.getAttribute(`data-opt-${key}`)
  const [v, setV] = useState(read)
  useEffect(() => {
    const on = () => setV(read())
    window.addEventListener("ng-tune", on)
    return () => window.removeEventListener("ng-tune", on)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return v
}
