# Discord notifications (optional)

Every question from the site's Ask us sheet is emailed to griffinandnadia@gmail.com through the wedding account's
queue. That's the default and needs no setup. To have each one posted in a Discord channel as well:

1. In Discord: the channel's settings, Integrations, Webhooks, New Webhook, then Copy Webhook URL.
2. In the Apps Script project (from the guest sheet: Extensions, Apps Script): Project Settings, Script Properties,
   then Add script property. Use `DISCORD_WEBHOOK_URL` as the name and paste the URL as the value. Save.
3. The next question also arrives in that channel. The first time, Google asks the wedding account to allow
   "connect to an external service": allow it.

Never put the URL in the repo, or anywhere else: anyone with it can post to the channel. To turn it off, delete the
property. Apps Script errors from the email queue go to the wedding account by email, and to Discord too while the
property is set (docs/monitoring.md).
