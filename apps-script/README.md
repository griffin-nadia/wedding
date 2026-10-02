# Back end (Google Sheet + Apps Script)

The script lives in the site data sheet ("Nadia-Griffin-Wedding-Site-Data", owned by the wedding Gmail)
and is pushed from here with clasp. The local `.clasp.json` (gitignored) holds the script ID.

```bash
clasp login                     # as griffinandnadia@gmail.com only
clasp push --force              # replaces the project with Code.gs + appsscript.json
clasp update-deployment <deployment id> -d "what changed"   # same /exec address every time
```

Never use `clasp create-deployment` for updates: it makes a new /exec address and the site would
still point at the old one.

## Sheet menu (Wedding site)

| Item | What it does |
| --- | --- |
| Make tokens + links for new rows | One token and link per household |
| Send invites (test, to me only)… | Up to 5 sample invites to TEST_EMAIL, subject starts [TEST]. Doesn't fill Invite sent |
| Send invites to everyone not yet invited… | Confirms the count, one email per household, fills Invite sent, stops at Gmail's daily limit, lists households with no email so you can text them |
| Resend invite to selected household | Click a cell in their row first |
| Send a reminder to households who haven't replied… | Same confirm pattern |
| Set up the Emails tab | Adds the tab with the invite and reminder wording to edit |
| Check song search (Spotify) | Tells you if the Spotify keys work |
| Reset test households… | Clears answers, songs, Log rows and visits for households named "Test …" or "… (Test)" |

## Script properties (all optional)

`SITE_URL`, `CHANGES_LOCK` (2027-04-30), `REPLY_TO`, `RSVP_BY` (2027-02-15), `TEST_EMAIL`,
`NOTIFY_CHANGES` (`yes` emails REPLY_TO when someone changes from coming to not coming),
`SPOTIFY_CLIENT_ID` + `SPOTIFY_CLIENT_SECRET` (song search; without them guests just type).

## Web app API

| Call | Returns |
| --- | --- |
| `GET ?action=household&token=…[&open=1]` | The household. `open=1` counts a visit |
| `GET ?action=started&token=…` | Records "Started RSVP" once |
| `GET ?action=songs&q=…` | Up to 6 Spotify matches, or `not_configured` |
| `GET ?action=check&token=…` | That household's own saved rows, for testing |
| `POST {action:"rsvp", token, guests, songs, arrival, departure, message}` | `{ok, updated, changes, household}` or `{ok:false, code, error}` |

Error codes: `bad_request`, `not_found`, `bad_guest`, `bad_attending`, `bad_date`, `closed`, `busy`, `server`.

## Notes
- The site POSTs as `text/plain` so the browser skips the CORS preflight Apps Script can't answer.
- Saves run under a script lock, so households saving at once can't clash. Emails go out after the lock.
- Columns are found by header name. Never rename columns or tabs.
- All guest text is stored as plain text (leading `'`), so `=`, `+`, `-`, `@` can't become formulas.
- Gmail sends about 100 emails a day from a consumer account. Invites stop cleanly and pick up next time.
- After `CHANGES_LOCK` saves are refused with a friendly message. Reads still work.
