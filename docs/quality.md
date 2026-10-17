# Quality gates

`npm run test:e2e` (after `npm run build`) runs Playwright against the built site served by `vite preview`, as the
sample household, with the clock fixed and reduced motion on:

- **Screenshots:** every page (Home, The day, Travel, FAQs, Our story) at 390 × 844 and 1440 × 900, in Light and
  Lantern, full page, compared to the baselines in `e2e/__screenshots__/<platform>/`. After an intended change,
  `npm run test:e2e:update` and commit the new images.
- **Accessibility:** axe on each of those, tagged WCAG 2.0 to 2.2 A and AA. Any violation fails.
- **Performance budget:** initial JS under 150 kB gzipped; on every page, LCP under 2.5 s on an emulated mid-range
  phone over 4G (4× CPU, 1.6 Mbps, 150 ms) and CLS under 0.01.

Also on every PR: `npm run lint`, `npm test`, `npm run check:pending` (lists, doesn't fail, while placeholders remain).

- **No jumping (phones):** opening a Travel row while one above it is open keeps the tapped row in place, and
  closing a sheet puts the page back at the same scroll position (`e2e/no-jump.spec.ts`).

## In GitHub Actions

The workflow is in `docs/ci/quality.yml`. Move it to `.github/workflows/quality.yml` from a machine whose GitHub
token has the `workflow` scope (or paste it in GitHub's web editor), then add "Quality gates" as a required status
check on `main`. Its first run writes Linux screenshot baselines and uploads them as an artifact: commit those to
`e2e/__screenshots__/linux/` so later runs compare against them. Until it's moved, run the gates locally before
merging.
