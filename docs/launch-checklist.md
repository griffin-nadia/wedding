# Launch checklist

A readiness check of the live site on 18 Oct 2026, before real invites go out. Nothing was changed for it (the clear
bugs it found are fixed in the next PR and ticked below). The steps for each item are in `docs/pre-launch.md` and
`apps-script/README.md`.

## Content needed from Nadia and Griffin

`npm run check:pending` lists four placeholders still on the site and 14 Japanese lines waiting for a native read.

- [ ] **Our story words.** Each chapter still shows "We're still writing this part in our own words. Check back
      closer to the day." (`story.chapterBody`). Their words go in the Content tab.
- [ ] **Griffin's kid photo** for the Our story opener (`story.kidGriffin`; a plain paper print until then).
- [ ] **The story photos.** Any photo not yet in shows "A photo to come" (`photo.toCome`).
- [ ] **Who to call on the day** (`contact_day` in the Content tab; FAQs shows a placeholder line until then).
- [ ] **The fortunes.** Twelve omikuji lines, all 大吉 (Nadia's call). Are they confirmed? They're in
      `src/content/en.ts` (FORTUNES), and the sheet's Fortunes tab replaces them when filled. Six of them are
      travel tips, so they need to stay true: ICOCA or Suica, no tipping, the Haruka train at about 75 minutes,
      cash-only shops, luggage delivery, temples calm before 8 am.
- [ ] **A native read of the Japanese.** All 14 lines `check:pending` lists (the reply form, the flying-from field,
      the FAQs, the music credit), and ideally a read of all of `ja.ts`.
- [ ] **FAQ facts to confirm:**
  - Kids: nothing says whether children are invited, so there's no FAQ for it.
  - Visas: the copy only covers Australians. Griffin's side may be flying from Canada.
  - "We'll delete it a few months after the wedding" (the details answer): still the plan?
  - "We'll set the menu a few months before": fine until the menu is set.
- [ ] **Nadia's art still to come** (each is one switch in `src/lib/art.ts` once the file is in): her lettering for
      the names (`names`), the painted map land (`mapLand`), the 600 dpi envelope rescan (same file names), and her
      handwritten sign-off (`public/brand/signoff.svg`).
- [ ] **The music.** "A Town With an Ocean View" (Joe Hisaishi, piano by Piano ZeroL) now plays to every guest.
      The README says `private/` is for songs not cleared yet, and "orange hues" was cleared by its artist. Is
      there permission from Piano ZeroL for this cover? If not, switch back (README → Music, one file and one entry).

## What Jehan does by hand

- [ ] **Real-phone test**, on an iPhone (Safari) and an Android phone (Chrome), the live site. The things headless
      Chromium can't prove:
  - the top bar clears the notch, and stays put on every scroll;
  - the first light / dark switch grows its circle from the sun or moon (the Safari fix from this run);
  - no white flash at the top when swiping or changing tabs, and no stutter scrolling to the end of a page;
  - the reply form: with the keyboard up, Back / Next are at the end of the form and never on the keyboard; with
    only Other ticked, Next is reachable (the iPhone bug from this run); the song search puts the keyboard away;
  - Our story: dragging a print follows the finger and never turns the page;
  - the music: starts after the first tap, stops at once when the phone locks, and Now Playing clears;
  - the envelope, the page swipe and Travel's jump links.
- [ ] **Email queue on from the wedding account** (click by click: [docs/email-queue.md](email-queue.md)): Wedding site menu → Turn on the fast email queue, signed in as the
      wedding account only (`?action=ping` should show `queueAccount: wedding`). Then send one test reply on a test
      household and check it arrives from the wedding address.
- [ ] **Clean the test rows**: Reset test households…, and Clear queued items for test households…, then delete the
      test rows themselves; then load the real guest list into the sheet.
- [ ] **Generate the guest links**: Make tokens + links for new rows (and `npm run qr-cards` for printed cards).
      Send one invite to yourself with Send invites (test, to me only)… before Send invites to everyone.
- [ ] **Make the gates required on `main`** (needs an admin): https://github.com/griffin-nadia/wedding/settings/branches
      → a rule for `main` → Require status checks to pass → `gates`.

## External links (checked from a script, 18 Oct)

- 26 of the 31 fixed links answer (three more are built per address), including the venue, every Google Maps link, all seven Airbnbs, the hotels that answer,
  Smartraveller, Sakura Mobile and the og-image. Google Calendar asks a script to sign in first, as it should.
- [ ] **Broken: JR West's ICOCA & HARUKA page** (`https://www.westjr.co.jp/global/en/ticket/icoca-haruka/`) returns
      404. It needs the new address (JR West's site, not a guess), so it's left for a person.
- [ ] **Check by hand (they refuse scripts, 403, so probably fine in a browser):** the DoubleTree Kyoto Higashiyama
      (Hilton), the JR Pass timetable, Ninja WiFi's SIM page and Travelkon's Japan eSIM page.
- [ ] Google Flights ("Flights to KIX") sends a script to an "unsupported" page; check it opens properly on a phone.

## Titles and the share preview

- Share preview: og-image 1200 × 630 (the seal, the names, "15 October 2027, Kyoto"), og:title "Griffin & Nadia ·
  Kyoto, 15 October 2027", og:description "You're invited.", a large-image card, and the page description. Good.
- Icons and the manifest (name, short name G&N, the paper colour) are right.
- [x] **Page titles**: every page was titled "Griffin & Nadia", so a screen reader heard no change between pages
      (WCAG 2.4.2). Fixed in the next PR: "The day · Griffin & Nadia" and so on.
- [x] **The calendar file**: right times (11:00 am to 3:30 pm Japan time), venue and map, but its long lines weren't
      folded at 75 characters as the iCalendar standard asks. Fixed in the next PR.

## Walking every page (390 and 1440, light and dark)

Nothing unfinished or off-scale on the live pages beyond the placeholders above. Notes:

- The screenshot baselines for Home, The day, Travel and Our story had drifted (inside the 1% tolerance, so never
  rewritten): they still showed the old music line and the old phone credit mark. Refreshed in the next PR.
- Our story's prints are plain paper frames in the plain build until the photos are in; on the live site (with
  `PUBLIC_PHOTOS`) they show.

## Found, not fixed

- WebKit (Safari's engine) couldn't be installed on the work Mac (the download times out), so nothing in this run
  was run in real Safari: the iPhone checks above cover it.
- The broken JR West link and the four links to check by hand (above).
