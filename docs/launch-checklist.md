# Launch checklist

The single list for launch day (rebuilt 18 Oct 2026, end of run 18e). Three parts: what's done, what Jehan does by
hand, and what Griffin and Nadia still owe. The how-to for each step is linked; `npm run check:pending` prints the
live list of placeholders and Japanese lines.

## Done

- The site: five pages in English and Japanese, the envelope (floating, "Open your invite"), the reply form, the
  fortune, the countdown, Travel, Our story, FAQs, Light and the walnut Lantern, the music, the favicon from the
  wax seal. Nadia's art: the envelopes, the seal, the gum leaves, the names lettering (theme ink, a sage "&") and
  her crosshatch as the paper.
- The card is a fixed frame between the bar and the dock; only the bar stays put; Travel's jump links are the one
  sticky row.
- Home's next step after replying (travel dates, then Plan your trip). Email links where the words say "message
  us". [Guest journey map](journey-map.md), no dead ends left that we can fix without N&G.
- Quality gates on every PR (`gates`, 115 tests): every page at 390 and 1440 in both themes with axe (WCAG 2.2 AA),
  the performance budget, 320 in English and Japanese, landscape, 200% zoom, keyboard-only reply, the after-30-Apr
  state, back and forward, music, icons. The back-end stress test (`node scripts/stress-api.mjs`, mocks only)
  passes 9 of 9: a household of 6, long names, slow and lost connections, a double Send, a bad link, two tabs.
- The back end (Apps Script, version 43): emails only send from the wedding account (held otherwise); name order
  check; Prepare for launch (report only until run for real); weekly backup; emails say Japan time.
- The lab at a hidden path: https://griffin-nadia.github.io/wedding/lab-x2tyua87sy/ (noindex).
- The ICOCA & HARUKA link that was broken is replaced by JR West's HARUKA One-way Ticket page (18c).

## What Jehan does by hand, in this order

1. [ ] **Real-phone test** on an iPhone (Safari) and an Android phone (Chrome), on the live site. What headless
   Chromium can't prove:
   - the envelope floats and opens from a tap on it or on "Open your invite"; a long press never offers to save
     the picture; the music starts on that first tap (or the first tap anywhere for a returning guest) and fades
     in gently, and the toggle's ring stops once it plays;
   - the card sits 12px under the bar and above the dock and its words scroll inside it, on every tab; no strip of
     photo shows mid-swipe; the bar and dock never change colour;
   - the light / dark circle grows from the sun or moon, first switch and second;
   - the reply form with the keyboard up (Back / Next never on the keyboard); the song search;
   - Our story: a drag follows the finger and never turns the page;
   - the music stops at once when the phone locks, and Now Playing clears;
   - VoiceOver (iPhone) through the reply form once: each person's choice is read as a radio group;
   - the keyboard (final run): it slides over the page and nothing shrinks or jumps, in the reply form, "Where are
     you flying from?", "Can't find your invite?" and Ask us; the field you're typing in stays in view;
   - the envelope letter: it slides up out of the open envelope, in front of the back and behind the front;
   - the journey globe: it turns with a finger, Globe / Flat switches cleanly, and reduced motion starts it flat;
   - the city search: "Noeth Melb" finds Melbourne, a chip picks a city, the gold line draws to Kyoto;
   - Ask us: a question finds an answer, and "Send it to us" says it's sent;
   - the music level: quiet under speech on an iPhone (it's set through Web Audio; iPhones ignore the old volume).
2. [ ] **Email queue on from the wedding account**: [docs/email-queue.md](email-queue.md). Until this is done,
   every email is held (safely). Check `?action=ping` shows the wedding account, then send one test reply and see
   it arrive from the wedding address.
3. [x] **Make the gates required on `main`** (done) (needs an admin): https://github.com/griffin-nadia/wedding/settings/branches
   → add a rule for `main` → Require status checks to pass → `gates`.
4. [ ] **Monitoring**: UptimeRobot on the back end's `?action=health` and the site, and the error alerts
   (`ALERT_EMAIL`, optionally `DISCORD_WEBHOOK_URL`): [docs/monitoring.md](monitoring.md).
5. [ ] **Weekly backup on** from the wedding account: [docs/launch.md](launch.md#weekly-backup).
6. [ ] **Prepare for launch**: [docs/launch.md](launch.md). Run the report first (safe any time). When you say
   "clean for launch": Prepare for launch: run for real… (type LAUNCH). It backs up both sheets, clears the test
   rows, resets visits and the queue, copies the planner's guest list in, and makes the links. Its last line says
   whether the invite emails fit in today's Gmail limit ([launch.md](launch.md#the-email-quota)).
7. [ ] **Send**: Send invites (test, to me only)… and check it (`node scripts/render-emails.mjs` shows every email locally
   first), then Send invites to everyone not yet invited…. For households with no email, text
   them their link (the launch report lists them; `npm run qr-cards` for printed cards).

Before launch, Jehan picks the paper in the lab (the Paper experiment, or the Paper option on any experiment); the
guest site's paper is plain until then (18f).

The Crew tab's Kit and Lab links were cleared on 18 Oct 2026 (the lab is local only now: `npm run lab`).

Optional: the Cloudflare previews ([docs/previews.md](previews.md)): move `docs/ci/previews.yml` into
`.github/workflows/` from an account with the workflow scope, and add the two secrets.

Also check by hand once (they refuse scripts): the DoubleTree Kyoto Higashiyama (Hilton), the JR Pass timetable,
Ninja WiFi's SIM page, Travelkon's eSIM page, and Google Flights ("Flights to KIX") on a phone.

## What Griffin and Nadia still owe

Placeholders still showing (`src/content/pending.ts`):

- [ ] **Our story words**, each chapter (`story.chapterBody`). In the Content tab.
- [ ] **Griffin's kid photo** for the Our story opener (`story.kidGriffin`), and any story photo not yet in
  (`photo.toCome`).
- [ ] **Who to call on the day**: Jehan's and Noya's numbers (`faqs.contactDay`, the Content tab's `contact_day`).
- [ ] **Words to approve** (written in their voice, 18e and 18f): "Add your travel dates", "Plan your trip" (Home's
  next step), "Email Griffin & Nadia" (closed replies and the end of FAQs) and "Your travel dates" (the reply's
  dates step).

Waiting on them:

- [ ] **The 12 fortunes** confirmed, especially the six travel tips (ICOCA or Suica, no tipping, Haruka about 75
  minutes, cash-only shops, luggage delivery, temples calm before 8 am).
- [ ] **What time guests should arrive** on the day (The day and the invite email say nothing yet).
- [ ] **Nadia's maple leaf on its own**, for wherever a leaf shows alone. Also still to come: the painted map land,
  her handwritten sign-off, and a look at the open envelope's cut (18c log).
- [ ] **A native read of the Japanese**: the pack [docs/japanese-read.md](japanese-read.md) (and the CSV), plus the
  15 lines `check:pending` lists, the new ones above, and the city names for "Where are you flying from?"
  (`src/lib/places.ts`, katakana and kanji, 18f).
- [ ] **FAQ facts**: are children invited (no FAQ says)? Visas only cover Australians (Griffin's side may fly from
  Canada). "We'll delete it a few months after the wedding" still the plan? Pick the date (the suggestion is
  15 Jan 2028); the steps are in [launch.md](launch.md#deleting-the-data-after-the-wedding).
- [ ] **The music**: is there permission from Piano ZeroL for the cover of "A Town With an Ocean View"? If not,
  switch back (README → Music).
- [ ] **Ideas in the lab for their yes**: the "Ask us" FAQ answer box, and the story print shadows and backdrops.
