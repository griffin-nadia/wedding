# Mega plan — pocket invitation, 5–15 Oct 2026

Distilled from Jehan's working notes. One page that answers: what's decided, what N&G owe us, what we build next, and the exact prompt to hand the next build session.

---

## 1. North star

Every guest gets a personal invitation that knows who they are, what they're invited to, and what they need to know about a wedding in Japan. They reply for the household in two minutes and come back to it on the day.

- **Three jobs:** reply → prepare (travel, etiquette) → on the day (events, maps, table)
- **Nav:** Home · The day · Travel · FAQs (+ Our story once its three chapters exist). No login, no hamburger, personal link or short code only
- **Guardrails:** one chosen interaction moment per screen, everything else quiet. Kit states stay canonical (default, hover, focus, pressed, selected, disabled, error, loading). CSS/SVG first, Motion only where spring physics materially improve feel. 60fps on a mid-range phone, transform-only where possible. Reduced motion gets a complete still state, never a broken one. No scroll hijacking, no three.js, no smooth-scroll library. Japanese and Lantern switches are first-class site controls.

## 2. Right now

- #19 and #20 are merged; #22 fixes what the review of them found (FAQ and tilt defaults, あ/A state, envelope photo alignment, the arrival note). Then visual-check: FAQs in English/Japanese, Autumn/Lantern, phone and desktop, reduced motion on/off.
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
You're continuing work on a private wedding website + RSVP (React + TypeScript, repo: griffin-nadia/wedding). Read docs/MEGA-PLAN.md first — it is the source of truth for scope, guardrails and the stress-test matrix.

Context: PR #20 (state alignment + image quality) is merged. Build the next PR in the queue: PR 1 · Fortune reveal, unless I say otherwise.

Hard rules:
- One interaction moment per screen; everything else stays quiet.
- Kit states stay canonical: default, hover, focus, pressed, selected, disabled, error, loading.
- CSS/SVG first; Motion only where spring physics materially improve the feel.
- 60fps on a mid-range phone; transform-only motion where possible.
- Reduced motion gets a complete still state, never a broken or missing state.
- No scroll hijacking, no three.js, no smooth-scroll library.
- Faces in photos stay sharp; no global blur on final images.
- Japanese and Autumn/Lantern switches must keep working as first-class controls.
- Do not reopen cut explorations (loupe, postcard flip, shared branch, stamp book, keepsake, colour transition).

PR 1 spec: tap-first omikuji fortune (shake is progressive enhancement). Spring-driven sequence: tin shakes → stick rises → paper slip unfolds. One numbered 大吉 slip per reply (e.g. No. 7 of 12) with 大吉 / GREAT BLESSING, a fortune line, and "Save to my phone". Next action: "See your line on the map" (may deep-link to the existing journey foundation). Reduced motion shows a static opened slip. Use the 12 travel tips as placeholder fortune content behind a single content file so Griffin's real lines drop in without code changes.

Before opening the PR: npm run build passes, npm run lint has no new warnings, git diff --check passes, and walk the stress-test matrix in docs/MEGA-PLAN.md §8. Report what you checked and what you couldn't.
```