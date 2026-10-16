# If Google locks it

In October 2026 Google locked the sheets and the reply script for five days. Nothing was lost, but nothing could be read or saved either. This page covers what breaks, how to keep going from the backup copies, and how replies could move to Supabase without touching the site.

No switch-over is planned. This is so we're ready.

## What guests see

The site itself is on GitHub Pages, so it stays up. When the script doesn't answer with its own JSON (Google's page instead, or a request Google blocks while the connection is fine), the site says **"Replies are paused for a moment, try again later."** as a calm note, not an error:

- Opening an invite with nothing saved on the device: a letter with "Replies are paused for a moment", "Try again later." and a Try again button.
- Opening an invite they've opened before: their saved copy shows as usual.
- Sending a reply: the note appears above Send. Their answers stay in the form and in the draft on their device.
- "Can't find your invite?": the same line under the email field.

The site doesn't keep retrying a paused script (three quick retries are only for a busy moment or a dropped connection). The logic is in `src/lib/call.ts`, and `tests/paused.test.ts` covers it.

## What breaks

| Part | While locked |
| --- | --- |
| Opening an invite (first time on a device) | Paused note |
| Sending or changing a reply | Paused note; nothing saved |
| Confirmation emails, invites, reminders | Not sent (they go from the script) |
| Song search | Still works (iTunes straight from the browser); the script fallback doesn't |
| Fortunes, Our story words, who to contact on the day | Built-in fallbacks show (travel tips, Our story hidden, no contact line) |
| Where you're flying from, guests' lines on the map | Not saved; the map shows only Griffin's and Nadia's lines |
| Visit counts | Not counted |
| Crew links (/kit, /lab, Options) | Devices already let in stay in; new ones can't check |
| The planner and Site-Data sheets | Can't be opened or edited |

## Working from the backup copies

The backups are copies of the two sheets kept outside the wedding Gmail, so a lock on that account doesn't reach them. Keep them fresh: after each batch of replies, File → Download → Microsoft Excel (.xlsx) for Site-Data and the planner, saved to a shared folder in another account.

While the lock lasts:

1. **Tell guests nothing unless it runs past a day.** The note already says try later. If it does run on, send the plain message from the planner's Plan tab: reply by email to griffinandnadia@gmail.com (or to Jehan if that inbox is locked too).
2. **Read from the latest backup.** Guests, RSVPs and Log in the .xlsx show who has replied and what they said up to the last download. Answer guest questions from it; don't edit it as the source of truth.
3. **Log replies that arrive by email** in a "While locked" tab of the backup copy: time, household, what changed. Same words as the Log tab ("Sam: coming → can't make it").
4. **When the lock lifts,** check the Log tab for anything saved in the last minutes before the lock, then type the "While locked" rows into the site through each household's own link (or into the Guests and RSVPs tabs by hand, with a Log row each). Then download a fresh backup.

**If it lasts too long to wait** (a week or more, or close to a deadline), the site can point at a new copy:

1. In an account that isn't locked, upload the latest Site-Data .xlsx and open it as a Google Sheet. Add a script to it (Extensions → Apps Script) and paste in `apps-script/Code.gs` and `appsscript.json` from this repo.
2. Run the menu once to approve it, then Deploy → New deployment → Web app (execute as me, anyone can access). This is a new /exec address, so the "never create-deployment" rule doesn't apply here.
3. In GitHub, Settings → Secrets and variables → Actions → Variables, set `VITE_API_URL` to the new address and re-run the Pages deploy. Tokens are in the sheet, so every guest's link keeps working.
4. When the original comes back, copy anything new from the stand-in into it, point `VITE_API_URL` back, and redeploy.

## Moving replies to Supabase (a plan, not a switch)

Goal: the same calls and answers the site uses now, so `src/lib/api.ts` doesn't change. Only `VITE_API_URL` points somewhere new.

**The contract to keep** (from `apps-script/README.md`):

- `GET ?action=household&token=…[&open=1]`, `started`, `content`, `fortunes`, `flying`, `crew`, `check`, `ping`, `songs`
- `POST` as `text/plain` (no CORS preflight): `rsvp`, `resend`, `flying`, `stamps`
- Every answer is JSON with `ok`, and errors use the same codes (`bad_request`, `not_found`, `bad_guest`, `bad_attending`, `bad_date`, `closed`, `busy`, `server`, `bad_email`).

**Shape:**

1. Tables that mirror the tabs: `guests`, `rsvps`, `songs`, `log`, `content`, `crew`. Columns match the sheet headers, so the .xlsx backup imports straight in. Row level security on with no public policies, so only the function can read or write.
2. One Edge Function, `api`, that reads `action` from the query string or the text/plain body and returns the same JSON as `Code.gs`. Port `Code.gs` function by function: the checks, the plus-one rules, the changes lock, the dedupe by reply id and the Log wording.
3. Emails: the confirmation and resend emails through a mail service (Resend or Postmark) from the wedding address. Invites and reminders stay a manual send.
4. Nadia keeps a sheet: a nightly export from Supabase to a Google Sheet (or a CSV download) for reading. Edits go through the site, or straight into the tables.
5. Test against the same 5 test households: `tests/paused.test.ts` plus the RSVP flow in `.brief/tools/rsvp-flow.mjs`, pointed at the function.

**Switching over, if we ever do:** import the latest backup, freeze the sheet (Changes lock or a note in the Emails tab), set `VITE_API_URL` to the function and redeploy. Switching back is the same in reverse.

**Costs and limits:** Supabase's free tier covers this easily. Its free projects pause after a week with no requests, so keep a weekly ping (the same job as the invite-week warm-up).
