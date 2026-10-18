# The lab

Local only: `npm run lab` (the index), never built into or deployed with the guest site. `npm run build:lab` builds it
into `dist/lab/` for its own tests. Built with no back end, so it only has the sample household.
The experiment contract is in [src/lab/playground/README.md](../src/lab/playground/README.md).

## Inventory (lab run 19)

Every experiment, page, thumbnail, script and dependency, with keep, archive or delete. "Archive" means gone from the
tree but findable in git history (the commit is in the run log).

### Experiments

| Item | Call | Why |
|---|---|---|
| opening-letter-out (A/B/C) | keep | Still deciding how the letter comes out of the envelope. |
| confirm-stamp (寿 / 京 / G·N) | keep | Griffin and Nadia still choose the mark. |
| micro-paper (presets and sliders) | keep | Jehan still chooses the paper settings; it has a test (e2e/lab-paper.spec.ts). |
| micro-paper-compare | keep | Paper's own PaperTexture beside the site's: still being checked. |
| story-stack (a stack you flick) | keep, parked | A parked idea, kept for later. |
| story-canvas (prints on a table) | keep, parked | Parked for shared guest photos after the day. |
| journey-globe (line-drawn globe) | delete | Decided and shipped: the painted globe is on Our story. The live page is the reference. |
| story-current (the spread) | delete | Decided and shipped, and broken: it framed lab-frame.html, which no longer exists. Compare with live replaces it. |
| story-styling (tape, corners, plain) | delete | Decided and shipped in #166: each print its own tape and edge, some with none. |
| confirm-fortune-unfold | delete | Decided and shipped (fortune-card.tsx). Only the fortunes' words are open, and that's content, not the lab. |

Rejected in Jehan's reviews and already gone before this run (nothing left to delete): sliding ink nav, chapters nav,
hanko press, petals, the other openings, older transitions, older home takes, chat RSVP.

### Pages, code, thumbnails, scripts, data

| Item | Call | Why |
|---|---|---|
| lab.html, src/lab/main.tsx (index and Gallery) | keep | The index. |
| lab-play.html, src/lab/play.tsx | keep | One experiment full screen (the phone link). |
| src/lab/playground/shell.tsx, motion.ts, stage.tsx, site-shell.tsx, registry.ts, types.ts | keep | The viewer, the clock, the rooms. |
| src/lab/playground/current.tsx | delete | Only story-current used it, and it framed a page that no longer exists. |
| src/lab/lab.css: the style switcher, layouts and docked rules | delete | Dead: nothing renders those classes since the /lab options page went. |
| thumbs: journey-globe, story-current, confirm-fortune-unfold | delete | Their experiments are gone. |
| thumbs: story-stack, story-canvas | keep | Still on cards. |
| src/lab/data/borders-110m.json (98 KB) | delete | Only the deleted line-drawn globe read it. The site's globe uses world-atlas land. |
| scripts/vendor-borders.mjs | delete | Only wrote that file. |
| scripts/lab-index.mjs, scripts/lab-thumbs.mjs | keep | The lab build's check, the card thumbnails. |
| micro/hatch-light.webp, hatch-lantern.webp | keep | micro-paper's crosshatch swatch. |

### Dependencies

| Package | Call | Why |
|---|---|---|
| ogl | delete | Nothing imports it (checked src and scripts, live site included). 708 KB in node_modules. |
| three, @types/three, topojson-client, world-atlas | keep | The live site's globe uses them. |
| @paper-design/shaders-react, @paper-design/shaders | keep | The live site's paper (paper-live.ts) and the paper experiments. |
| qrcode-generator | keep | The live site's QR codes (qr.tsx, qr-cards.mjs). |

### Size

| | Before | After |
|---|---|---|
| src/lab | 336 KB | 172 KB |
| dist/lab (npm run build:lab) | 8,180 KB | 7,244 KB |
| Lab JavaScript, raw | 1,552 KB | 648 KB |
| Lab JavaScript, gzip | 474 KB | 232 KB |
| node_modules (ogl) | 708 KB | 0 |

For the main run (not changed here, it's a live file): `src/index.css` lines 713 to 715 still style `.lab-frame` and
`.lab-desktop`, which only the lab used. Safe to delete.

## Ready to ship

Nothing yet.
