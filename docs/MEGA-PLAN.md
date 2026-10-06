# Mega plan — pocket invitation, 5–15 Oct 2026

Distilled from Jehan's working notes. One page that answers: what's decided, what N&G owe us, what we build next, and the exact prompt to hand the next build session.

---

## 1. North star

Every guest gets a personal invitation that knows who they are, what they're invited to, and what they need to know about a wedding in Japan. They reply for the household in two minutes and come back to it on the day.

- **Three jobs:** reply → prepare (travel, etiquette) → on the day (events, maps, table)
- **Nav:** Home · The day · Travel · FAQs (+ Our story once its three chapters exist). No login, no hamburger, personal link or short code only
- **Guardrails:** one chosen interaction moment per screen, everything else quiet. Kit states stay canonical (default, hover, focus, pressed, selected, disabled, error, loading). CSS/SVG first, Motion only where spring physics materially improve feel. 60fps on a mid-range phone, transform-only where possible. Reduced motion gets a complete still state, never a broken one. No scroll hijacking, no three.js, no smooth-scroll library. Japanese and Lantern switches are first-class site controls.

## 2. Right now (6 Oct, evening)

**Live on main:** everything through #26: review fixes, QA pass (sage nav pill, `npm test`), sharper phone photos, fortune on springs and the journey map. The last two are **off** behind Options until we switch them on. #4 is superseded (already on main); close it.

**Open:** #27 Nadia's drawings (envelope + garden, behind Options). Code is in; the three image files are on the Mac branch `nadia-art-images` and get added to #27 once that's pushed.

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

## Step 1: Land #27
If nadia-art-images isn't on GitHub yet, push it (git push -u origin nadia-art-images), then bring its three files (public/art/envelope/drawn-closed.webp, drawn-open.webp, public/art/garden/garden-ink.webp) onto the nadia-art branch and push. Check #27 in a browser with Options → Nadia's envelope drawing and Options → Garden drawing on: envelope same size and spot as the paper one, opens to her open envelope with the letter rising, no jump; garden ink dark by day, cream in Lantern, cropped to the pagoda and aisle on phones. Fix anything off on the same branch and say what you changed.

## Step 2: Everything switched on, together
In one browser, turn on Fortune → Springs, Journey map → On, Nadia's envelope drawing and Garden drawing, then walk a whole guest visit: envelope → Home → reply (all 4 steps) → fortune → map → Home card → The day. At 390 and 1440, Autumn and Lantern, English and Japanese, reduced motion on and off. List anything that clashes or feels like too much at once (one moment per screen). Don't change the defaults; I decide what goes on.

## Step 3: The replied Home on phones
With the journey card on, the countdown falls below the fold on a 390×844 phone. Propose the smallest fix (e.g. the card below the countdown, or folded into the reply row) behind an Option, with before/after screenshots in the PR.

## When you finish
Tell me in plain language what changed, the PR links, and exactly where to check (page, width, mode, which Option to switch on). Short.
```
