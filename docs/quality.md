# Quality gates

`npm run test:e2e` (after `npm run build`) runs Playwright against the built site served by `vite preview`, as the
sample household, with the clock fixed and reduced motion on:

- **Screenshots:** every page (Home, The day, Travel, FAQs, Our story) at 390 × 844 and 1440 × 900, in Light and
  Lantern, full page, compared to the baselines in `e2e/__screenshots__/<platform>/`. After an intended change,
  `npm run test:e2e:update` and commit the new images.
- **Accessibility:** axe on each of those, tagged WCAG 2.0 to 2.2 A and AA. Any violation fails.
- **Performance budget:** initial JS under 150 kB gzipped; on every page, LCP under 2.5 s on an emulated mid-range
  phone over 4G (4× CPU, 1.6 Mbps, 150 ms) and CLS under 0.01. In CI the LCP limit is 2.8 s: GitHub's runners are
  slower under the same throttling (every page lands 0.7 to 1 s later than on a laptop). The largest paint is the
  scene photo on every page, already preloaded from the HTML at high priority and painted before the app script.
- **No jumping (phones):** opening a Travel row while one above it is open keeps the tapped row in place, and
  closing a sheet puts the page back at the same scroll position (`e2e/no-jump.spec.ts`).
- **Page changes:** the card's top and visible bottom are the same on every page; the page behind is the theme's
  paper and matches theme-color; the light / dark circle starts at the button on a first visit; on phones the card
  ends 12px above the dock (`e2e/page-change.spec.ts`).
- **Our story:** the next print comes in turned and settles straight, words cross-fade, a drag follows the finger and
  never turns the page, and reduced motion only fades (`e2e/story.spec.ts`).
- **RSVP:** every mix of answers gets through all three steps with the keyboard down or up, and with it up Back /
  Next are inline, never on the keyboard; Who's coming is a native radio group; the song search only searches when
  asked and puts the keyboard away; the flying-from combobox filters and picks (`e2e/rsvp.spec.ts`).
- **The day:** every timeline row has its time left of its icon, the icon on the line and the words right of it,
  in English and Japanese (`e2e/day.spec.ts`).
- **QR card:** laptops only, outside the letter, clear of the letter and their faces, bottom right, at 1024 to
  1920 in both themes; none on phones or tablets (`e2e/phone-qr.spec.ts`).
- **Top bar:** the switches are in the bar, none in the letter, and the bar stays at the top and visible through
  scrolls down and back up, with its hairline once scrolled (`e2e/top-bar.spec.ts`).
- **Music:** hiding the page (pagehide) stops the song at once and clears the phone's Now Playing entry; the song is
  under 160 kbps and 3.5 MB and loops with under a second of silence; its credit is only in the last FAQ
  (`e2e/music.spec.ts`).

Also on every PR: `npm run lint`, `npm test`, `npm run check:pending` (lists, doesn't fail, while placeholders remain).

## In GitHub Actions

`.github/workflows/quality.yml` runs all of the above on every PR to `main`. Make its `gates` check required on `main`
(Settings, Branches, a rule for `main`, "Require status checks to pass", then pick `gates`). Screenshots compare against `e2e/__screenshots__/linux/` in CI and `darwin/` on a Mac. After an intended
visual change, update both: `npm run test:e2e:update` on the Mac, and for Linux delete the changed images from
`linux/`, run the workflow (the run writes the missing ones), download its `playwright` artifact and commit them.
