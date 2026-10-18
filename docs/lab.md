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
| confirm-fortune-unfold | archive | The three-fold omikuji won, and the main run shipped it tonight (#177). Its timing lives on in micro-motion's fortune row. |

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

After section 3 (ten new experiments, 37 thumbnails): src/lab 776 KB (444 KB of it thumbnails), dist/lab 8,584 KB,
lab JavaScript 1,576 KB raw and 490 KB gzipped in all. Each experiment loads only its own code on demand: the most
is the globe's 222 KB gzipped (three.js and the land), the rest 2 to 27 KB.

For the main run (not changed here, it's a live file): `src/index.css` lines 712 to 714 still style `.lab-frame` and
`.lab-desktop`, which only the lab used. Safe to delete.

## Ready to ship

For the main run to pick up. The lab never changes the live site. Numbers are from `scripts/lab-perf.mjs` (Pixel 7,
CPU 4x slower, 1.6 Mbps and 150 ms, the built bundles served gzipped as Pages does, three runs each, the median),
measured against main as of #184, in `src/lab/perf.json`.

The main run shipped several of tonight's ideas itself while the lab worked (#176 the see-through globe with its
turn and Kyoto label, #177 the three-fold fortune, #178 the arrival's note, sealing and faces clear, #182 one easing
family). Those are not repeated here; the lab's experiments now compare against them (Compare with live, and the
Current side of micro-motion reads the site's own tokens).

### 1. Warm Our story's globe while the guest reads Home (loading-preload, the background part)

- **Why:** when a guest reaches the globe, its code takes **2,299 ms** to arrive on the throttled phone. Warmed in
  the background while Home sits idle, **15 ms**. Nothing else moves: the sealed envelope still shows at the same
  time (2,955 ms cold, 2,735 ms with the warm and the preload below), and a repeat visit is unchanged (245 to 248 ms).
- **Files:** `src/App.tsx` already warms the other pages on idle (`warm()`); add the globe's own two imports after
  them: `import("@/components/journey-globe")` and `import("@/lib/paint-globe")` (they bring three, the line modules
  and the world-atlas land: 218 KB gzipped). Skip them when `navigator.connection?.saveData` is on.
- **Replaces:** nothing. story-journey.tsx's lazy import then finds it loaded.
- **Risk:** 218 KB on a metered phone for a stop some guests never open (hence the Save-Data check). It only starts
  after `load` and idle, so the first paint can't be slowed.
- **Test:** perf.spec.ts's Home budget is unchanged (the warm is after load); a unit test that saveData skips it.

### 2. Preload the sealed envelope (loading-preload, the first part)

- **Why:** the closed envelope is the first thing a guest sees, and today it's only asked for once the app has
  rendered. Preloading it from the first-paint script brings it on screen about **215 ms** sooner (2,955 to 2,740 ms,
  7%), no change on a repeat visit.
- **Files:** `index.html`'s first-paint script, beside the scene photo's preload: one
  `<link rel="preload" as="image" type="image/avif" fetchpriority="high">` for `art/envelope/envelope-closed-820.avif`
  (phones draw it 240 px wide at 2x or 3x, so the 820) and, if wanted, the two names masks. Only on a first visit
  (the script already knows: `home && !seen`).
- **Risk:** the preload must be the same URL the img's srcset picks (820 AVIF on phones, 410 or 820 on laptops by
  density), or it's a wasted download. Chrome warns in the console if a preload goes unused within a few seconds.
- **Test:** perf.spec.ts: the envelope's image is requested before the main script finishes.

### 3. Keep the faces clear, as a test (arrival-framing)

- **Why:** the arrival-framing experiment measures the live site in place at 360, 390, 412 and 430 wide: since #178
  the envelope clears both faces by 170 to 250 px by day and 179 to 261 px at night. Before #178 the lab's model had
  it 28 px over their faces at 360 and 10 px over at 390. Nothing guards that now; a change to the envelope's size,
  the note or the photo box could bring it back.
- **Files:** `e2e/arrival.spec.ts`: at each width, in both themes, take the face box the way `src/lib/face.ts` does
  (`faceRect()`) and the `.arrival .envelope` box, and expect a gap. The lab's `faceIn()` in
  `src/lab/playground/x/arrival/arrival-framing.tsx` is the same sum, for reference.
- **Risk:** none to the site (a test only). Needs the sealed state (no `ng-opened`, motion allowed) for the box.
- **Test:** it is the test.

### Also ready (smaller)

- **The light sweep on a theme change** (paper-light), if Jehan wants it: it adds nothing measurable (the theme
  change's own long task is 361 ms with the sweep off and 360 with it on). One fixed element over #letter after the
  circle reveal, in lantern-toggle.tsx, a transform and opacity, removed when done.
- **Dead lab CSS in the live file:** `src/index.css` lines 712 to 714 (`.lab-frame`, `.lab-desktop`).

### Found on the way (for the main run)

- **The theme change is a long task of about 360 ms** on the throttled phone, with or without the sweep: the whole
  page re-renders when the mode flips. Worth a profile; it's the site's, not the lab's.
- **The globe in software WebGL** (headless Chromium, as in CI): the site's globe since #176 measures 39 fps while
  turning (44 before it). The lab's ink and gouache hands measure 43 and 44, the see-through watercolour 35, as it
  draws the sphere twice. A real phone's GPU does far better; only the comparison counts.

## Waiting on

- **Jehan** (the Shortlist has all of these side by side): the letter out (the site's #178 steps, or real paper:
  hinge, pull or quick); Seal it again (the site's, or the flap on its hinge); the note's order; confirm the arrival
  framing; the loading screen (worth showing, and which take, or only the background warm and the preload); the flat
  map's crop; the paper preset; the light sweep (yes or no); the small motions (keep #182's, a touch quicker, or one
  spring).
- **Griffin and Nadia:** the seal (寿, 京 or G·N); the globe's hand (keep the washes, ink or gouache, or Nadia paints
  it); the story prints (scrapbook, polaroid or linen) and, for polaroids, a short caption per chapter; the logo (her
  lettering, one ink, or today's).
- **Nadia's art:**
  - the note's words and arrow in her hand (the site's are stand-ins since #178: two open fonts as outlines, and a
    drawn arrow), as SVG or transparent PNG in public/art/note/
  - the open envelope's flap as its own layer (docs/art.md), so a hinge turns her flap exactly rather than one cut
    from the closed drawing
  - her handwriting for polaroid captions, if that take wins
  - optional: the painted land for the globe (ART.globeLand)
