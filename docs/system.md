# The letter: design system

One idea runs through the whole site: **a scene behind, a letter in front.** After the envelope opens, the scene is warm paper (Nadia's painting drops into `public/art/paper/base` when it exists). The letter is the cream sheet everything is read on. Brand, tokens, type, states, motion and delight all follow from that.

See it live at `/kit` (every component, Light and Lantern side by side, every state). Try changes at `/lab` or `?tune=1`. Both open only from a crew link.

## Brand

- **Mood:** painted, foggy, warm, autumn Kyoto. Original only: nothing that references or imitates a show, film or studio.
- **Voice:** warm, plain, a bit playful. Australian English, sentence case, no em dashes. Guests never see back-end words; their reply "goes only to Griffin and Nadia".
- **Marks:** the names in Oranienbaum with a sage "&", the G&N seal (favicon, envelope, credit), the hanko 京 for "done".
- **Photos:** behind every page. The Photo option picks one per mode (kyoto-view by day, night-lane in Lantern) or the same one in both modes. Fixed and cover; nothing moves, rescales or reflows it. Each has a face-safe rect in `scenes.json` that nothing on the arrival may cover.
- **Texture:** one fine paper grain of our own, on the letter itself.

## Colour: one action, one story accent, one ink

| Role | Token | Light | Used for |
|---|---|---|---|
| Action (the only one) | `--sys-accent` | sage `#5b6b3a` | buttons, toggles, focus ring, selected states, the dock marker, the seal, the "&" |
| Links | `--sys-link` | forest | text links |
| Story accent | `--sys-story` | rust | Our story only: map lines, chapter labels, stop numbers. Never on a control |
| Stamp | `--sys-stamp` | vermilion | the hanko when a reply lands, nothing else |

**The envelope is always cream.** The envelope and the driver card carry `.paper`, which re-declares the light system and component tokens, so they read the same in both modes. The letter and the RSVP sheet go dark with the scene in Lantern (the "Letter in Lantern" option turns them cream instead).

## Tokens: three layers

| Layer | Prefix | What it is | Changes when |
|---|---|---|---|
| Brand | `--brand-*` | Nadia's palette (kinari, kogecha, sabi, koke, forest, hachimitsu, yoru, ai, kiri…) | Nadia changes the palette |
| System | `--sys-*` | What a colour is for, per mode: surface, surface-raised, surface-alt, fill, ink, ink-soft, ink-muted, accent, link, line, line-strong, focus, success, moss, danger | A role needs a different colour |
| Component | `--letter-*`, `--input-*`, `--button-*`, `--countdown-*`, `--pill-*`, `--scene-*` | One component's own values, aliasing system tokens | One component needs tuning alone |

Components only use system or component tokens; nothing invents a colour or an alpha. shadcn's names (`--background`, `--primary`…) are aliases of the system layer.

## Type: one scale, five roles

Three families, nothing else: **Oranienbaum** (serif display), **Inter** (sans body) and **Zen Old Mincho** (Japanese display, loaded only when someone switches to Japanese; Japanese body text uses the device's own Japanese sans).

| Role | Class | Face | Size / line | Weight | Used for |
|---|---|---|---|---|---|
| Display | `text-display` (`names`) | Oranienbaum | 56/56 on phones, 88/88 from 1024 | 400 | The names on Home, the driver card's address |
| Heading | `text-heading` (`heading` adds the moss rule) | Oranienbaum | 28/36 | 400 | Page titles (h1), section titles (h2), numerals (countdown, timeline times) |
| Body | `text-body` | Inter | 16/24 | 400; 500 for item titles | Everything you read, inputs, buttons, links, row titles |
| Small | `text-small` (`label-caps` is Small at 500) | Inter | 14/20 | 400; 500 for labels | Help, notes, errors, prices, step labels, card labels |
| Label | `text-label` | Inter | 12/16 | 500 | Countdown units and the status pill (the only caps) |

- **Their voice** (the sign-off, the fortune slip, "open your invite"): `voice`, Oranienbaum at the Body size.
- Tokens are `--type-{display,heading,body,small,label}-{size,leading}`; controls read `--type-ui-*`, which point at Body and Small.
- Tailwind's own sizes are switched off (`--text-*: initial`), so `text-sm`, `text-xl` or `text-[13px]` won't build: use a role. The hanko's 京 is part of the seal's drawing (`hanko-sm`, `hanko-lg`), not text.
- At most two roles in any one component. Sentence case everywhere; caps only on the status pill. Semibold and bold aren't used.

### One link style

`btn-text`: Inter at Body size, 500, the link colour, underlined (1px, 4px offset), 2px on hover, the focus ring like every control. Whole rows that link (stay rows, picks) underline their title on hover instead. The fortune slip's "Save to my phone" is `btn-text` in the slip's own ink, since the slip is always bright paper.

## Space and shape

- 4px grid, 8px vertical rhythm: related things 8 apart, unrelated 24, sections 32. Control padding never under 12.
- Letter padding 24 / 40. Tap targets 44 minimum; buttons and inputs 52 on phones, 48 from 768.
- Radius, one family scaled together by the lab's Roundness: **control 8** (inputs, buttons, chips, choice rows, list rows, nav items, segmented), **section 16**, **letter 24**. Nesting: outer = inner + the padding between. Only pills and the seal are fully round.
- One shadow: `--letter-shadow`. The RSVP sheet uses `--sheet-shadow` (the same at 1.5×). Nothing else casts one.

## Layout

- **Scene:** fills the viewport behind everything; static under reduced motion.
- **Letter:** 740 wide from 1024, 48 to 180 from the left (scales so the photo keeps room); texture on the card, a 1px line, no top bar, no blur ring.
- **Nav:** four items rendered once. Dock on phones, thin top bar from 768 with RSVP as a button. No footer, no tabs.
- **Home:** the letterhead, greeting, RSVP or the Replied pill, then the countdown row under the card (outside the letter).
- **Fits:** Home fits 390×844 and 1440×900. Every page ends the same distance above the dock: the dock, the safe area and 8px (`--dock-band`); 64px clear on laptops. Crew Options is the last nav item, never over the page.

## States: one system

| State | Fill | Line | Other |
|---|---|---|---|
| Default | surface-raised | line 1px | |
| Hover (pointer only) | same | line-strong | controls: border only, never a fill change |
| Hover, whole rows | ink tint, `--row-hover-mix` (5%, 7% in Lantern) | same | accordion questions, tick rows, stay rows, your reply: a tint 12px wider than the text; `--row-press-mix` while a finger is down; a tick box answers its row with a stronger line; an open question shows no tint (its chevron turns moss) until the pointer is on it. Options → Row hover. |
| Focus-visible | same | same | 2px ring in `focus`, 2px offset, on everything |
| Pressed | fill | same | scale .98, `--duration-press` (90 ms) |
| Selected | secondary | primary 2px | tick (a slot reserved so nothing shifts) |
| Disabled | surface | line | 50% text, no hover |
| Error | surface-raised | danger 2px | message under, 14px danger |
| Filled (fields) | same | same | small moss tick on the right |
| Loading | | | washi skeleton, appears after 300 ms |

Buttons are never greyed out to stop a step: pressing Next with something missing says what, under the field, and moves focus there. The song search uses the text field's states exactly.

## Motion

Paper rises and settles. Every duration and easing is a token; nothing is typed inline.

| Token | Use |
|---|---|
| `--duration-press` 90 ms | pressed scale |
| `--duration-quick` 150 ms | hover, focus, colour, ticks, toasts |
| `--duration-slide` 200 ms | the nav and segmented markers; a short swipe springing back |
| `--duration-turn` 280 ms | both letters on the page-turn track |
| `--duration-settle` 300 ms | steps, accordions, the fortune slip |
| `--duration-flap` 420 ms / `--duration-stamp` 420 ms | the envelope flap / the hanko landing |
| `--duration-rise` 600 ms | the letter rising, the names settling |
| `--duration-draw` 1.2 s | a line drawing itself (trail, timeline) |
| `--duration-shake` 900 ms | the omikuji box |
| `--duration-breathe`, `--duration-light`, `--duration-mist` | loading and the ambient paper |
| `--ease-paper`, `--ease-letter`, `--ease-out`, `--ease-spring`, `--ease-breathe` | arriving, the letter, leaving, the one bounce, loops |

Motion answers an action. Nothing fades up on scroll; the trail and the timeline line are the only things that draw as you scroll. Everything has a still version under reduced motion, and nothing moves while the tab is hidden.

## Delight: one moment per screen

| Screen | Moment |
|---|---|
| Arrival | The envelope over their photo: pull or tap opens it, with the paper sound on that tap (the only sound on the site) |
| Home | The names settle in once; the countdown's seconds tile ticks |
| RSVP | The hanko 京 stamps on success; the fortune unfolds |
| The day | The moss timeline draws in; a Now marker on the day |
| Travel | Show the driver: a modal above everything, the screen kept awake |
| Phones | The page turn: both letters on one track |

## Tools

- `/kit`: the design system, every built component and state, both modes.
- `/lab`: the options lab, with the tuning panel beside the real site in phone and desktop frames. Options are grouped by the part of the site they change and shown only where meaningful; anything settled isn't there.
- `?tune=1` on any page: the same panel over the real site. Pin notes on anything; export writes `tune.json`.
- The panel ships only in builds with `VITE_TUNE=1`. Changes live in the browser that made them; guests never see them.
