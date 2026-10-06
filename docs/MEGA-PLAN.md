# Mega plan — pocket invitation, 5–15 Oct 2026

Distilled from Jehan's working notes. One page that answers: what's decided, what N&G owe us, what we build next, and the exact prompt to hand the next build session.

---

## 1. North star

Every guest gets a personal invitation that knows who they are, what they're invited to, and what they need to know about a wedding in Japan. They reply for the household in two minutes and come back to it on the day.

- **Three jobs:** reply → prepare (travel, etiquette) → on the day (events, maps, table)
- **Nav:** Home · The day · Travel · FAQs (+ Our story once its three chapters exist). No login, no hamburger, personal link or short code only
- **Guardrails:** one chosen interaction moment per screen, everything else quiet. Kit states stay canonical (default, hover, focus, pressed, selected, disabled, error, loading). CSS/SVG first, Motion only where spring physics materially improve feel. 60fps on a mid-range phone, transform-only where possible. Reduced motion gets a complete still state, never a broken one. No scroll hijacking, no three.js, no smooth-scroll library. Japanese and Lantern switches are first-class site controls.

## 2. Right now (6 Oct, evening)

**Live on main:** everything through #24: review fixes, QA pass (sage nav pill, `npm test`), sharper phone photos. #4 is superseded (already on main); close it.

**Not live yet:** #25 (fortune on springs) and #26 (journey map) were merged into their stack branches, not main. **#29** brings both to main (still off behind Options). Lesson: after merging a stacked PR, retarget the next one to main (or delete the merged branch) before merging it.

**Small:** #31 removes the filled circle behind the sun button in Lantern (it looked like a stuck hover).

**Open:** #27 Nadia's drawings (envelope + garden, behind Options). Claude Code is finishing it locally: art files from `nadia-art-images`, AVIF + WebP at 1x/2x, a format-agnostic garden slot (`ART.garden.kind` ink or colour).

