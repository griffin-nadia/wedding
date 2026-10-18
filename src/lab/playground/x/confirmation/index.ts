import { lazy } from "react"
import type { Entry } from "../../types"

/** Confirmation: the moment after "Send our reply". */
export const entries: Entry[] = [
  {
    id: "confirm-stamp", title: "The seal: 寿, 京 or G·N",
    deciding: "Griffin and Nadia: 寿 (celebration, on the site), 京 (Kyoto) or their initials G·N?",
    summary: "The confirmation's hand-cut seal (uneven rim, patchy ink, a maple and a gum leaf in the rim) with each of three marks, and what each says.",
    refs: [{ label: "Kotobuki (寿)", href: "https://en.wikipedia.org/wiki/Kotobuki" }],
    promote: "寿 is on the site (components/hanko.tsx), in the confirmation head and on the fortune slip. Another mark is one prop.",
    takes: [{ id: "kotobuki", label: "寿 celebration" }, { id: "kyo", label: "京 Kyoto" }, { id: "gn", label: "G·N initials" }],
    live: { path: "/?rsvp=1" },
    Component: lazy(() => import("./confirm-stamp")),
  },
]
