# The letter: design system

One idea runs through the whole site: **a scene behind, a letter in front.** After the envelope opens, the scene is warm paper (Nadia's painting drops into `public/art/paper/base` when it exists). The letter is the cream sheet everything is read on. Brand, tokens, type, states, motion and delight all follow from that.

See every component, Light and Lantern side by side, in the local lab (`npm run lab`). Nothing from the lab ships to guests.

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

Tokens live in `src/styles/tokens.css`; Tailwind reads the purpose layer through `@theme` in `src/index.css`.

| Layer | Names | What it is | Changes when |
|---|---|---|---|
| Base | `--brand-*` | Nadia's palette in oklch (kinari, kogecha, sabi, koke, forest, hachimitsu, yoru, ai…), the hex each came from beside it | Nadia changes the palette |
| Purpose | `--surface-paper`, `--surface-raised`, `--surface-alt`, `--surface-fill`, `--ink`, `--ink-soft`, `--ink-muted`, `--ink-link`, `--ink-story`, `--line-hairline`, `--line-strong`, `--line-focus`, `--action`, `--action-ink`… | What a colour is for. **Light and Lantern swap this layer and nothing else.** Utilities: `bg-surface-paper`, `text-ink-muted`, `border-line-hairline` | A role needs a different colour |
| Component | `--letter-*`, `--input-*`, `--button-*`, `--chip-*`, `--countdown-*`, `--pill-*`, `--scene-*` | One component's own values, aliasing the purpose layer | One component needs tuning alone |

Components only use purpose or component tokens; nothing invents a colour or an alpha. shadcn's names (`--background`, `--primary`…) alias the purpose layer.

### Surfaces and elevation

| Surface | Token | Looks like |
|---|---|---|
| Paper | `--elevation-paper` | the letter: grain, one soft shadow |
| Raised | `--elevation-raised` | cards and inputs on the letter: a hairline, no shadow |
| Sheet | `--elevation-sheet` | the one sheet (reply, journey map, driver card): grain, the deeper shadow |
| Overlay | `--elevation-overlay` | the dim behind a sheet |

Grain sits on every paper surface (the letter and every sheet, `.letter::before`). The letter's grain and mottle are small baked WebPs (`--texture-grain`, `--texture-soft`, one pair per theme, from `scripts/bake-textures.mjs`), not live SVG noise: a phone redraws both letters in every page turn, and the live filter was about three quarters of that work. Phones under 768 show the grain only. There is one backdrop blur on the site, on the nav, and blur is never animated.

## Type: one scale, six roles

Three families, nothing else: **Oranienbaum** (serif display), **Inter** (sans body) and **Zen Old Mincho** (Japanese display, loaded only when someone switches to Japanese; Japanese body text uses the device's own Japanese sans).

| Role | Class | Face | Size / line | Weight | Used for |
|---|---|---|---|---|---|
| Display | `text-display` (`names`) | Oranienbaum | 56/56 on phones, 88/88 from 1024 | 400 | The names on Home, the driver card's address |
| Heading | `text-heading` (`heading` adds the moss rule) | Oranienbaum | 28/36 on phones, 32/36 by 1440 | 400 | Page titles (h1), section titles (h2), numerals (timeline times) |
| Accent | `--type-accent-size` | system font (countdown), their hand (arrival note) | 70% of Heading: 20 on phones, 22 by 1440 | 400 | Home's countdown digits, the handwritten arrival note |
| Body | `text-body` | Inter | 16/24 | 400; 500 for item titles | Everything you read, inputs, buttons, links, row titles |
| Small | `text-small` (`label-caps` is Small at 500) | Inter | 14/20 | 400; 500 for labels | Help, notes, errors, prices, step labels, card labels |
| Label | `text-label` | Inter | 12/16 | 500 | The dock's tab names on phones only |

- **Their voice** (the sign-off, the fortune slip, "open your invite"): `voice`, Oranienbaum at the Body size.
- Tokens are `--type-{display,heading,accent,body,small,label}-{size,leading}`; controls read `--type-ui-*`, which point at Body and Small.
- Tailwind's own sizes are switched off (`--text-*: initial`), so `text-sm`, `text-xl` or `text-[13px]` won't build: use a role. The hanko's 京, the fortune's 大吉 and the map labels inside an SVG are part of their drawing and scale with it, not text roles.
- At most two roles in any one component. Sentence case everywhere; caps only for the place names drawn on the maps. Semibold and bold aren't used.

### One link style

`btn-text`: Inter at Body size, 500, the link colour, underlined (1px, 4px offset), 2px on hover, the focus ring like every control. Whole rows that link (stay rows, picks) underline their title on hover instead. The fortune slip's "Save to my phone" is `btn-text` in the slip's own ink, since the slip is always bright paper.

## Space and shape

- 4px grid, 8px vertical rhythm: related things 8 apart, unrelated 24, sections 32. Control padding never under 12.
- Letter padding 24 on phones, 48 from 768 (32 on Home on short laptop screens). Every padding, margin and gap is a `--space-*` step; the only other values on screen are sums the layout works out (the letter's offset from the left, room for the dock or a sheet's X) and a 2px optical nudge that lines a tick box up with its first line. Tap targets 44 minimum; buttons and inputs 52 on phones, 48 from 768.
- Radius, one family scaled together by the lab's Roundness: **control 8** (inputs, buttons, chips, choice rows, list rows, nav items, segmented, prints), **section 16**, **letter 24**, and **pill** for thin lines, dots and round buttons (Tailwind's `rounded-full` lands on it). Nesting: outer = inner + the padding between. Only pills and the seal are fully round.
- One shadow: `--letter-shadow`. The RSVP sheet uses `--sheet-shadow` (the same at 1.5×). Nothing else casts one.

## Layout

- **Scene:** fills the viewport behind everything; static under reduced motion.
- **Letter:** 740 wide from 1024, 48 to 180 from the left (scales so the photo keeps room); texture on the card, a 1px line, no top bar, no blur ring.
- **Nav:** five items rendered once: Home, The day, Travel, Our story, FAQs (Home first as the way back, FAQs last as reference; the swipe follows the same order). Dock on phones, in the top bar from 768 with RSVP as a button. No footer, no tabs.
- **Top bar:** on every screen, never hidden: G&N, then あ / A, music and the sun or moon on the right (never inside the letter). 56px plus the safe area on phones, 64 from 768. Soft paper glass at rest; once scrolled, a little more paper and a hairline.
- **Home:** the letterhead, greeting, RSVP or the Replied pill, the countdown and the sign-off, in display, body and small only. The same width as every page; bottom left on laptops, with "Open on your phone" as its own small paper card bottom right (just the code under 1280).
- **Our story:** a sideways carousel, one stop per screen and nothing scrolls inside one: the kid-photo opener, a stop per chapter, then the journey map once at the end (Nadia's and Griffin's lines, the guests' lines by count, and the household's own once they've said where they're flying from). Phones: the print centred, its chapter line underneath. From 1024: a centred two-column spread, the print one side and the words the other, arrows and dots centred below. `--print-h` is a print's long side.
- **Travel order:** `src/lib/travel-order.ts`. Until 14 days before the ceremony it's the planning order (Getting to Kyoto, Where to stay, Before you fly, On the day). From 14 days out, or whenever the Content tab's `mode` is `week-of`, On the day moves to the top, and the jump links and the three summary lines follow. Worked out once per visit from the device clock. The last section always has room to scroll up under the header, and a tapped jump link is marked at once and stays marked until the guest scrolls.
- **Fits:** Home fits 390×844 and 1440×900. Every page ends the same distance above the dock: the dock, the safe area and 8px (`--dock-band`); 64px clear on laptops. 

## States: one system

| State | Fill | Line | Other |
|---|---|---|---|
| Default | surface-raised | line 1px | |
| Hover (pointer only) | same | line-strong | controls: border only, never a fill change |
| Hover, whole rows | ink tint, `--row-hover-mix` (5%, 7% in Lantern) | same | accordion questions, tick rows, stay rows, your reply: a tint 12px wider than the text; `--row-press-mix` while a finger is down; a tick box answers its row with a stronger line; an open question shows no tint (its chevron turns moss) until the pointer is on it. Options → Row hover. |
| Focus-visible | same | same | 2px ring in `focus`, 2px offset, on everything |
| Pressed | fill | same | spring to .97, `--duration-fast` |
| Selected | secondary | primary 2px | tick (a slot reserved so nothing shifts) |
| Disabled | surface | line | 50% text, no hover |
| Error | surface-raised | danger 2px | message under, 14px danger |
| Filled (fields) | same | same | small moss tick on the right |
| Loading | | | washi skeleton, appears after 300 ms |

Buttons are never greyed out to stop a step: pressing Next with something missing says what, under the field, and moves focus there. The song search uses the text field's states exactly.

## Motion

Paper rises and settles. Three durations, two easings, one spring; nothing is typed inline. Under reduced motion all three durations are zero, so nothing transitions, animates or loops.

| Token | Use |
|---|---|
| `--duration-fast` 150 ms | presses, hover, focus, ticks, toasts, markers sliding |
| `--duration-base` 300 ms | steps, accordions, page turns, the flap, the stamp |
| `--duration-slow` 600 ms | the letter rising, the Light/Lantern reveal; lines draw at ×2, loops are multiples |
| `--ease-paper` | everything that arrives or settles |
| `--ease-out` | things leaving |
| `--ease-spring` | the press (scale .97), the flap, a short swipe springing back |

One frame loop runs every animation that needs script (`src/lib/frame.ts`); nothing else calls `requestAnimationFrame`. Scroll and resize work goes through IntersectionObserver, ResizeObserver or CSS scroll timelines (the timeline on The day draws with `animation-timeline: scroll(root)`). The only scroll listener left is the keyboard's VisualViewport, which has no observer. Page changes on laptops are view transitions; phones keep the page-turn track. Toasts arrive with `@starting-style`, textareas grow with `field-sizing: content`.

## Components

- **Button** (`ui/button`): primary, secondary, quiet, link; sizes sm 44, md (the field height), lg 56; hover, focus-visible, pressed (spring to .97), disabled, loading (`aria-busy`, a spinner). The fortune's "Save to my phone" is the link variant in the slip's own ink.
- **Chip** (`chip-shape`, `--chip-*`): the date chip, status chips, the Replied badge, reply chips and choice chips share one height (32, a 44 tap area on the tappable ones), radius, hairline and padding.
- **Sheet** (`ui/sheet`): the one dialog. Fixed head, scrolling body, X, Esc, focus trapped and returned.
- **Accordion** (`ui/accordion`, `Disclosure`): one open at a time.
- **Field** (`ui/field`): label always visible, help or an inline error. **Checkbox group** (`ui/checkbox-group`): tap chips, no keyboard.
- **Toast** (`ui/toast`): one at a time, 4 s, never for an error.

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

- `npm run lab`: the local lab (component gallery, options panel, layout and style switchers, experiments). Never built into or linked from the guest site.
