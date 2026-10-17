# Pre-launch checklist

Run through this before the invites go to real guests.

1. `npm run check:pending` lists nothing. Each line it lists is a placeholder standing in for Griffin and Nadia's
   own words or photos (src/content/pending.ts). Put the real thing where it belongs, then delete the key.
2. `npm run build`, `npm run lint`, `npm test` and `npm run test:e2e` all pass (docs/quality.md).
3. Every Japanese line has had a native read (the newest ones are listed in docs/runs).
4. Our story: their chapter words are in the Content tab (that replaces the planner layout and its placeholder line).
5. The Content tab's `contact_day` is set (FAQs shows it instead of the placeholder).
6. A test reply on the test household arrives from the wedding address, not a personal one.
7. Open the live site on a real iPhone (Safari) and Android phone (Chrome): envelope, reply with the keyboard up,
   music stops when you lock the screen, page swipe, Travel jump links.
