# Deploying the back end

The back end (apps-script/) goes live one way only:

```sh
scripts/deploy-apps-script.sh "what changed"
```

It:

1. Checks it's on `main` with nothing uncommitted in apps-script/, then pulls.
2. Runs the scopes check (`node scripts/scopes-check.mjs`, also in `npm test`). The scopes the code needs must match
   `oauthScopes` in apps-script/appsscript.json exactly.
3. Stops if the declared scopes differ from the ones last deployed from this machine (kept in
   `.brief/deployed-scopes.json`, not in the repo). See "A new scope" below.
4. `clasp push --force`, then updates the existing deployment, so the /exec URL never changes. Never
   `create-deployment`.
5. Calls `?action=health` (up to a minute) and fails loudly unless it answers `ok`.

## A new scope

On 19 Oct 2026 every guest link showed "That link doesn't look right" for hours. A push added scopes the wedding
account hadn't approved, so the sheet wouldn't open for the web app or the queue. They both run as the wedding
account. Now:

- A push whose code needs a scope that isn't declared fails the check (and the gates, through `npm test`), with the
  note "new scope: approve it as the wedding account (run health_ once) before deploying".
- Add the scope to `oauthScopes`, merge, then **before deploying**: open the script editor signed in as the wedding
  account, pick `health_` and press Run, and accept the new permission.
- Then `scripts/deploy-apps-script.sh "what changed" --scopes-approved`.

A trigger whose scopes aren't approved can't run at all, so it can't raise its own alarm. That's why UptimeRobot
watches `?action=health` from outside ([monitoring.md](monitoring.md)).

## If health fails after a deploy

- Guests with a copy of their invite from the last 24 hours still see it (read only). Everyone else sees "We're
  having a little trouble, try again in a few minutes", never "That link doesn't look right".
- Open the script editor, then **Executions**, and read the error. A permission error means: sign in as the wedding
  account, run `health_` once, accept.
- To roll back, revert the change on main with a PR, then run the deploy script again.
