# The playground (local only)

`npm run lab` → Playground. Each experiment is one take on one part of the site, full screen in
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
- **Australian English, no em dashes.** No new dependencies (Three.js, ogl and Paper's shaders are already in).
- **Entry text:** `summary` one or two plain sentences; `refs` the inspiration links; `promote` what it would take to
  ship it (the work, the weight on phones, the risks, what it replaces).
