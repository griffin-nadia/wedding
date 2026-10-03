# The letter: design system

One idea runs through the whole site: **a scene behind, a letter in front.** The scene is a real photo now (painted plates later). The letter is the cream sheet everything is read on. Brand, tokens, type, states, motion and delight all follow from that.

See it live at `/kit` (every component, Light and Lantern side by side, every state). Try changes at `/lab` or `?tune=1`.

## Brand

- **Mood:** painted, foggy, warm, autumn Kyoto. Original only: nothing that references or imitates a show, film or studio.
- **Voice:** warm, plain, a bit playful. Australian English, sentence case, no em dashes. Guests never see back-end words; replies "go only to Nadia and Griffin".
- **Marks:** the names in Oranienbaum with a rust "&", the N&G seal, the hanko 済 for "done".
- **Green is a material, not an overlay:** the moss rule under titles, the forest edge on the letter, sage paper as the second surface, success states, and the green in the scene art. Lantern mode adds honey, not more red. No dots, blobs, vines or mist bands drawn over the page.
- **Texture:** one fine paper grain of our own, on the letter only.

## Tokens: three layers

| Layer | Prefix | What it is | Changes when |
|---|---|---|---|
| Brand | `--brand-*` | Nadia's palette (kinari, kogecha, sabi, koke, forest, hachimitsu, yoru…) | Nadia changes the palette |
| System | `--sys-*` | What a colour is for, per mode: surface, surface-raised, surface-alt, fill, ink, ink-soft, ink-muted, accent, accent-ink, link, line, line-strong, focus, success, moss, danger, edge | A role needs a different colour |
| Component | `--letter-*`, `--input-*`, `--button-*`, `--countdown-*`, `--scene-*`, `--texture-*` | One component's own values, aliasing system tokens | One component needs tuning alone |

Components only use system or component tokens. shadcn's names (`--background`, `--primary`…) are aliases of the system layer. Figma mirrors this exactly: **Tokens** (brand, sys and component groups; Light and Lantern modes) and **Scale**.

## Type: three jobs, three sizes per screen

| Job | Face | Size (390 → 1440) | Notes |
|---|---|---|---|
| Display: names | Oranienbaum | 56 → 88, line 1.0, −0.02em | "&" in rust |
| Display: numerals | Oranienbaum | 32 / 40 | countdown and timeline times |
| Heading | Oranienbaum | 28 → 34, line 36 / 40, −0.01em | sentence case, 40px moss rule under |
| Body | EB Garamond | 18 → 19, line 28 | never lighter than chestnut; all content from the sheet |
| Note | Klee One | 15 → 16, line 24 | their voice |
| Label | Inter 500 | 12 / 16, 0.08em caps | at most one per card; field labels |
| Small | EB Garamond | 14 / 20 | errors and fine print only |

Sizes are fluid between the two artboards (`clamp`). Buttons use body type.

## Space and shape

- 4px grid, 8px vertical rhythm. Space: 4 8 12 16 24 32 48 64 96.
- Letter padding 24 / 56, gap between blocks 24 / 32. Tap targets 44 minimum; buttons and inputs 52 on phones, 48 from 768.
- Radius: 4 chips and inputs, 8 cards in the letter, 12 buttons, 24 the letter. 999 only for the status pill, the seal and the dock.

## Layout

- **Scene:** fills the viewport. From 1024 the clear photo sits on the right (where the faces are) over a soft fill on the left, which is where the letter sits. Grade: saturate .92, contrast .95, warm 4%.
- **Letter:** 620 wide from 1024, 180 from the left, 120 from the top; 6px forest edge (honey in Lantern); a 12px blur of the scene within 24px of its edge so it reads as paper.
- **Nav:** four items, rendered once. Dock on phones, thin top bar from 768, sliding sage marker. RSVP is a button, never a nav item. No footer: the letter ends with the sign-off, sound and Lantern, then the credit line.
- **Fits:** Home, RSVP steps and success fit 390×844 and 1440×900.

## States: one system

| State | Fill | Line | Other |
|---|---|---|---|
| Default | surface-raised | line 1px | |
| Hover (pointer only) | same | line-strong | no fill change |
| Focus-visible | same | same | 2px ring in `focus`, 2px offset, on everything |
| Pressed | fill | same | scale .98, 90 ms |
| Selected | fill | accent 2px | tick or seal in accent |
| Disabled | surface | line | 50% text, no hover |
| Error | surface-raised | danger 2px | message under, 14px danger |
| Filled (fields) | same | same | small moss tick on the right |
| Loading | | | washi skeleton, appears after 300 ms |

Buttons are never greyed out to stop a step: pressing Next with something missing says what, under the field, and moves focus there.

## Motion

Paper rises and settles. Nothing bounces except the one stamp.

| Token | Use |
|---|---|
| `--duration-press` 90 ms | pressed scale |
| `--duration-quick` 150 ms | hover, focus, colour, the tick |
| `--duration-settle` 300 ms | steps, accordions, page content, the flap |
| `--duration-rise` 600 ms | the letter rising, scene cross-fade, rows settling |
| `--ease-paper` | things arriving |
| `--ease-letter` | the letter and envelope |
| `--ease-out` | things leaving |

Repeated things get less motion. Everything has a still version under reduced motion, and nothing moves while the tab is hidden.

## Delight: one moment per screen

| Screen | Moment |
|---|---|
| Arrival | The envelope (hover lifts the flap and a corner peeks out; tap opens it, the letter rises) |
| Home | The names settle in once per visit; the live line ("377 days to go, it's 9:14 pm in Kyoto") |
| RSVP | Steps slide the way you're going; ticks pop in |
| Success | The hanko stamps, with one furin ting if sound is on |
| Fortune | The box tilts and the slip unfolds |
| The day | The moss line draws in and rows settle as you scroll; a Now marker on the day |
| Travel | Show the driver goes full screen and keeps the screen awake |

## Tools

- `/kit`: the design system, every component and state, both modes.
- `/lab`: the options lab. The tuning panel beside the real site in phone and desktop frames. Options are props on the real components (envelope or noren, photos or painted plates, The day tabs, story map or list, texture, nav style, envelope peek).
- `?tune=1` on any page: the same panel over the real site. Pin notes on anything.
- Export writes `tune.json`; commit it as `.brief/tune.json` and `node scripts/apply-tune.mjs` writes it into `tokens.css`.
- The panel ships only in builds with `VITE_TUNE=1` (the Pages build has it, for Jehan, Nadia and Griffin). Changes live in the browser that made them; guests never see them.
