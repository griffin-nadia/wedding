# Back end (Google Sheet + Apps Script)

1. Make the site data sheet on the wedding Gmail with tabs **Guests, RSVPs, Songs, Log** (headers in
   `../docs/data-model.md`, or copy the template sheet).
2. Extensions → Apps Script. Paste `Code.gs`. Project settings → tick "Show appsscript.json" and paste ours.
3. Project settings → Script properties: `SITE_URL`, `CHANGES_LOCK` (e.g. `2027-04-30`), `REPLY_TO`.
4. Deploy → New deployment → Web app. Execute as **Me**, access **Anyone**. Copy the `/exec` URL.
5. Put the URL in the site's `.env` as `VITE_API_URL` (and in GitHub Actions variables).
6. Back in the sheet: menu **Wedding site → Make tokens + links for new rows**. Each household gets one
   link. Send that link to them.

Notes
- The site POSTs as `text/plain` so the browser skips the CORS preflight Apps Script can't answer.
- Writes are locked (LockService) so two households saving at once can't clash.
- Gmail sends up to about 100 emails a day from a consumer account, plenty for 40 guests.
- After `CHANGES_LOCK` the script refuses edits and the site shows "message Nadia or Griffin".
- Redeploy (Manage deployments → Edit → New version) after changing the script. The URL stays the same.