**QA (#24) result:** 240 screenshots across 6 widths × 2 modes × 2 languages × motion on/off. Everything passed after its fixes. Left open:
- Replied Home on a 390×844 phone: with the journey card on, the countdown drops below the fold. Decide whether that's fine or the card should sit lower.
- New Japanese needs a native read: `fortune.onMap`, `journey.*`, `rsvp.step`, `day.gardenAlt`.
- The "everyone's lines" on the map only show against the live sheet (sample mode has no back end), so check them on the live site once switched on.

**Switch-on decisions (Jehan):** Fortune → Springs, Journey map → On, Nadia's envelope drawing, Garden drawing. Try each on the live site first.

**Waiting on Jehan:** push `nadia-art-images`; paste `apps-script/Code.gs` into the Site-Data script and deploy ("Already in Japan"); re-export the day PSD at 3840 × 2160.

**Waiting on N&G:** name order (her seal reads "G·N", the site says Nadia & Griffin); Griffin's 12 fortune lines (travel tips show until then); Nadia's 600 dpi rescan, plus the seal and leaves on their own; three story chapters; Noya.

- Do not reopen the loupe, postcard flip, shared branch, stamp book, keepsake, or colour transition unless Nadia explicitly says they were scope cuts, not taste cuts.

## 3. What N&G owe us (Mon 5 – Wed 7 Oct)

| Who | What | Blocks |
| --- | --- | --- |
| Both | Pick a style direction | All remaining visual work |
| Both | Name order for the letterhead | Nadia's lettering |
| Both | Confirm households + Selina's plus-one | Guest list sync (14 Oct) |
| Both | Three story chapters into Content | Our story; else fortune ends on "Save to my phone" |
| Both | Ask Noya re "who to call on the day" | That card on The day + FAQs |
| Griffin | 12 fortune lines + welcome + "all set" line | Fortune reveal (fallback: 12 travel tips) |
| Nadia | Envelope painting + hand-lettered names | Final envelope + letterhead (fallbacks ship fine) |
| Nadia | Confirm dietary pick list (veg / no beef / halal / Jain) and which cultural nods to include | RSVP options |

## 4. Art from Nadia (what, how, why)

Traditional (ink and watercolour, scanned) is the default: it matches the site's paper and is already working. Digital only where layers or exact alignment matter, and only if she prefers it. No need to do both versions of anything.

| # | Piece | Have | Need | How | Used for |
| --- | --- | --- | --- | --- | --- |
| 1 | Closed envelope (maple, gum leaf, seal) | 200 dpi scan | 600 dpi rescan | scan, PNG | Arrival envelope (#27) |
| 2 | Open envelope (flap up) | 200 dpi scan | 600 dpi rescan | scan, PNG | Envelope opening (#27) |
| 3 | Garden line drawing | 200 dpi scan | 600 dpi rescan; coloured version later (optional) | scan, PNG | The day header (#27) |
| 4 | Wax seal, maple leaf, gum leaf on their own | – | optional | scan each on plain paper | Seal pressing in, leaves lifting on the flap |
| 5 | **Journey map land** (Australia, Japan, corner of Canada) | – | yes, the main new piece | watercolour washes on the printed template (`photos-private/art/templates/journey-map-template-A4.pdf`), land only: no lines, dots, names or labels; keep the corner marks; Kyoto should sit on her Japan. Digital is fine too: paint on the PNG template, export the land layer as a transparent PNG at 4000 × 3200 | The hand-painted land under every guest map (Figma "Journey map · hi-fi concept": "Nadia paints the land; the code draws dotted lines on top") |
| 6 | Name lettering | – | after the name order is settled | black ink on white, 600 dpi, or SVG | Names on the letter |
| 7 | Blank sheet of her paper | – | optional | 600 dpi scan of an unpainted sheet | Real paper texture for the letter and envelope |

Scanning: 600 dpi, colour, PNG or TIFF (not PDF or JPEG), lid closed, one piece per scan, nothing else on the glass. Jehan doesn't need to Photoshop anything: the cut-outs, transparency, ink layers and sizes are done in code from the scans. Only touch up dust or stray marks if they're obvious.

Photos (not Nadia's art): story chapter photos from N&G; everything else stays on the current photos.

## 5. Build queue

### PR 1 · Fortune reveal (omikuji)
Already built in #15 (SVG tin, shake on Android, numbered slip, save): this PR is springs and polish on top, not a rebuild.
- Tap-first; shake is progressive enhancement only.
- Spring-driven: tin shakes → stick rises → paper slip unfolds.
- One 大吉 slip per reply, numbered (e.g. No. 7 of 12), with 大吉 / GREAT BLESSING, Griffin's line, and "Save to my phone".
- Next action after the fortune: "See your line on the map".
- Reduced motion: static opened slip.

### PR 2 · Journey map
The journey map, the flying-from step and "Already in Japan" exist (#15, story-journey.tsx): extend them, don't start over.
- RSVP step 3 becomes "Your journey": optional "Where are you flying from?" with a small map under the choices and the guest's gold line drawing as they pick. Travel dates stay optional / add later.
- One shared map element across Our story, the reply mini-map and the post-reply map — it should feel like the same element travelling with the guest.
- Dotted world map + drawn guest arcs; lines draw in, reduced motion fades or shows the completed state.
- After reply, the guest's line draws in last over everyone else's faint lines. Home gets a small "Your line's on the map" card.
- **Aggregate origins only** — counts and lines, never names or precise locations. Include "Change where I'm flying from".
- Our story stays hidden until all three chapters exist in Content.

### PR 3 · Desktop-only polish (pointer-fine only, stills under reduced motion)
No cursor trails (ruled out by the site's ethos).
- Face-safe edge soft-focus around the letter
- Optional dock magnification

### Later / blocked
- Names letterhead draw-on — after name-order answer + Nadia's scan
- Envelope artwork final (closed → peek → open) — after Nadia's painting
- "Who to call on the day" — after Noya says yes
- Timeline progress seal — small follow-up
- Kyoto hover prints — when final photos arrive
- Return visits skip the envelope

## 6. Research backlog

1. Finish the audit evidence — desk review is done, screenshots were never captured.
2. The six-gap research pass (see the prompt in Working notes → "Next research prompt"): Japan destination-wedding sites, bilingual EN/JA RSVP flows, household + nijikai RSVP patterns, firsthand guest complaints, "find your table" seating patterns, restrained ryokan/tea/craft sites for mood.

## 7. Timeline to launch

| Date | What |
| --- | --- |
| Mon 5 – Wed 7 Oct | N&G answers + content (section 3) |
| Thu 8 – Sat 10 Oct | Scan/photograph art; fortunes, story, who-to-call into Content |
| Sun 11 Oct | Drop art in; check every screen, both modes, phone + laptop |
| Mon 12 – Tue 13 Oct | Test with an older relative, someone on a phone, someone overseas |
| Wed 14 Oct | Sync guest list, make every link, delete test rows, final read-through |
| **Thu 15 Oct** | **Send invites** |

**Fallback rule:** painting, lettering, fortunes, story and Noya each have a live fallback, so none of them block the 15th.

## 8. Stress-test matrix (run for every PR)

- Routes: Home, The day, Travel, FAQs, Our story on/off
- Widths: 390, 768, 1024, 1280, 1440, 1920
- Languages: English, Japanese, saved Japanese reload, missing-string fallback
- Modes: Autumn, Lantern, system preference, saved choice
- Input: mouse, touch, keyboard, no-hover, fine pointer
- Motion: normal + reduced motion
- States: default, hover, focus, pressed, selected, disabled, error, loading
- Images: currentSrc, natural vs rendered size, DPR 1/2, AVIF/WebP selection, no 404s, faces sharp
- Regression: sealed envelope, RSVP state, page transitions, scene band, mobile dock, desktop top bar

---

## 9. The prompt (hand this to the next build session)

```text
You're picking up the wedding site for Nadia and Griffin (Fri 15 Oct 2027, The Sodoh Higashiyama, Kyoto). Repo: github.com/griffin-nadia/wedding (PUBLIC), live at griffin-nadia.github.io/wedding. Local copy: ~/_Workspace/Personal/nadia-griffin-wedding. Vite, React 19, TypeScript, Tailwind v4, Motion (lazy), GitHub Pages; Apps Script back end in apps-script/. Invites go out Thu 15 Oct 2026. Read docs/MEGA-PLAN.md (§2 is the current state), README.md and docs/system.md first.

## Rules
- Branch per change, open a PR, never merge. I merge.
- No AI attribution anywhere: no Co-Authored-By, no "Generated with", no tool names in commits, PRs, code, comments or committed files (no CLAUDE.md or AGENTS.md in the repo; private notes go in .brief/, which is gitignored). Don't publish artifacts or share links.
- Commit messages are plain sentences like the rest of the history, no feat:/fix: prefixes.
- Australian English, sentence case. Guests never see back-end words. Don't invent content; placeholders stay clearly marked.
- Nothing private in the repo: no guest data, tokens, .env, .brief/, photos-private/. Test mode only, never send real invites.
- New looks go behind an Option (src/tune/options.ts + OPTION_DEFAULTS in src/tune/store.ts); the first listed value and the stored default must match (npm test checks this).
- Every motion has a still version under prefers-reduced-motion. Desktop-only effects gated to (hover: hover) and (pointer: fine). No cursor trails, smooth-scroll libraries or three.js. Faces stay sharp.
- Before every PR: npm run build, npm run lint (no new errors), npm test, then look at it in a browser at 390, 768, 1024, 1280, 1440 and 1920, in Autumn and Lantern, English and Japanese, reduced motion on and off.

## Step 1: Finish #27 (if not already)
Nadia's drawings: art files from nadia-art-images, AVIF + WebP at 1x/2x, the format-agnostic garden slot. Check the envelope (same size and spot as the paper one, opens to her open envelope with the letter rising, no jump) and the garden (dark ink by day, cream in Lantern, phones cropped to the pagoda and aisle). Report and stop for my review.

## Step 2: Mode switch grows from the button
The sun/moon switch should reveal the new mode in a circle growing from the centre of the button that was tapped (top bar on laptops, top-right corner chip on phones), not from the top centre. lantern-toggle.tsx sets --vt-x/--vt-y; check the keyframe in index.css actually reads them at every width and on the sealed envelope, fix whatever makes it start elsewhere, and keep the cross-fade fallback and the instant change under reduced motion. Frame-by-frame screenshots in the PR.

## Step 3: Journey map, aligned to the Figma hi-fi
Compare what's built (#26 / #29, Options → Journey map) with Figma "Journey map · hi-fi concept" (file s23BmyKLaYjCzT97QVFXQZ, node 273:311, page 08) and "3 · Final flow · the journey" (node 360:56, page 10). Match: Kyoto as the 京 seal with "KYOTO · 15 OCT 2027", Canada and Brisbane labels, Nadia's line rust from Brisbane and Griffin's moss from Canada (dotted, drawn in), guests' lines faint gold, the Nadia / Griffin / Guests legend, "17 of 40 lines drawn so far" count line, "See as a list", desktop split (map left, story cards right) and the Lantern version (lines softly glow, no lanterns on the map). Make the land a slot: ART.mapLand (off until Nadia's painted land lands; the SVG land stays the fallback), placed with the template's 400 × 320 viewBox so her painting lines up. List every gap you find before changing anything, then fix them behind Options → Journey map. Don't invent story content.

## Step 4: Everything switched on, together
Turn on Fortune → Springs, Journey map → On, Nadia's envelope drawing and Garden drawing, then walk a whole guest visit: envelope → Home → reply (all 4 steps) → fortune → map → Home card → The day, at 390 and 1440, Autumn and Lantern, English and Japanese, reduced motion on and off. List anything that clashes or is too much at once (one moment per screen). Don't change defaults; I decide what goes on.

## Step 5: The replied Home on phones
With the journey card on, the countdown falls below the fold on a 390×844 phone. Propose the smallest fix behind an Option, with before/after screenshots.

## Step 6: Interaction polish round (Jehan, 6 Oct evening)
Each behind an Option unless it's a plain fix; list before/after with screenshots or a short screen recording.
1. Light, not a glow. Replace Options → Lantern light with something that feels alive and delicate rather than a cursor spotlight. Day (Autumn): komorebi, soft dappled light through leaves drifting very slowly over the photo and paper; the pointer only nudges it with a long, eased lag. Night (Lantern): a warm lantern pool that drifts and breathes (slight flicker), a few out-of-focus lantern bokeh far back, light catching the paper grain; the pointer nudges it the same way. Ambient when idle, never a trail (no cursor trails stays a rule). Use the existing ogl dependency (or CSS/SVG if it holds up), 30fps cap, DPR ≤ 1.5, paused when the tab is hidden, laptops with a fine pointer only, still frame under reduced motion. Never over faces at full strength. Refs: shaders.paper.design (mesh/grain gradients), css-tricks "A serene CSS dappled light effect". Build two or three variants for me to pick.
2. Envelope note. On hover the letter peeks up and crosses the note's line: give the note enough clearance for the peek at every width. Keep "open your invite" as the default copy; add an Option for a phone variant that hints the pull ("tap, or pull the letter up"). Redraw the arrow so it comes in from the upper-left at an angle, one loose loop, and a cleaner arrowhead (two short strokes of slightly different length, round caps); a touch of hand-drawn wobble is fine, nothing mechanical.
3. Background music, opt-in only. A small music toggle (top bar / corner chip, same style as the sun), off by default, 20% volume, fades in over 2s and out on pause, remembers the choice on the device, pauses when the tab is hidden, never autoplays with sound. Placeholder track: "among the clouds" by aqualina (2023). Do NOT commit the audio file until Jehan confirms permission from the artist; build it against a silent placeholder file and a config entry in src/lib/art.ts (src, title, artist, credit line shown in FAQs or the footer).
4. Countdown. The count-in plays when the site is opened or refreshed, or when you come back to the tab after a while (5+ minutes away), not on every page change. Session-scoped flag plus visibilitychange.
5. The day timeline. The scroll-linked line must be able to reach the bottom: finish when the timeline's end reaches about 60% of the viewport height (not the viewport bottom), and snap to full when the page can't scroll any further. Same for the CSS scroll-timeline path and the JS fallback. Check on a short laptop (1280×720) and a phone.

## When you finish
Tell me in plain language what changed, the PR links, and exactly where to check (page, width, mode, which Option to switch on). Short.
```
