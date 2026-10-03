/** The flows the lab's options are grouped by (v3 P), in this order. */
export const FLOWS = ["Arrival", "Home", "RSVP", "The day", "Travel", "Our story", "Scene", "Theme"] as const
export type Option = { key: string; label: string; flow: (typeof FLOWS)[number]; note: string; values: [string, string][]; when?: (o: Record<string, string>) => boolean }

/**
 * Prototype switches to try with Nadia and Griffin. The first value is what ships. Grouped by the flow
 * they change; an option shows only when its flow makes it meaningful (`when`). Anything settled in
 * v3 section A is gone from here, not hidden.
 */
export const OPTIONS: Option[] = [
  { key: "peek", label: "Envelope peek on hover", flow: "Arrival", note: "Desktop only: the flap lifts and a corner of the letter shows on hover.", values: [["on", "On"], ["off", "Off"]], },
  { key: "mode", label: "Site mode (preview)", flow: "Home", note: "What the site becomes later: the invite now, the week of the wedding (The day first), or the keepsake after it. The Content tab sets it for real; this previews it.", values: [["sheet", "From the sheet"], ["invite", "Invite"], ["week-of", "Week of"], ["keepsake", "Keepsake"]] },
  { key: "datestyle", label: "Date", flow: "Home", note: "Under the names: the date and place as a sage badge, or as a second display line.", values: [["badge", "Badge"], ["line", "Display line"]] },
  { key: "names", label: "Names on desktop", flow: "Home", note: "From 1024: Nadia & Griffin on two lines at 88, or on one line at 56.", values: [["two", "Two lines"], ["one", "One line"]] },
  { key: "count", label: "Countdown", flow: "Home", note: "Boxes sit inside the letter (Home stays one card) and flip only when a number changes; seconds sit in a box like the rest. The strip and tiles sit under the card.", values: [["boxes", "Boxes: days to seconds"], ["boxes-nosecs", "Boxes, no seconds"], ["days", "Days only"], ["strip", "Strip under the card"], ["tiles", "Tiles under the card"]] },
  { key: "ticks", label: "What's left, once done", flow: "Home", note: "After everything's ticked: keep the three ticked rows (a returning guest sees it's done), or hide them.", values: [["stay", "Keep"], ["hide", "Hide"]] },
  { key: "signoff", label: "Sign-off", flow: "Home", note: "\u201cWith love, N & G\u201d on Home only, or at the end of every page.", values: [["home", "Home only"], ["all", "Every page"]] },
  { key: "toggle", label: "Evening mode switch (phones)", flow: "Home", note: "Phones: in the letter's top corner (no gap at the top), or fixed in the screen corner.", values: [["card", "In the letter"], ["corner", "Screen corner"]] },
  { key: "getthere", label: "Getting there, first action", flow: "Travel", note: "Travel's main button and The day's link: open Google Maps directions, or Show the driver first.", values: [["maps", "Google Maps"], ["driver", "Show the driver"]] },
  { key: "lang", label: "Language (draft)", flow: "Theme", note: "Preview the Japanese draft. Lines not translated yet stay in English; a native speaker checks it before guests can switch.", values: [["en", "English"], ["ja", "日本語"]] },
  { key: "accent", label: "Accent", flow: "Theme", note: "Green-forward (links, selected lines, text selection in forest and moss; rust stays for the button and the seal), or rust everywhere.", values: [["green", "Green"], ["rust", "Rust"]] },
  { key: "story", label: "Our story", flow: "Our story", note: "How the story reads on Our story: letter pages, a map of stops, a timeline, or a stack of cards you drag through.", values: [["b", "Map"], ["d", "Card stack"], ["a", "Letter pages"], ["c", "Timeline"]] },
  { key: "mapmode", label: "Map", flow: "Our story", note: "Map only: the journey from Brisbane and Canada to Kyoto (Figma D1), or stops along one path.", values: [["journey", "Journey to Kyoto (the Figma plan)"], ["trail", "Stops on a path"]], when: (o) => (o.story ?? "b") === "b" },
  { key: "flying", label: "Flying from", flow: "Our story", note: "Map only: an optional \u201cFlying from?\u201d on Travel, shown on the map as counts, never names.", values: [["off", "Off"], ["on", "On"]], when: (o) => (o.story ?? "b") === "b" },
  { key: "storysample", label: "Sample story", flow: "Our story", note: "Fills Our story with sample chapters until theirs is in the Content tab. Crew devices see it anyway; guests never do.", values: [["off", "Off"], ["on", "On"]] },
  { key: "scene", label: "Scene", flow: "Scene", note: "Behind the letter on every page: their photo (for now), the moving paper, Nadia's painted plates once they exist, or the December walk.", values: [["photo", "Their photo"], ["auto", "Paper"], ["plate", "Painted"], ["walk", "Walk (December)"]] },
  { key: "stamps", label: "Stamp book", flow: "Scene", note: "Walk scene only: a stamp for each page visited, in the top bar.", values: [["off", "Off"], ["on", "On"]], when: (o) => o.scene === "walk" },
  { key: "density", label: "Density", flow: "Theme", note: "Field heights and the letter's padding.", values: [["auto", "Theme"], ["compact", "Compact"], ["comfortable", "Comfortable"], ["roomy", "Roomy"]] },
  { key: "round", label: "Roundness", flow: "Theme", note: "Every control, the nav, sections and the letter together (8 / 16 / 24 scaled).", values: [["auto", "Theme"], ["sharp", "Sharp"], ["soft", "Soft"], ["round", "Round"]] },
  { key: "navigation", label: "Navigation", flow: "Theme", note: "Pages: swipe between letters on phones, the top bar on a laptop. Desk (preview, laptop): the other letters peek out from behind this one as paper tabs; click one to bring it forward.", values: [["pages", "Pages"], ["desk", "Desk (preview)"]] },
]

