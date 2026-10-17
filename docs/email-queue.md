# Email queue on the wedding account

Confirmation emails go out from whoever runs the code that sends them. In October they still came from Jehan's
personal Gmail (the latest on 17 Oct), because the minute trigger that sends the queue was created on his account.

Since 18 Oct the script itself refuses to send from anywhere but `griffinandnadia@gmail.com`:

- The minute trigger (`flushQueue`) still writes replies and visit counts to the sheet whoever owns it, so no reply
  ever waits unsaved, but it **sends no email** unless it runs as the wedding account. From any other account the
  emails stay queued and a clear error is logged (in the script's Executions log, in `?action=ping` as
  `queueError`, and in Wedding site → Check the email queue…).
- The web app never creates the trigger from another account and never sends a confirmation itself from one; it
  holds the email for the wedding account's queue.
- The menu's Send invites, Send a reminder and Final numbers items, a scheduled reminder, and "Email me my link"
  all refuse to send unless they run as the wedding account.

So after these steps every email comes from the wedding account, and until they're done nothing goes out from the
wrong one (confirmations just wait).

## 1. Delete the trigger on Jehan's account

1. Sign in to Google as **Jehan's personal account** (the one emails were coming from).
2. Open https://script.google.com/home/triggers (Apps Script, My Triggers).
3. Find the trigger whose function is **flushQueue** (project: the wedding site script). If you see
   **sendScheduledReminder** there too, it's from the same account: delete it as well and schedule it again from the
   wedding account later if it's still wanted.
4. Click the three dots on its row, then **Delete trigger**, then confirm.

## 2. Create it from the wedding account

1. Sign out, or open a private window, and sign in as **griffinandnadia@gmail.com**.
2. Open the Site-Data sheet (Google Drive, the wedding site's sheet).
3. Menu **Wedding site → Turn on the fast email queue**.
4. Google asks for permission the first time: choose the wedding account, then **Allow**. Keep both boxes ticked:
   "Allow this application to run when you are not present" and "See your primary Google Account email address".
5. The sheet says "The email queue is on, sending from griffinandnadia@gmail.com". If it says "Sign in as the
   wedding account", you're on the wrong account: go back to step 1 of this section.

## 3. Check who the web app runs as

1. Open the web app's ping address: the site's back-end URL (the one in the GitHub secret `VITE_API_URL`) with
   `?action=ping` on the end.
2. Look for `"queueAccount":"wedding"` and `"webAppAccount":"wedding"`, and `"queueError":null`.
3. If `webAppAccount` says `"other"`, the web app was deployed from another account. Signed in as the wedding
   account: Extensions → Apps Script → **Deploy → Manage deployments** → the pencil on the live deployment →
   Version: **New version** → **Deploy**. Keep the same deployment (never "New deployment"), so the address doesn't
   change. Then check the ping again.

## 4. Send one test

1. Open the link for a **test household** (a household named "Test …" or "… (Test)"; never a real one).
2. Reply (any answers) and send.
3. Wait a minute, then Wedding site → **Check the email queue…** should show nothing waiting and "The queue last
   ran as: the wedding account".
4. In the test household's inbox, open the confirmation email ("Your reply for Griffin & Nadia's wedding").
5. Check the sender: in Gmail, click the small arrow under the sender's name ("to me"). **From** must be
   `Griffin & Nadia <griffinandnadia@gmail.com>`. Replying should also go to that address.
6. Then Wedding site → **Reset test households…** to tidy up.
