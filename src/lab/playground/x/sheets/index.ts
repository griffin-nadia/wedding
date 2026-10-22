import { lazy } from "react"
import type { Entry } from "../../types"

/** Sheets: the reply, Ask us and the done screen on laptops (run 21) */
export const entries: Entry[] = [
  {
    id: "sheet-dialog", title: "Laptop sheets: centred dialog or at the card's side",
    deciding: "Jehan: the centred dialog over a softly blurred page (shipped in run 21), or back to the side?",
    summary: "On laptops the reply, Ask us and the done screen open as a dialog the card's width, centred under the bar, with the page still there behind, dimmed and blurred. The side take is how it was: where the card is, the page hidden.",
    takes: [{ id: "centred", label: "Centred dialog" }, { id: "side", label: "Current side" }],
    live: { path: "/?rsvp=1" },
    refs: [{ label: "WAI-ARIA APG, dialog (modal)", href: "https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/" }],
    promote: "Centred ships (index.css, the sheet block). Going back to the side is the three rules in this experiment's css, under min-width 1024.",
    Component: lazy(() => import("./sheet-dialog")),
  },
]
