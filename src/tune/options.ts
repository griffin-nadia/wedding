/** The flows the lab's options are grouped by (v3 P), in this order. */
export const FLOWS = ["Arrival", "Home", "RSVP", "The day", "Travel", "Our story", "Scene", "Theme"] as const
export type Option = { key: string; label: string; flow: (typeof FLOWS)[number]; note: string; values: [string, string][]; when?: (o: Record<string, string>) => boolean }

/**
 * Prototype switches to try with Nadia and Griffin. The first value is what ships. Grouped by the flow
 * they change; an option shows only when its flow makes it meaningful (`when`). Anything settled in
 * v3 section A is gone from here, not hidden.
 */
export const OPTIONS: Option[] = [
  { key: "arrival", label: "Arrival", flow: "Arrival", note: "What opens on a first visit to Home: the envelope or a noren curtain.", values: [["envelope", "Envelope"], ["noren", "Noren curtain"]] },
  { key: "peek", label: "Envelope peek on hover", flow: "Arrival", note: "Desktop only: the flap lifts and a corner of the letter shows on hover.", values: [["on", "On"], ["off", "Off"]], when: (o) => (o.arrival ?? "envelope") === "envelope" },
  { key: "story", label: "Our story", flow: "Our story", note: "How the story reads on Our story: a letter in pages, a map of stops, or a timeline.", values: [["a", "A · The letter"], ["b", "B · Map"], ["c", "C · Timeline"]] },
  { key: "mapmode", label: "Map", flow: "Our story", note: "B only: stops along one path, or the journey from Brisbane and Canada to Kyoto.", values: [["trail", "Stops on a path"], ["journey", "Journey to Kyoto"]], when: (o) => o.story === "b" },
  { key: "flying", label: "Flying from", flow: "Our story", note: "B only: an optional \u201cFlying from?\u201d on Travel, shown on the map as counts, never names.", values: [["off", "Off"], ["on", "On"]], when: (o) => o.story === "b" },
  { key: "storysample", label: "Sample story", flow: "Our story", note: "Preview only: fills Our story with sample chapters until theirs is in the Content tab.", values: [["off", "Off"], ["on", "On"]] },
  { key: "scene", label: "Scene", flow: "Scene", note: "What sits behind the letter after the envelope opens. Photos stay off for launch.", values: [["auto", "Paper"], ["photo", "Photo"], ["plate", "Painted"], ["walk", "Walk (December)"]] },
  { key: "gl", label: "Paper light", flow: "Scene", note: "Paper scene: the moving light and mist (WebGL), or the still CSS paper.", values: [["on", "Moving"], ["off", "Still"]], when: (o) => (o.scene ?? "auto") === "auto" },
  { key: "stamps", label: "Stamp book", flow: "Scene", note: "Walk scene only: a stamp for each page visited, in the top bar.", values: [["off", "Off"], ["on", "On"]], when: (o) => o.scene === "walk" },
  { key: "texture", label: "Paper grain on the letter", flow: "Theme", note: "The 6% grain on the letter itself.", values: [["on", "On"], ["off", "Off"]] },
  { key: "preset", label: "Theme", flow: "Theme", note: "Whole-site look: the letter, a softer storybook, or crisp.", values: [["letter", "Letter"], ["storybook", "Storybook"], ["crisp", "Crisp"]] },
  { key: "density", label: "Density", flow: "Theme", note: "Field heights and the letter's padding.", values: [["auto", "Theme"], ["compact", "Compact"], ["comfortable", "Comfortable"], ["roomy", "Roomy"]] },
  { key: "round", label: "Roundness", flow: "Theme", note: "Every control, the nav, sections and the letter together (8 / 16 / 24 scaled).", values: [["auto", "Theme"], ["sharp", "Sharp"], ["soft", "Soft"], ["round", "Round"]] },
  { key: "nav", label: "Nav from 768", flow: "Theme", note: "Tablet and desktop: the thin top bar, or keep the dock at the bottom.", values: [["bar", "Top bar"], ["dock", "Dock"]] },
  { key: "navigation", label: "Navigation", flow: "Theme", note: "Pages: swipe between letters on phones. Desk comes after launch.", values: [["pages", "Pages"], ["desk", "Desk (after launch)"]] },
]

