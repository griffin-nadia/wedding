# AGENTS.md

## What this is
Private invite and RSVP site for Nadia and Griffin's wedding (15 Oct 2027, Kyoto). Each household gets its own link (`/?h=token`). The repo is PUBLIC (owned by the `griffin-nadia` GitHub account), so nothing private goes in it. See `README.md` for features.

## Stack
- Vite + React 19 + TypeScript, React Router, Tailwind v4, shadcn/ui (Radix) in `src/components/ui`.
- Tokens in `src/styles/tokens.css`; themes via `data-theme` (autumn, lantern).
- Back end: Google Sheet + Apps Script web app in `apps-script/`, pushed with clasp.
- Hosting: GitHub Pages (`/wedding/` base), built by `.github/workflows/deploy.yml`.

## Folders
- `src/` app code; `src/content/en.ts` all copy (Japanese in `ja.ts`, hidden by `SHOW_JA`).
- `apps-script/` back end (`Code.gs`, `README.md` for menu, properties and API).
- `docs/` data model, plan, system notes. `scripts/` QR cards and build helpers.
- `.brief/` private briefs and decisions (gitignored). Read `.brief/learnings.md` before back-end or deploy work.

## Commands
- `npm install`, `npm run dev` (http://localhost:5173/wedding/, sample household without `VITE_API_URL`)
- `npm run build` (type-check, build, copy 404.html), `npm run lint`
- `clasp push --force` then `clasp update-deployment <live deployment id> -d "what changed"`

## Rules
- Never commit guest data (names, emails, photos), tokens, `.env`, `.clasp.json`, `.brief/`, `private/` or `photos-private/`.
- Never send real invites. Use the test-only invite menu items.
- Redeploy the script with `clasp update-deployment <live id>` so the /exec URL never changes. Never `create-deployment` for updates. Do not write the deployment id into the repo.
- `clasp create-script` overwrites `appsscript.json`; restore it from git before pushing.
- Store user text in the sheet with a leading `'`.
- No analytics, cookies or third-party fonts. One delight moment per screen, each with a `prefers-reduced-motion` still version.
- Pushing needs `gh auth switch --user JehanBaguley`, then switch back to `jehan-w`. Check `gh auth status` first.
- On the work Mac, headless browsers hitting github.io are redirected to Microsoft SSO. Test a local build against the live back end instead (curl is fine).
- Check the branch is current with `main` before any push or PR.

## Standards
- WCAG 2.2 AA minimum: visible focus, 24px minimum target size, reduced motion respected.
- WAI-ARIA Authoring Practices patterns for interactive components (Radix gives most of these; keep keyboard behaviour intact).
- Use Open UI component names for new components where one exists.
- AGENTS.md is the agent instructions file; `CLAUDE.md` only points to it.
- Commits use Conventional Commits 1.0.
