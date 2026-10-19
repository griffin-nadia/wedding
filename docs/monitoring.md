# Monitoring

Two things tell us the site is broken before a guest does: UptimeRobot watching the back end and the site, and the
back end's own error alerts. Both are free and both are off until Jehan sets them up (final run, 18 Oct 2026).

## UptimeRobot (free plan, 5-minute checks)

1. Sign up at https://uptimerobot.com with the wedding account (griffinandnadia@gmail.com), so alerts reach both of
   you.
2. **Monitor 1, the back end.** New monitor → **Keyword**.
   - URL: the back end's address (the GitHub secret `VITE_API_URL`, ending `/exec`) with `?action=health` on the
     end.
   - Keyword: `"ok":true`, alert when the keyword is **not** found.
   - Interval: 5 minutes. Name: "Wedding back end".
   Apps Script answers with a redirect to googleusercontent.com; UptimeRobot follows it, which is what we want.
3. **Monitor 2, the site.** New monitor → **HTTP(s)**: https://griffin-nadia.github.io/wedding/ , 5 minutes. Name:
   "Wedding site".
4. Alert contacts: the wedding account's email. Optional: the UptimeRobot app on Jehan's phone.

Don't add a `?h=` household link to a monitor: that would count visits on a real household.

### What health checks

`GET ?action=health` returns `{ ok, sheet, queueMoving, pending, emailQuota, at }`, with no names, emails or tokens.

- `sheet`: the Site-Data sheet opens and the Guests tab is there.
- `queueMoving`: nothing is waiting in the email queue, or the queue has sent within the last 15 minutes. If it's
  false, the minute trigger has stopped: run **Wedding site → Check the email queue…** from the wedding account
  ([email-queue.md](email-queue.md)).
- `emailQuota`: about how many more emails Gmail allows today (around 100 a day on this account). Doesn't change `ok`;
  it's there to read before a big send.
- `ok` is `sheet && queueMoving`.

`?action=ping` stays as the fuller queue report for setting up the email queue.

## The 15-minute health watch (run 20)

Since the 19 Oct 2026 outage the back end also checks itself: `watchHealth` runs every 15 minutes and alerts at once
(`ALERT_EMAIL`, and Discord if set) when the sheet won't open (`sheet_unreadable`) or the queue has stopped
(`queue_stuck`). The email queue also alerts when it fails 3 runs in a row (`queue_failing`). The wedding account's
own queue turns the watch on the first time it runs, so there's nothing to set up. It can't help if Google stops the
script running at all (unapproved scopes), which is what UptimeRobot is for.

## Error alerts (email and Discord)

When the web app fails a request (a save, a read, the song search) or the minute trigger can't be set up, the back
end sends an alert. Off until a property is set, in Extensions → Apps Script → Project Settings → Script properties:

- `ALERT_EMAIL`: the address to email (the wedding account's own address is fine). Sends only from the wedding
  account, like every other email.
- `DISCORD_WEBHOOK_URL`: the same alerts posted to a Discord channel ([discord.md](discord.md) sets the webhook up;
  Ask us questions use the same one).

At most one alert per kind of error an hour, so a bad minute is one message, not a hundred. An alert carries only the
error's code and message (long runs of letters and digits, like tokens, are cut out), never guest data. The full
detail is in Extensions → Apps Script → **Executions**.

Google also emails the trigger's owner when a time-driven trigger (the minute queue, the weekly backup) fails; leave
that on (Triggers → the trigger → Failure notification settings → Notify me daily).

## Checked without Google

`tests/apps-script.test.ts` runs `health_` and `alert_` with Google's services stubbed: health is `ok` only with the
sheet open and the queue moving; nothing is sent until the properties are set; one alert per kind an hour; no
tokens in what's sent; email only from the wedding account.
