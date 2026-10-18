# The lab

Local only: `npm run lab` opens the index; `npm run lab -- --host` also prints a QR code in the terminal for a phone
on the same wifi. Never built into or deployed with the guest site. `npm run build:lab` builds it into `dist/lab/` for
its own tests. Built with no back end, so it only has the sample household. The experiment contract is in
[src/lab/playground/README.md](../src/lab/playground/README.md).

## How to test

- **The index** groups everything as Deciding, Parked and Reference. Each card has a thumbnail, its Deciding (or
  Parked) line, its performance badge and "On a phone" (a QR for that experiment once the server runs with `--host`).
- **Every experiment** opens full screen on a phone, with two buttons on the right: Compare with live (swaps in the
  live page, in place) and Options (the take, its settings, theme, paper, speed, Replay, Copy settings, and a QR for
  this exact view). The address keeps everything (`?take=&k.<setting>=&theme=&speed=&live=1`), so a link opens the
  same view. Copy settings makes a note ready to paste into Claude Code.
- **The Shortlist** (a tab) shows every open decision with its takes side by side, a pick for each, and Copy our
  picks: for Griffin and Nadia to choose in one sitting on Sunday.
- **The badges** come from `node scripts/lab-perf.mjs` (after `npm run build && npm run build:lab`): each take on a
  throttled phone (Pixel 7, CPU 4x slower, 1.6 Mbps and 150 ms), fps over its own motion, long tasks over 50 ms, and
  the extra JavaScript it loads, gzipped. The worst take is on the badge; every take is in `src/lab/perf.json`.
- **Thumbnails**: `node scripts/lab-thumbs.mjs <port>` with the lab running.

## Inventory (lab run 19)

Every experiment, page, thumbnail, script and dependency, with keep, archive or delete. "Archive" means gone from the
tree but findable in git history (the commit is in the run log, docs/runs/2026-10-19-lab.md).

### Experiments

| Item | Call | Why |
|---|---|---|
| opening-letter-out | keep, rebuilt | Still deciding how the letter comes out; now with real paper (the flap on its hinge, the bend, the shadow) in three takes. |
| confirm-stamp (寿 / 京 / G·N) | keep | Griffin and Nadia still choose the mark; now one take per mark, so the Shortlist can show them. |
| micro-paper (presets and sliders) | keep, moved to Paper and light | Jehan still chooses the paper settings; it has a test (e2e/lab-paper.spec.ts). |
| micro-paper-compare | archive | Folded into paper-light (its Side by side take). |
| story-stack (a stack you flick) | keep, parked | A parked idea, kept for later. |
| story-canvas (prints on a table) | keep, parked | Parked for shared guest photos after the day. |
| journey-globe (line-drawn globe) | delete | Decided and shipped: the painted globe is on Our story. The live page is the reference. |
| story-current (the spread) | delete | Shipped, and broken: it framed lab-frame.html, which no longer exists. Compare with live replaces it. |
| story-styling (tape, corners, plain) | delete | Decided and shipped in #166: each print its own tape and edge, some with none. |
| confirm-fortune-unfold | archive | The three-fold omikuji won but never shipped (the site still unfolds with scaleY). Folded into micro-motion's fortune row and Ready to ship below. |

Rejected in Jehan's reviews and already gone before this run (nothing left to delete): sliding ink nav, chapters nav,
hanko press, petals, the other openings, older transitions, older home takes, chat RSVP.

New this run (section 3, 2 or 3 takes each): opening-seal-reverse, opening-note, arrival-framing, loading-preload,
journey-globe-styles, journey-flat-painted, story-prints, paper-light, micro-motion, logo-mark.

### Pages, code, thumbnails, scripts, data

| Item | Call | Why |
|---|---|---|
| lab.html, src/lab/main.tsx (index, Shortlist, Gallery) | keep | The index. |
| lab-play.html, src/lab/play.tsx | keep | One experiment full screen: the phone page, with its controls. |
| src/lab/playground/shell.tsx, motion.ts, stage.tsx, site-shell.tsx, registry.ts, types.ts | keep | The viewer, the clock, the rooms. |
| params.ts, controls.tsx, shortlist.tsx, perf.tsx (new) | keep | The view in the address, the Options sheet, the Shortlist, the badge. |
| src/lab/playground/current.tsx | delete | Only story-current used it, and it framed a page that no longer exists. |
| src/lab/lab.css: the style switcher, layouts, docked rules, the old phone sheet | delete | Dead: nothing renders those classes. |
| thumbs: journey-globe, story-current, confirm-fortune-unfold, micro-paper-compare | delete | Their experiments are gone. |
| src/lab/data/borders-110m.json (98 KB) | delete | Only the deleted line-drawn globe read it. The new ink globe draws world-atlas land, which the site already has. |
| scripts/vendor-borders.mjs | delete | Only wrote that file. |
| scripts/lab-index.mjs, scripts/lab-thumbs.mjs | keep | The lab build's check; the thumbnails (now per take, and the Reference cards). |
| scripts/lab-serve.mjs, scripts/lab-perf.mjs (new) | keep | `npm run lab` with the phone QR; the badges and the loading numbers. |
| micro/hatch-light.webp, hatch-lantern.webp | keep | micro-paper's crosshatch swatch. |

### Dependencies

| Package | Call | Why |
|---|---|---|
| ogl | delete | Nothing imports it (checked src and scripts, live site included). 708 KB in node_modules. |
| three, @types/three, topojson-client, world-atlas | keep | The live site's globe uses them (and the lab's globe takes). |
| @paper-design/shaders-react, @paper-design/shaders | keep | The live site's paper (paper-live.ts) and the paper experiments. |
| qrcode-generator | keep | The live site's QR codes, and now the lab's terminal QR. |

### Size (section 1)

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

READY_TO_SHIP

## Waiting on

WAITING_ON
