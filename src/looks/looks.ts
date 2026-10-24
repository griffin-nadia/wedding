import type { Look } from "@/lab/playground/x/globes24/kit-view"

/**
 * The looks picker's list (run 27): every globe look from the lab, in four groups, each loaded only when picked (its
 * painter is its own small chunk). The picker is the one lab-derived page that ships (looks/qx26de88/index.html).
 */
export type Group = "Paper" | "Painted" | "Bold" | "Playful"
export type LookItem = { id: string; title: string; group: Group; line: string; load: () => Promise<{ look: Look }> }

export const GROUPS: Group[] = ["Paper", "Painted", "Bold", "Playful"]
export const DEFAULT_LOOK = "airmail"

export const LOOKS: LookItem[] = [
  { id: "airmail", group: "Paper", title: "Airmail", line: "An airmail envelope: thin blue paper for the sea, cream land, red and blue chevrons round the poles.", load: () => import("@/lab/playground/x/globes26/globe-airmail") },
  { id: "papercut", group: "Paper", title: "Paper cut-out", line: "Sheets of painted paper cut and stacked, each with a soft shadow on the one below.", load: () => import("@/lab/playground/x/globes24/globe-papercut") },
  { id: "antique", group: "Paper", title: "Antique globe", line: "Printed paper gores with their seams, sepia land, lettered oceans and a compass rose.", load: () => import("@/lab/playground/x/globes24/globe-antique") },
  { id: "origami", group: "Paper", title: "Origami", line: "Folded washi: the world in flat-lit facets, its creases printed on the sheet.", load: () => import("@/lab/playground/x/globes24/globe-origami") },
  { id: "folded", group: "Paper", title: "Folded road map", line: "A well-used road map: pastel countries, concertina folds and a coffee ring.", load: () => import("@/lab/playground/x/globes26/globe-folded") },
  { id: "chiyogami", group: "Paper", title: "Chiyogami collage", line: "Every country cut from a different patterned paper, with paper cranes.", load: () => import("@/lab/playground/x/globes26/globe-chiyogami") },
  { id: "watercolour", group: "Painted", title: "Watercolour (the site today)", line: "The site's own painted watercolour, see-through.", load: () => import("@/lab/playground/x/globes24/globe-watercolour") },
  { id: "nadia", group: "Painted", title: "Nadia's paint", line: "Nadia's own painting on the ball. Until she paints it, her venue map's colours stand in.", load: () => import("@/lab/playground/x/globes24/globe-nadia") },
  { id: "inkline", group: "Painted", title: "Ink line", line: "Soft brown pen outlines drawn twice, river blue off the coasts, on cream paper.", load: () => import("@/lab/playground/x/globes24/globe-inkline") },
  { id: "woodblock", group: "Painted", title: "Woodblock print", line: "Ukiyo-e: seigaiha waves and flat colour land printed a hair off its outline.", load: () => import("@/lab/playground/x/globes24/globe-woodblock") },
  { id: "sashiko", group: "Painted", title: "Sashiko", line: "Indigo cloth with the land in white running stitches and red thread lines.", load: () => import("@/lab/playground/x/globes24/globe-sashiko") },
  { id: "ink", group: "Bold", title: "Black and white", line: "Ink on paper: an engraved grey sea, bare paper land, black lines. Only your line has a colour.", load: () => import("@/lab/playground/x/globes27/globe-ink") },
  { id: "blueprint", group: "Bold", title: "Blueprint", line: "A Prussian blue sun print with hatched land and white drafting lines.", load: () => import("@/lab/playground/x/globes26/globe-blueprint") },
  { id: "kintsugi", group: "Bold", title: "Kintsugi", line: "Black lacquer mended with gold: vermilion land, gold coasts and cracks, one still highlight.", load: () => import("@/lab/playground/x/globes26/globe-kintsugi") },
  { id: "hanbok", group: "Bold", title: "Hanbok red", line: "Deep red silk with a gold-leaf print, ink black land and rainbow saekdong stripes.", load: () => import("@/lab/playground/x/globes27/globe-hanbok") },
  { id: "dotted", group: "Bold", title: "Dotted", line: "The land printed as halftone dots in navy ink (gold at night), shrinking towards the coasts.", load: () => import("@/lab/playground/x/globes24/globe-dotted") },
  { id: "arcade", group: "Playful", title: "Video game", line: "Big pixel sea, low-poly green land, chunky lines and a pixel plane.", load: () => import("@/lab/playground/x/globes27/globe-arcade") },
  { id: "glass", group: "Playful", title: "See-through", line: "A glass globe: frosted land, the far side showing through, glowing lines.", load: () => import("@/lab/playground/x/globes27/globe-glass") },
  { id: "snow", group: "Playful", title: "Snow globe", line: "A snowy world under a glass dome, with maple leaves drifting inside.", load: () => import("@/lab/playground/x/globes24/globe-snow") },
  { id: "riso", group: "Playful", title: "Risograph", line: "Two fluoro inks on a riso: a pink halftone printed off its blue coast.", load: () => import("@/lab/playground/x/globes26/globe-riso") },
  { id: "lantern", group: "Playful", title: "Lantern night", line: "Strings of glowing lanterns over a dusk sea by day and a deep night sea after dark.", load: () => import("@/lab/playground/x/globes24/globe-lantern") },
]

/** The note Jehan gets: "Globe pick: Airmail, land 100%, lines 100%, planes 100%, globe, day" */
export const pickMessage = (p: { title: string; land: number; lines: number; planes: number; view: "globe" | "map"; time: "day" | "night" }) =>
  `Globe pick: ${p.title}, land ${p.land}%, lines ${p.lines}%, planes ${p.planes}%, ${p.view}, ${p.time}`
