# Mega plan — pocket invitation, 5–15 Oct 2026

Distilled from Jehan's working notes. One page that answers: what's decided, what N&G owe us, what we build next, and the exact prompt to hand the next build session.

---

## 1. North star

Every guest gets a personal invitation that knows who they are, what they're invited to, and what they need to know about a wedding in Japan. They reply for the household in two minutes and come back to it on the day.

- **Three jobs:** reply → prepare (travel, etiquette) → on the day (events, maps, table)
- **Nav:** Home · The day · Travel · FAQs (+ Our story once its three chapters exist). No login, no hamburger, personal link or short code only
- **Guardrails:** one chosen interaction moment per screen, everything else quiet. Kit states stay canonical (default, hover, focus, pressed, selected, disabled, error, loading). CSS/SVG first, Motion only where spring physics materially improve feel. 60fps on a mid-range phone, transform-only where possible. Reduced motion gets a complete still state, never a broken one. No scroll hijacking, no three.js, no smooth-scroll library. Japanese and Lantern switches are first-class site controls.

## 2. Right now (6 Oct)

**Live on main:** everything up to #21 (wide laptop photos, #19 polish, #20 nav and mode fixes, this plan).

**Open, merge in this order** (each is stacked on the one before, except #23):
1. #22 review-fixes: FAQ and tilt defaults, あ/A state, envelope photo framed like every page, hand-written arrival note
2. #24 qa-pass: clearer nav pill, sealed envelope no longer scrolls, FAQ hover, `npm test` for option defaults
3. #23 photo-hq: sharper phone photos, 2000 and 2400 sizes
4. #25 fortune-spring: fortune on Motion springs, behind Options → Fortune
5. #26 journey-map: Your journey step, map after the fortune, Home card, behind Options → Journey map

**Nadia's art arrived (6 Oct)**, a 200 dpi scan: closed envelope (maple leaf, gum leaf, wax seal), open envelope (flap up), garden line drawing (pagoda, benches, aisle; coloured version still to come). Copy in `photos-private/art/` (never committed). Rescan requested at 600 dpi PNG, one piece per scan, plus the seal and leaves on their own.

**The seal reads "G·N".** That matches their Q&A answer ("Griffin and Nadia") but not the site (Nadia & Griffin, N&G everywhere, the #12 link preview). Waiting on their answer; don't build the lettering or change names until it's settled.

**Waiting on Jehan:** paste `apps-script/Code.gs` into the Site-Data script and deploy (for "Already in Japan"); re-export the day PSD at 3840 × 2160 for a sharper laptop photo.

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

## 4. Asset spec (Nadia, scan/photograph Thu 8 – Sat 10 Oct)

- **Envelope painting** and **names lettering**, scanned or photographed flat in daylight, **600 dpi if scanned**.
- Drop in Sun 11 Oct; check every screen in Autumn + Lantern, phone + laptop.
- Photos generally: AVIF first, WebP fallback; 2400px wide desktop scenes, 1600px standard/mobile. **Faces stay sharp** — no global blur on final photos; masked edge treatment only, skipped on phones and reduced motion. LQIP is a loading placeholder, never the final treatment.

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

## Step 1: Check the stack
#22, #24, #23, #25, #26 are open (merge order in MEGA-PLAN §2). If any no longer merges cleanly after I merge the one before, rebase it and tell me. Don't start new work on top of an unmerged branch without saying which one.

## Step 2: Nadia's painted envelope (behind Options → Envelope art, off by default)
Source: photos-private/art/nadia-scans-2026-10-06.pdf (200 dpi; page 1 garden, page 2 open envelope, page 3 closed envelope). Use it now as a stand-in; a 600 dpi PNG rescan will replace it with no code change.
- Cut the closed and open envelopes from the paper (transparent PNG, then AVIF/WebP at 1x and 2x of the rendered size, about 380px wide on laptops) into public/art/envelope/. Keep the hand-drawn edge; no clean vector redraw.
- Sealed state: her closed envelope replaces the CSS one, same size, position and tilt. Opening: cross-fade to her open envelope as the flap lifts, then the letter rises out of it as now. The existing art slots (src/lib/art.ts, envelope.tsx) are where this plugs in.
- The seal on her drawing reads "G·N". Do not change any names, the CSS seal or the link preview; the name order is still being decided.
- Lantern: her envelope stays cream (it's paper under a lamp).

## Step 3: Garden drawing on The day (behind Options → Garden drawing, off by default)
Her ink drawing as a header above the timeline on The day. Day mode: ink on paper, multiply into the letter. Lantern: lines inverted to cream on the dark letter. Crop to the pagoda and aisle on phones. It's line art now; a coloured version may replace it later, so keep the slot format-agnostic.

## When you finish
Tell me in plain language what changed, the PR links, and exactly where to check (page, width, mode, which Option to switch on). Short.
```
