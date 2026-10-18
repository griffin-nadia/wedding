# Prepare for launch

One menu item gets the Site-Data sheet from test mode to the real guest list. It **reports first** and changes
nothing; only a second, explicit step does it, and that step backs up both sheets before touching anything. Nothing is
ever sent by it.

## 1. The report (safe any time)

Site-Data sheet → **Wedding site → Prepare for launch (report only)…**

It lists what run for real would do:

1. Back up the Site-Data sheet and the planner, dated, into the **Wedding backups** Drive folder (made if missing).
2. Clear the test rows: every Guests row whose household is a test one ("Test …" or "… (Test)"), and their rows in
   RSVPs, Songs and Log. Real rows are never counted as test.
3. Reset the visit counts (First opened, Last opened, Opens, Started RSVP) and empty the queue.
4. Copy the planner's **Guest list** tab into Guests: the columns it found (household, first name, last name,
   email, phone, matched by heading), how many guests it would add, and that rows already in Guests (same household
   and first name) are skipped.
5. How many household links it would make, and how many households in all.
6. Households with no email for anyone in them (text these their link).

If something's wrong (no `PLANNER_ID`, no "Guest list" tab, or no name column), it says so under "Can't run yet",
and run for real won't start.

## 2. Run for real (when you say "clean for launch")

Site-Data sheet, signed in as the wedding account → **Wedding site → Prepare for launch: run for real…**

1. It shows the same report and asks you to type **LAUNCH**. Anything else cancels.
2. It makes the two dated backups first. If either fails it stops before changing anything.
3. Then it does steps 2 to 5 above, under the script lock (so a reply saving at that moment waits), and ends with
   the list of households with no email.
4. Then: **Send invites (test, to me only)…** to check one, and **Send invites to everyone not yet invited…**.

To undo: the backups are full copies of both sheets in the Wedding backups folder, named
"Site-Data backup YYYY-MM-DD HHmm" and "Planner backup YYYY-MM-DD HHmm".

## Checked without a sheet

`tests/apps-script.test.ts` runs the planning logic (`planLaunch_`) on made-up rows: the counts it reports, that test
rows are skipped and real ones kept, that planner guests already in Guests aren't added twice, the households with no
email, and that a planner without a usable heading row is reported as a problem rather than guessed at.

## Weekly backup

Every Monday at about 3 am Kyoto time, a dated copy of the Site-Data sheet ("Site-Data weekly YYYY-MM-DD") goes
into the Wedding backups folder, and anything past the newest 8 weekly copies goes to the Drive bin (kept there 30
days, so it can still be restored). Other files in the folder, like the launch backups, are never touched.

Set it up once, from the wedding account:

1. Sign in as **griffinandnadia@gmail.com** and open the Site-Data sheet.
2. **Wedding site → Weekly backup: check (report only)…** shows the folder, how many weekly copies are there, what
   the next run would make and bin, and whether the trigger is on. It changes nothing.
3. **Wedding site → Weekly backup: turn on**. The first time, Google asks for permission (Drive and triggers):
   choose the wedding account and **Allow**. It refuses from any other account, since backups land in the Drive of
   whoever turns it on.
4. Check it later with the same report (Last backup shows the newest copy's name).

To turn it off: Extensions → Apps Script → Triggers (the clock) → the `weeklyBackup` row → three dots → Delete.

## The email quota

The report's last line counts the invite emails (one per guest with an address) against what Gmail allows today
(about 100 a day on this account). With under 100 guests they should fit in a day, but send the invites on a day
nothing else has gone out, and leave room for the confirmations that follow. If they won't fit, the report says
how many days it'll take: **Send invites to everyone not yet invited…** stops at the limit, and running it again the
next day picks up where it stopped. `?action=health` shows `emailQuota` too ([monitoring.md](monitoring.md)).

## Deleting the data after the wedding

The FAQ promises: "We'll delete it a few months after the wedding." The date is Griffin and Nadia's to set; the
suggestion is **15 January 2028** (three months after 15 Oct 2027, after thank-you cards and photos are shared).
Put it in the wedding account's calendar once it's agreed.

What holds guest data, and how each is cleared, in this order:

1. **The site goes quiet first.** Content tab `mode` → `keepsake` (no replies), then a week later take the household
   links down: GitHub → griffin-nadia/wedding → Settings → Pages → Unpublish, or leave the site up without the back
   end (step 3).
2. **Site-Data sheet.** File → Make a copy *only* if they want a keepsake without contact details: delete the Email,
   Phone and Notes columns from the copy first. Then delete the Site-Data sheet itself (Drive → Remove).
3. **The web app.** Extensions → Apps Script → Deploy → Manage deployments → Archive. Triggers → delete
   `flushQueue` and `weeklyBackup`. Project Settings → Script properties → delete them all (the queue's `q:` items
   included).
4. **Backups.** The **Wedding backups** Drive folder (launch backups and weekly copies) → Remove, then **empty the
   Drive bin** (removed files otherwise stay 30 days).
5. **The planner's Guest list** tab: delete the email and phone columns (the rest is theirs to keep).
6. **Email.** The wedding account's Sent folder (invites, confirmations, reminders) and any replies: search
   `from:me subject:(Griffin & Nadia)` and delete, then empty the bin. Alerts and UptimeRobot emails can go too.
7. **Discord.** If the webhook was set up, delete the channel's messages (Ask us questions) and the webhook.
8. **UptimeRobot.** Delete both monitors, or the account.

Not holding guest data: this GitHub repo (it never has: names, emails and photos stay out by rule), GitHub Pages,
and the site's own files. Guests' browsers keep their own link, their city and their stamps in local storage; that's
on their devices and leaves when they clear the site's data.
