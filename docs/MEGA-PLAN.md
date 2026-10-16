# Mega plan — pocket invitation

One page that answers: what's decided, what Griffin and Nadia owe us, and what we build next. **Live status lives in the planner sheet's Where we're at tab**; this page is the plan behind it. Refreshed 16 Oct 2026.

## 1. North star

Every guest gets a personal invitation that knows who they are, what they're invited to, and what they need to know about a wedding in Japan. They reply for the household in two minutes and come back to it on the day.

- **Three jobs:** reply → prepare (travel, etiquette) → on the day (events, maps, table)
- **Nav:** Home · The day · Travel · FAQs (+ Our story once its three chapters exist). No login, no hamburger, personal link or short code only
- **Guardrails:** one chosen interaction moment per screen, everything else quiet. Kit states stay canonical (default, hover, focus, pressed, selected, disabled, error, loading). CSS/SVG first, Motion only where spring physics materially improve feel. 60fps on a mid-range phone, transform-only where possible. Reduced motion gets a complete still state, never a broken one. No scroll hijacking, no three.js, no smooth-scroll library. Japanese and Lantern switches are first-class site controls.

## 2. Right now (16 Oct)

- **Invite first, next week.** The send moved from Thu 15 Oct to next week. What goes is what's on main: Home, The day, Travel, FAQs and the reply. Everything still being made has a live fallback, so nothing blocks the send.
- **Our story stays hidden until the words exist.** Guests don't see the page or its nav item until Griffin and Nadia's story is in the Content tab. Crew can preview the map and the kid-photo opener.
- **Status:** the planner's Where we're at tab is the one list. Crew see an amber Placeholder tag on anything not final (#53), and the tag goes when the real thing lands.

**Open PRs (Jehan merges):**

| PR | What | Note |
| --- | --- | --- |
| #52 | Griffin first in the names everywhere | Confirm with Griffin and Nadia before merging; then paste Code.gs and update the deployment |
| #53 | Placeholder tags for crew | |
| #54 | Our story opener: Nadia's kid photo, Griffin's slot waiting | Merge after #53 |
| #55 | Smaller music file (3.2 MB) | |
| #56 | "Replies are paused" if Google locks the script, plus `docs/if-google-locks-it.md` | |
| #57 | Hotel and Airbnb picks on Travel, the line after the changes lock | Code.gs paste for the email line |

**Housekeeping (16 Oct):** merged remote branches deleted, the stale test worktree pruned. `japanese-full` is kept (never merged).

## 3. What Griffin and Nadia owe us

| Who | What | Blocks |
| --- | --- | --- |
| Both | Confirm the name order on the site (#52) | Merging #52, Nadia's lettering |
| Both | A line per story photo (planner, Photos + story tab) and the story words in Content | Our story |
| Both | Ask Noya re "who to call on the day" | That card on The day + FAQs |
| Griffin | 12 fortune lines | Fortune slip (travel tips until then) |
| Griffin | A kid photo for the Our story opener | The opener for guests (Nadia's is in: the car seat photo) |
| Nadia | Painted map land, a blank paper scan, 600 dpi rescans, hand-lettered names | Final map, paper texture, envelope, letterhead (fallbacks ship fine) |
| Someone they ask | A native read of the Japanese | The Japanese tag (`src/lib/placeholders.ts`) |

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

Photos (not Nadia's art): story chapter photos from Griffin and Nadia; everything else stays on the current photos.

## 5. Build queue

### Done since 6 Oct
Fortune on springs, the journey map, Nadia's envelope and garden drawings, the mode switch from the button, music on the first tap, smoother page turns, the 16 Oct content (#51), and the open PRs above.

### Next
1. **The send** (next week): merge what's approved, check the live site on a phone and a laptop in both modes, sync the guest list, make every link, test invite to Jehan only, download a backup, send.
2. **Our story with photos** (when the words exist): one stop per photo from `photos-private/story/` (AVIF + WebP, faces sharp), the map ring moving to each stop, the kid-photo opener first, Kyoto last (Figma 3b, node 422:2). Copy the photo files into `public/photos/` in that PR.
3. **Ambient background** (Options → Scene → Ambient, Off listed first): laptops with a fine pointer only, a still under reduced motion, no cursor trails.

### Later / blocked
- Names letterhead draw-on — after the name order is confirmed and Nadia's lettering arrives
- Envelope artwork final — after Nadia's rescan
- "Who to call on the day" — after Noya says yes
- Kyoto hover prints — when final photos arrive
- Moving replies off Google, only if it's needed (`docs/if-google-locks-it.md`)

## 6. Research backlog

1. Finish the audit evidence — desk review is done, screenshots were never captured.
2. The six-gap research pass (see the prompt in Working notes → "Next research prompt"): Japan destination-wedding sites, bilingual EN/JA RSVP flows, household + nijikai RSVP patterns, firsthand guest complaints, "find your table" seating patterns, restrained ryokan/tea/craft sites for mood.

## 7. Timeline

| When | What |
| --- | --- |
| Week of Mon 19 Oct | Merge, check, sync the list, make links, send the invite |
| Late Oct – Nov | Content from Griffin and Nadia lands; tags drop off one by one |
| When the story words exist | Our story switches on with its photos |
| Mon 15 Feb 2027 | Replies due |
| Fri 30 Apr 2027 | Changes lock; after it, the "life happens" line replaces the change-by line (#57) |
| Fri 15 Oct 2027 | The wedding |

**Fallback rule:** painting, lettering, fortunes, story and Noya each have a live fallback, so none of them block the send.

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

