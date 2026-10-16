import { useState } from "react"
import photos from "@/content/photos.json"
import { ART } from "@/lib/art"
import { useOption } from "@/lib/options"

/**
 * Everything on the site that isn't final yet, in one list. Crew see a small amber "Placeholder" tag on each
 * (Options → Placeholder tags); guests never do. A tag goes the moment its real file or content exists:
 * `done` is worked out from the file here, or passed in by the component for content that loads from the sheet.
 */
export const PLACEHOLDERS = {
  mapLand: { coming: "Nadia's painted land for the map, from Nadia", done: Boolean(ART.mapLand) },
  paper: { coming: "A scan of Nadia's own paper for the letter's texture, from Nadia", done: __PAPER_ART__ !== null },
  kidGriffin: { coming: "Griffin's kid photo for the Our story opener, from Griffin", done: "kid-griffin" in photos },
  storyCaptions: { coming: "A line for each story photo, from Griffin and Nadia (the planner's Photos + story tab)", done: false },
  fortunes: { coming: "Griffin's 12 fortune lines (these are travel tips until then), from Griffin", done: false },
  // Set done to true once a native speaker has read every line in ja.ts
  japanese: { coming: "A native speaker's read of the Japanese, from whoever Griffin and Nadia ask", done: false },
}
export type PlaceholderId = keyof typeof PLACEHOLDERS

const isCrew = () => { try { return Boolean(localStorage.getItem("ng-crew")) } catch { return false } }

/** Crew device (a crew link was opened here) with Options → Placeholder tags on. */
export function useShowPlaceholders() {
  const [crew] = useState(isCrew)
  const on = useOption("placeholders") !== "off"
  return crew && on
}
