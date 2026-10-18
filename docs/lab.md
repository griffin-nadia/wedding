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

For the main run to pick up. The lab never changes the live site. Numbers are from `scripts/lab-perf.mjs` (Pixel 7,
CPU 4x slower, 1.6 Mbps and 150 ms, the built bundles served gzipped), in `src/lab/perf.json`.

### 1. Faces clear of the envelope on phones (arrival-framing, take "zoom")

- **Why:** today, on their day photo, the sealed envelope covers their faces by 28 px on a 360 wide phone and by
  10 px on a 390 wide one (an iPhone 14). Zooming from the photo's bottom edge just enough, and moving the photo so
  the faces sit in the middle, clears them by 24 px at every size.
- **Files:** `src/index.css`, phones only, only while sealed. Replaces nothing in a component; it adds to the scene's
  phone rules (today the photo is `object-fit: cover`, centred).
- **The values** (the lab works them out per size; these bands cover 360 to 430 wide):

```css
@media (max-width: 767px) {
  [data-sealed] .scene-photo img { object-position: 71% 50%; transform-origin: 50% 100%; }
  [data-theme="lantern"] [data-sealed] .scene-photo img { object-position: 36% 50%; }
  @media (max-height: 800px) { [data-sealed] .scene-photo img { scale: 1.24; } }
  @media (min-height: 801px) and (max-height: 870px) { [data-sealed] .scene-photo img { scale: 1.16; } }
  @media (min-height: 871px) and (max-height: 920px) { [data-sealed] .scene-photo img { scale: 1.08; } }
  @media (min-height: 921px) { [data-sealed] .scene-photo img { scale: 1.06; } }
}
```

  (Day needs 1.200 / 1.121 / 1.046 / 1.029 at 360, 390, 412, 430; night 1.238 / 1.156 / 1.078 / 1.062; the bands
  take the larger. Check the selector: the sealed state is `data-sealed` on the shell in layout.tsx.)
- **Weight:** none (CSS). Opening still keeps the same photo frame, so the zoom has to ease back to 1 as it opens
  (one transition on `scale`), or stay for the arrival only.
- **Risk:** a little softness at 1.24 on the smallest phones (the 1200 wide photo is drawn about 700 px wide, so it
  holds). The night face box is wider than a phone, so night centres on the pair rather than fitting both edges.
- **Test:** in `arrival.spec.ts`, at 360, 390, 412 and 430 wide: the envelope's box and the face box (from
  scenes.json) don't overlap, by day and in Lantern.

### 2. Warm the globe stop while the guest reads Home (loading-preload, the background part)

- **Why:** on the throttled phone, the code for Our story's globe takes **2,383 ms** to arrive when the guest gets
  there; warmed in the background while Home is idle, **15 ms**. The time to the sealed envelope doesn't change
  (2,884 ms today, 2,690 ms with the warm and the art preload below) and a repeat visit is the same (220 to 238 ms):
  nothing is added when things are cached.
- **Files:** `src/components/layout.tsx` (or `src/main.tsx`): after the envelope is up (or the letter, on a return
  visit) and `requestIdleCallback` fires, `import("@/components/journey-globe")` and `import("@/lib/paint-globe")`
  (they pull three, the line modules and world-atlas land, 218 KB gzipped in all), then `import("@/lib/paper-live")`.
  The song only when `navigator.connection.effectiveType === "4g"` and not `saveData`. About 10 lines.
- **Replaces:** nothing; story-journey.tsx's lazy import then finds it already loaded.
- **Risk:** 218 KB on a metered phone for a stop some guests never open. Skip the warm when `saveData` is on.
- **Test:** a perf check (perf.spec.ts) that Home's own budget doesn't change (the warm happens after load), and a
  unit test of the connection rule.

### 3. The fortune unfolds in three, like a real omikuji (micro-motion, the fortune row)

- **Why:** it won in the final run (confirm-fortune-unfold) but the site still unfolds the slip with one scaleY. The
  three folds open toward you, top then bottom, each on its crease. 60 fps on the throttled phone, no long task.
- **Files:** `src/components/fortune-card.tsx` (the open slip) and `src/index.css` (.omikuji-slip's slip-unfold).
  The lab's version is in `src/lab/playground/x/micro/micro-motion.tsx` (Fortune): three panels showing the same slip
  at -0, -1/3 and -2/3 of its height, the outer two turning from ±180°.
- **Weight:** none (CSS transforms; the slip renders three times while it opens, once after).
- **Risk:** Safari's preserve-3d; check on an iPhone. The slip's height must be known (it's fixed at 420 px in the
  lab; on the site measure it once).
- **Test:** rsvp.spec.ts still finds the slip and its "Save" link; reduced motion keeps the fade.

### Also ready (smaller)

- **The globe's turn and the Kyoto label** (journey-globe-styles): coalesced pointer events, the flick's speed from
  the last 80 ms, about half a second to coast to rest, a soft spring at the top and bottom, arrow keys; and an HTML
  "Kyoto 京都" label pinned to the city that fades as it turns away. In `journey-globe.tsx`; no weight. The ink and
  gouache hands measure about the same as the site's globe (39 and 41 fps against 44, in software WebGL); the
  see-through watercolour is slower (34, it draws the sphere twice). Test: globe.spec.ts plus a drag.
- **Preload the arrival art** (loading-preload): `<link rel="preload" as="image" type="image/avif">` for the closed
  envelope (820) in index.html's first-paint script, next to the scene's: the envelope shows about 200 ms sooner
  (2,884 to 2,676 ms). Risk: the 410 or 820 choice must match the img's srcset for the phone's density.
- **The light sweep on a theme change** (paper-light), if Jehan wants it: nothing measurable (the theme change's own
  long task is 350 ms with or without it). One fixed element over #letter after the circle reveal, in
  lantern-toggle.tsx.
- **Dead lab CSS in the live file**: `src/index.css` lines 713 to 715 (`.lab-frame`, `.lab-desktop`).

### Found on the way (for the main run)

- **The theme change is a 350 ms long task** on the throttled phone (both with and without the sweep): the whole
  page re-renders when the mode flips. Worth a profile in the main run; it's the site's, not the lab's.

## Waiting on

- **Jehan** (the Shortlist has all of these side by side): the letter out (hinge, pull or quick); Seal it again
  (press, reverse or fade); the note (arrow first, words first or one line); the arrival framing (keep, zoom or lift);
  the loading screen (worth it, and which take, or only the background warm); the flat map's hand; the paper preset;
  the light sweep (yes or no); one curve or one spring for the small motions.
- **Griffin and Nadia**: the seal (寿, 京 or G·N); the globe's hand (watercolour, ink or gouache, or Nadia paints it);
  the story prints (scrapbook, polaroid or linen) and, for polaroids, a short caption per chapter; the logo (her
  lettering, one ink, or today's).
- **Nadia's art**:
  - the arrow for "Open your invite" (the lab's is a stand-in), as an SVG or a transparent PNG
  - the open envelope's flap as its own layer (docs/art.md), so the hinge turns her flap exactly rather than one cut
    from the closed drawing
  - her handwriting for the polaroid captions (a few words lettered per chapter, or enough letters for a font)
  - optional: the painted land for the globe (ART.globeLand)
