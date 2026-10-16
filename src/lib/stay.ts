/**
 * Their stay picks (Travel → Where to stay). Live from the planner's Accommodation Options tab through the back end
 * (`?action=stay`), the list in en.ts when that call fails. Kept free of imports so tests run it under plain Node.
 */
export type Pick = { name?: string; area: string; price: string; note: string; href: string; sleeps?: string }
export type Picks = { note: string; hotels: Pick[]; airbnbs: Pick[] }

const TRACKING = /^(utm_|wiz_|gclid|gad_|gbraid|wbraid|fbclid|msclkid|srsltid|_gl=|mc_|s=|unique_share_id|review_page_entrypoint|source_impression_id|check_in|check_out|adults|children|infants|pets|guests|search_mode|previous_page_section_name|federated_search_id)/i

/** https only, without ad and search tracking. Anything else becomes "" and its row is dropped. */
export function cleanLink(u: string): string {
  if (!/^https:\/\//i.test(u)) return ""
  const [base, query = ""] = u.split("#")[0].split("?")
  const keep = query.split("&").filter((p) => p && !TRACKING.test(p))
  return base + (keep.length ? `?${keep.join("&")}` : "")
}

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "")

function rows(list: unknown): Pick[] {
  if (!Array.isArray(list)) return []
  return list.flatMap((r) => {
    const o = (r ?? {}) as Record<string, unknown>
    const href = cleanLink(text(o.href))
    return href ? [{ name: text(o.name), area: text(o.area), price: text(o.price), note: text(o.note), href, sleeps: text(o.sleeps) }] : []
  })
}

/** The live answer if it has any rows, otherwise the fallback. The note stays theirs either way. */
export function pickList(live: unknown, fallback: Picks): Picks {
  const d = (live ?? {}) as Record<string, unknown>
  const hotels = rows(d.hotels), airbnbs = rows(d.airbnbs)
  if (!d.ok || (!hotels.length && !airbnbs.length)) return fallback
  return { note: text(d.note) || fallback.note, hotels, airbnbs }
}

