import { useEffect, useState } from "react"
import { config } from "@/lib/config"

export type Chapter = { key: string; title: string; year: string; body: string[] }
export type SiteMode = "invite" | "week-of" | "keepsake"
export type SiteContent = { story: Chapter[]; mode: SiteMode; contactDay?: string }

// The lab's "Sample story" switch previews the three presentations before the real words exist
const SAMPLE: Chapter[] = [
  { key: "1", title: "Brisbane", year: "2019", body: ["Sample chapter. Where they met, in a sentence or two.", "A second short paragraph, in their words."] },
  { key: "2", title: "Canada", year: "2022", body: ["Sample chapter. The year away, in a sentence or two.", "A second short paragraph."] },
  { key: "3", title: "Kyoto", year: "2024", body: ["Sample chapter. The trip where it all started.", "A second short paragraph."] },
]

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
  // The sample story shows when the Options switch is on, and always on a crew device until the real words exist
  const crewDevice = (() => { try { return Boolean(localStorage.getItem("ng-crew")) } catch { return false } })()
  const sample = typeof document !== "undefined" && (document.documentElement.getAttribute("data-opt-storysample") === "on" || (crewDevice && document.documentElement.getAttribute("data-opt-storysample") !== "off"))
  const [c, setC] = useState<SiteContent | null>(cached)
  useEffect(() => { let live = true; void getContent().then((x) => { if (live) setC(x) }); return () => { live = false } }, [])
  const base = c ?? { story: [], mode: "invite" as SiteMode }
  // Crew preview (v3 S): the Options panel can show the week-of or keepsake site before the Content tab says so
  const preview = typeof document !== "undefined" ? document.documentElement.getAttribute("data-opt-mode") : null
  if (preview === "invite" || preview === "week-of" || preview === "keepsake") base.mode = preview
  return { ...base, story: sample && !base.story.length ? SAMPLE : base.story, ready: Boolean(c) || sample }
}
