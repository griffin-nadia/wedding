/** The flows the lab's options are grouped by (v3 P), in this order. */
export const FLOWS = ["Arrival", "Home", "RSVP", "The day", "Travel", "FAQs", "Our story", "Scene", "Theme"] as const
export type Option = { key: string; label: string; flow: (typeof FLOWS)[number]; note: string; values: [string, string][]; when?: (o: Record<string, string>) => boolean }

/**
 * Lab only (npm run lab). Everything that was an option was settled on 16 Oct and baked in on 17 Oct (Site mode
 * now always follows the sheet). New options go here, with the shipped value first.
 */
export const OPTIONS: Option[] = []
