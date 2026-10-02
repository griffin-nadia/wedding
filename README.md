# Nadia & Griffin · wedding site

Private invite + RSVP site for Nadia and Griffin's wedding, Fri 15 Oct 2027, The Sodoh Higashiyama, Kyoto.
Each household gets its own link (`/?h=token`). No logins, no app, no trackers.

- **v1 (live Thu 15 Oct 2026):** Home, The day, Travel, Q&A, RSVP in a simple autumn look.
- **v2 (mid Dec 2026):** the look they pick, the envelope opening, delight moments, song search, Japanese.

Design file: Figma "Nadia-Griffin-Wedding-site" (page 00 Overview). Plan: the planner sheet's Plan tab.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173/wedding/ , uses a sample household ("Sam & Alex")
npm run build      # outputs dist/ (+ 404.html so deep links work on GitHub Pages)
```

Without `VITE_API_URL` the site runs on the sample household, so you can design and test pages before
the back end exists. Copy `.env.example` to `.env` and paste the Apps Script URL to go live.

## Stack

| Part | What | Why |
| --- | --- | --- |
| App | Vite + React + TypeScript, React Router | Simple static build, app-like tabs |
| UI | shadcn/ui (Radix, `radix-vega` style) in `src/components/ui` | Accessible accordion, sheet, radio, form parts we own and restyle |
| Styling | Tailwind v4, tokens in `src/styles/tokens.css` | One token file, themes via `data-theme` |
| Fonts | Shippori Mincho + Zen Kaku Gothic New via Fontsource | Served from our own site, split by unicode range |
| Data | Google Sheet + Apps Script web app (`apps-script/`) | Free, Nadia can edit, no server |
| Hosting | GitHub Pages: `griffin-nadia.github.io/wedding` | Free. Repo is public, so **no guest data in code, ever** |

## Tokens and themes

`src/styles/tokens.css` has two tiers: primitives (palette swatches) and semantic tokens
(`--background`, `--primary`, `--border`...) that shadcn reads. They mirror the Figma variables collection
**Tokens** on the design file's Components page.

- `data-theme="autumn"` (default) = Direction E, Autumn in Kyoto
- `data-theme="evening"` = Direction C, proves a theme swap needs no component changes

If they pick a different look for v2, add a theme block. Components stay the same.

## Content

All words live in `src/content/en.ts`, taken from their Inv details tab. Japanese goes in `ja.ts` with the
same shape (anything missing falls back to English). Every Japanese line is checked by a native speaker.

## Back end

See `apps-script/README.md` and `docs/data-model.md`.

## Deploy (GitHub Pages)

1. GitHub account `griffin-nadia` (signed up with the wedding Gmail `griffinandnadia@gmail.com`), public repo `wedding`. Settings > Pages > Source: GitHub Actions.
2. Push this code. Settings → Pages → Source: GitHub Actions.
3. Settings → Secrets and variables → Actions → Variables: add `VITE_API_URL`.
4. Every push to `main` builds and deploys (`.github/workflows/deploy.yml`).

## Rules

- No guest names, emails or photos in the repo. They live in the Sheet.
- `noindex` + `robots.txt` keep it out of search engines. It's private-by-link, not password-protected.
- One delight moment per screen. Every animation has a still version (`prefers-reduced-motion`).
