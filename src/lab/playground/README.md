# The playground (local only)

`npm run lab` (or `npm run lab -- --host` for a phone, with a QR in the terminal) → Playground (local only, never
deployed). Each experiment is one idea for one part of the site, in 2 or 3 takes, full screen in
`lab-play.html?x=<id>`, shown in a phone (390 × 844) or laptop (1440 × 900) frame at 0.25× to 2× speed.

## The contract for an experiment

- **One file**, `x/<area>/<id>.tsx`, default export a component that fills the screen (`min-height: 100svh`) and works
  at 390 and 1440 wide, touch and mouse. Its entry (title, summary, refs, promote) goes in `x/<area>/index.ts` with
  `Component: lazy(() => import("./<id>"))`.
- **Self-contained:** its own styles in a `const css` string rendered as `<style>{css}</style>`, class names prefixed
  `x-<id>-`. It may use the site's tokens (CSS variables), components and copy (`useLang().t`), never edit them.
- **Real content only:** words, dates and places from `src/content/en.ts` / `ja.ts` (through `t`) or the planner
  (`src/content/story-plan.ts`); photos through `Photo` / the scenes. No invented facts or names.
- **Speed:** CSS animations, transitions, Web Animations and view transitions follow the slider by themselves. Script
  motion uses `spring()` / `tween()` from `../../motion`, and timeouts use `ms(n)`. Never call
  `requestAnimationFrame` directly (use `loop` from `@/lib/frame` if needed).
- **Reduced motion:** `still()` from `../../motion` (or the media query): a still or fade-only version, always.
- **Both themes**, from the tokens (`--letter-bg`, `--ink`, `--ink-soft`, `--action`, `--line-hairline`…).
- **Accessible:** real buttons and links, 44px targets, visible focus (`--input-focus`), labels, `aria-live` where
  something announces. Skip buttons where something takes time.
- **Australian English, no em dashes.** No new dependencies (Three.js and Paper's shaders are already in).
- **Deciding or Parked:** every entry has one: `deciding` (what Jehan or Griffin and Nadia need to choose) or
  `parked` (an idea kept for later). Decided ones are deleted, with their thumbnails; the run log says what won.
- **Takes, knobs, live (lab run 19):** 2 or 3 `takes` (read with `useTake()` from `../../params`), any `knobs` (read
  with `useKnob()`), and `live`: where the site does this today, for Compare with live. All of it lives in the address
  (`?take=&k.<knob>=&theme=&speed=&live=1`), so a link opens the exact view, and the Options sheet's Copy settings
  turns it into a note for Claude Code. The Shortlist shows every `deciding` entry's takes side by side.
- **Performance:** `node scripts/lab-perf.mjs` measures each one on a throttled phone (fps, long tasks, the code it
  loads) into `src/lab/perf.json`, shown as the card's badge. Transform and opacity only; no long task over 50 ms; under
  2 MB of extra code, loaded on demand.
- **Entry text:** `summary` one or two plain sentences; `refs` the inspiration links; `promote` what it would take to
  ship it (the work, the weight on phones, the risks, what it replaces).
