import { useEffect, useState } from "react"
import { config } from "@/lib/config"

export type Chapter = { key: string; title: string; year: string; body: string[] }
export type SiteMode = "invite" | "week-of" | "keepsake"
export type SiteContent = { story: Chapter[]; mode: SiteMode; contactDay?: string }

// No sample chapters (Jehan, 6 Oct): Our story shows only what Nadia and Griffin put in the Content tab, nothing invented.

const KEY = "ng-content"
let cached: SiteContent | null = (() => { try { return JSON.parse(sessionStorage.getItem(KEY) || "null") } catch { return null } })()

/** Story chapters, the site mode and who to contact on the day, from the Content tab (story_1_title…, mode, contact_day). */
export async function getContent(): Promise<SiteContent> {
  if (cached) return cached
  const empty: SiteContent = { story: [], mode: "invite" }
  if (!config.apiUrl) return empty
  try {
    const res = await fetch(`${config.apiUrl}?action=content`)
    const d = await res.json()
    if (!d.ok) return empty
    cached = { story: Array.isArray(d.story) ? d.story : [], mode: ["invite", "week-of", "keepsake"].includes(d.mode) ? d.mode : "invite", contactDay: typeof d.contactDay === "string" ? d.contactDay : undefined }
    try { sessionStorage.setItem(KEY, JSON.stringify(cached)) } catch { /* ignore */ }
    return cached
  } catch { return empty }
}

export function useContent(): SiteContent & { ready: boolean } {
  const [c, setC] = useState<SiteContent | null>(cached)
  useEffect(() => { let live = true; void getContent().then((x) => { if (live) setC(x) }); return () => { live = false } }, [])
  const base = c ?? { story: [], mode: "invite" as SiteMode }
  // Crew preview (v3 S): the Options panel can show the week-of or keepsake site before the Content tab says so
  const preview = typeof document !== "undefined" ? document.documentElement.getAttribute("data-opt-mode") : null
  if (preview === "invite" || preview === "week-of" || preview === "keepsake") base.mode = preview
  return { ...base, ready: Boolean(c) }
}
