#!/bin/zsh
# scripts/deploy-apps-script.sh "what changed" [--scopes-approved]: the only way the back end goes live (docs/deploy.md).
# Fresh main, the scopes check, clasp push, the existing deployment updated (the /exec URL never changes), then
# ?action=health must answer ok, or this fails loudly. Never prints the deployment id.
set -e
cd "$(dirname "$0")/.."
msg="$1"; [ -n "$msg" ] || { echo "usage: scripts/deploy-apps-script.sh \"what changed\" [--scopes-approved]"; exit 1; }
[ "$(git branch --show-current)" = main ] || { echo "✖ deploy from main only"; exit 1; }
[ -z "$(git status --porcelain apps-script)" ] || { echo "✖ apps-script/ has uncommitted changes"; exit 1; }
git pull -q --ff-only origin main
node scripts/scopes-check.mjs
# A scope the wedding account hasn't approved stops every guest link (19 Oct 2026). The scopes last deployed are kept
# on this machine; any change needs the approval first, then --scopes-approved.
seen=.brief/deployed-scopes.json
now=$(node -e 'console.log(JSON.stringify(require("./apps-script/appsscript.json").oauthScopes.sort()))')
if [ -f $seen ] && [ "$(cat $seen)" != "$now" ] && [ "$2" != "--scopes-approved" ]; then
  echo "✖ new scope: approve it as the wedding account (open the script in the editor signed in as the wedding account, run health_ once, accept) before deploying, then run this again with --scopes-approved"
  node -e 'const a=JSON.parse(process.argv[1]),b=JSON.parse(process.argv[2]);for(const s of b)if(!a.includes(s))console.log("  + "+s);for(const s of a)if(!b.includes(s))console.log("  - "+s)' "$(cat $seen)" "$now"
  exit 1
fi
npx clasp push --force >/dev/null
dep=${APPS_SCRIPT_DEPLOYMENT:-$(npx clasp list-deployments | grep -v "@HEAD" | grep -oE "AKfy[A-Za-z0-9_-]+ @[0-9]+" | sort -t@ -k2 -n | tail -1 | cut -d" " -f1)}
[ -n "$dep" ] || { echo "✖ no existing deployment found"; exit 1; }
npx clasp update-deployment "$dep" -d "$msg" | grep -oE "@[0-9]+" | sed 's/^/deployed version /'
url=${VITE_API_URL:-$(GH_TOKEN=$(gh auth token --user JehanBaguley) gh variable get VITE_API_URL -R griffin-nadia/wedding)}
for i in 1 2 3 4 5 6; do
  out=$(node -e 'fetch(process.argv[1]+"?action=health"+(process.env.HEALTH_KEY?"&key="+process.env.HEALTH_KEY:"")).then(r=>r.json()).then(j=>console.log(j.ok===true&&j.sheet!==false?"ok":"bad "+JSON.stringify({ok:j.ok,sheet:j.sheet}))).catch(e=>console.log("bad "+e.message))' "$url")
  if [ "$out" = ok ]; then
    echo "✓ health ok"; echo "$now" > $seen
    # The new version can take a few seconds to answer everywhere, so one more try before failing
    node scripts/privacy-live.mjs "$url" >/dev/null || sleep 20
    node scripts/privacy-live.mjs "$url" || { echo "✖ a public answer says more than it should (above)"; exit 3; }
    exit 0
  fi
  sleep 10
done
echo "✖✖ HEALTH FAILED after deploying: $out"
echo "   Guests may be seeing \"We're having a little trouble\". Check Executions in the Apps Script editor; if it's a"
echo "   permission error, approve as the wedding account (run health_ once). docs/deploy.md has the steps."
exit 2
