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
