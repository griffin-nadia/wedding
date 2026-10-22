import { lazy } from "react"
import type { Entry } from "../../types"
import { BEHIND, GRIFFIN, NADIA } from "./kids"

const MAPLE = "Her maple leaf isn't available yet (private/nadia-art-17oct/maple-leaf.png hasn't been saved from her email), so it's left out; the gum leaves stand alone until it lands."
/** Run 24 sections 7 and 8: the kid opener's picker, and Nadia's art in places it isn't yet (nothing live) */
export const entries: Entry[] = [
  {
    id: "kid-picker",
    title: "The kid opener: pick the prints",
    deciding: "Griffin and Nadia: which two prints at the front of the kid opener, and which one (if any) tucked behind his?",
    summary: "Our story's first stop with every kid photo to choose from: a front pair, tilted towards each other with tape across the overlap, and an optional third print half behind his. Pick under the story or in Options, then Copy settings.",
    refs: [{ label: "Our story", href: "../our-story" }],
    promote: "Ready to ship: in our-story.tsx the Opener becomes this cluster (three absolutely placed print frames in a 5:4 box, CSS only, about 2 KB) and photos.json gains the chosen prints exported per PHOTO-PLAN (crop to the face at 4:5, 400 and 800 wide AVIF and WebP, about 25 KB each at 400 on a phone, 75 KB at 800), with their alt text in en.ts and ja.ts. The opener grows into the words' room, so no empty band under it. Risks: the scans of Nadia's (nadia-young-*) are A4 pages with the print in the middle, so they need cropping before export (the lab crops them live); the turned ones (wicker chair, garden) need rotating; the house number in kid-griffin stays softened. Left out: the copies with a date burned in (a no-date version exists), the rougher second scan of Home, and the transparent _NBG copies.",
    knobs: [
      { id: "griffin", label: "Griffin, in front", kind: "select", options: GRIFFIN.map((p) => [p.id, p.label]), def: "portrait" },
      { id: "nadia", label: "Nadia, in front", kind: "select", options: NADIA.map((p) => [p.id, p.label]), def: "home" },
      { id: "behind", label: "Behind his (optional)", kind: "select", options: BEHIND, def: "g-first-day" },
    ],
    live: { path: "/our-story" },
    Component: lazy(() => import("./kid-picker")),
  },
  {
    id: "art-seal",
    title: "Nadia's wax seal: prints, done screen, favicon",
    deciding: "Jehan: the wax seal pressed on some polaroids, on the done screen instead of the 寿 hanko, and as the favicon?",
    summary: "Her painted G·N wax seal three more places: pressed on the corner of some story prints, landing on the RSVP done screen, and in a browser tab (this tab wears it while the take is open).",
    takes: [{ id: "polaroid", label: "On the polaroids" }, { id: "done", label: "On the done screen" }, { id: "favicon", label: "Favicon test" }],
    refs: [{ label: "Wax seal (public/art/seal)", href: "../art/seal/wax-seal-256.webp" }, { label: "RSVP done screen", href: "../?rsvp=1" }],
    promote: "Ready to ship, each on its own. Polaroids: an <img> of ART.seal (the 128 px WebP, 4 KB, already cached from the envelope) on some prints in our-story.tsx, CSS placed; risk: two red marks per screen beside the tape. Done screen: swap <Hanko stamp /> for the seal in rsvp-sheet.tsx Done (one line plus the press keyframes, transform and opacity); risk: 寿 says celebration in Japanese, the wax seal says G·N, and the fortune slip keeps the 寿, so the two would differ. Favicon: export a 32 px and 180 px PNG from wax-seal-256 (scripts/art-export.mjs), point index.html and site.webmanifest at them; risk: at 16 px the letters are lost, so keep the flat seal.svg for 16 px and use the wax one for 32 px and the home screen.",
    live: { path: "/?rsvp=1" },
    Component: lazy(() => import("./art-seal")),
  },
  {
    id: "art-leaves",
    title: "Nadia's gum leaves: stickers, fortune slip, done screen",
    deciding: "Jehan: gum leaves as stickers on the prints, tucked on the fortune slip, or beside the seal on the done screen?",
    summary: "Her painted gum leaves as die-cut stickers on the story prints, a sprig tucked over the fortune slip's corner, and one beside the 寿 seal on the done screen. The maple leaf isn't available yet.",
    takes: [{ id: "stickers", label: "Scrapbook stickers" }, { id: "fortune", label: "Fortune slip corner" }, { id: "done", label: "Done screen" }],
    refs: [{ label: "Gum leaves (public/art/leaves)", href: "../art/leaves/gum-leaves-320.webp" }],
    parked: MAPLE,
    promote: `Ready to ship: ART.leaves is already in public/art (160 and 320 px, 5 and 12 KB). Stickers: an <img> per chosen print in our-story.tsx with a CSS drop-shadow edge (static, no animation cost). Fortune: one absolutely placed <img> in fortune-card.tsx's slip, also drawn in the fold copies so it doesn't pop in after the fold. Done: one <img> in rsvp-sheet.tsx Done beside the Hanko. Risks: three red-and-green accents on the done screen once the fortune is open (pick one place), and the leaves read as Australia alone until the maple joins them. ${MAPLE}`,
    live: { path: "/?rsvp=1" },
    Component: lazy(() => import("./art-leaves")),
  },
  {
    id: "art-garden",
    title: "Nadia's garden drawing on The day",
    deciding: "Jehan, then Nadia: her garden ink drawing on The day's ceremony row, as a small print or as ink on the page?",
    summary: "Her ink drawing of the ceremony garden (benches, the arch, the pagoda) on The day's 11:00 Ceremony, The Garden row: a small tilted print under it, or the drawing straight on the card behind the row.",
    takes: [{ id: "print", label: "A print in the row" }, { id: "ink", label: "Ink on the page" }],
    refs: [{ label: "The day", href: "../the-day" }],
    promote: "Ready to ship: export photos-private/art/web/garden-ink.webp through scripts/art-export.mjs to public/art/garden/ (400 and 800 wide, about 30 KB at 400 on a phone (the 960 px web copy is 82 KB), lazy, below the fold on phones), add it to ART, and render it in day.tsx's first Row. Print is a plain image in a paper frame; ink needs mix-blend-mode (multiply by day; inverted and screened under the Lantern), which is static, so no frame cost. Risks: it's Nadia's private scan, so it needs her OK to go public; the ink take crowds the row on a 390 phone. Not used yet, from her 6 Oct scans (photos-private/art/nadia-scans-2026-10-06.pdf, 3 pages): (1) page 1, this garden ink drawing: until now on neither the site nor the lab; besides The day it could head the Travel page's \"Around the venue\" section or be the printed day card's illustration. (2) Page 2, her black ink open envelope with the red G·N seal (photos-private/art/web/drawn-open.webp): the site uses her later painted envelope, so this one could be the RSVP done screen's \"We've emailed you a copy\" picture or the no-invite page's envelope. (3) Page 3, her black ink closed envelope with a painted maple leaf, gum leaf and the G·N seal (drawn-closed.webp): it could head the invite email, and its maple leaf could be cut out as a stand-in until the maple leaf file arrives.",
    live: { path: "/the-day" },
    Component: lazy(() => import("./art-garden")),
  },
  {
    id: "art-names",
    title: "Nadia's names lettering: link preview and email header",
    deciding: "Jehan: a lettering-only link preview (today's has her lettering beside the painted envelope), and her lettering as the invite email's header?",
    summary: "Her lettering of the names, alone and large with the date line, as the link preview (1200 × 630, in a message bubble; today's og-image.png, which already pairs her lettering with the painted envelope, under it) and as the header of the invite email, the rest of the email the back end's real HTML.",
    takes: [{ id: "og", label: "Link preview (og)" }, { id: "email", label: "Email header" }],
    refs: [{ label: "Open Graph", href: "https://ogp.me/" }, { label: "apps-script/Code.gs buildEmail_", href: "https://github.com/griffin-nadia/wedding/blob/main/apps-script/Code.gs" }],
    promote: "Ready to ship. Link preview: render this card once to public/og-image.png (1200 × 630 PNG, under 300 KB; a small Playwright script, like the lab thumbnails) and keep index.html's og:image and its alt; no weight on the site itself. Risk: chat apps cache the old image for days. Email header: the lettering can't be a CSS mask in mail, so export a flat PNG (the names in #421a05 and the & in the sage, on transparent, 520 and 1040 wide, about 25 KB), host it in public/art/names/, and add an optional header image to buildEmail_ (an <img> with alt \"Griffin & Nadia\", width 360) before the h1. Risks: some mail apps block images until asked (the alt and the heading still read), and images push emails a little towards spam, so the text stays first. Needs a back end deploy (scripts/deploy-apps-script.sh).",
    live: { path: "/" },
    Component: lazy(() => import("./art-names")),
  },
]
