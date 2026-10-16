/** The flows the lab's options are grouped by (v3 P), in this order. */
export const FLOWS = ["Arrival", "Home", "RSVP", "The day", "Travel", "FAQs", "Our story", "Scene", "Theme"] as const
export type Option = { key: string; label: string; flow: (typeof FLOWS)[number]; note: string; values: [string, string][]; when?: (o: Record<string, string>) => boolean }

/**
 * Crew previews only. Everything that was an experiment was settled on 16 Oct: what guests saw that day is now
 * the site, and the switched-off versions and their code are gone. The first value is what ships.
 */
export const OPTIONS: Option[] = [
  { key: "mode", label: "Site mode (preview)", flow: "Home", note: "What the site becomes later: the invite now, the week of the wedding (The day first), or the keepsake after it. The Content tab sets it for real; this previews it.", values: [["sheet", "From the sheet"], ["invite", "Invite"], ["week-of", "Week of"], ["keepsake", "Keepsake"]] },
]

