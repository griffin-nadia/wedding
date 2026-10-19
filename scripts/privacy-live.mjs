// node scripts/privacy-live.mjs <api url>: run 20's public checks against the live back end, after every deploy
// (scripts/deploy-apps-script.sh). Prints only pass/fail lines, never what the back end answered.
// - ?action=ping and ?action=health answer only { ok }
// - a made-up token gets the same answer as any unknown link, and an odd-shaped one too
// - journeys has no city with fewer than 2 households
const url = process.argv[2]
const get = (q) => fetch(`${url}?${q}`).then((r) => r.json())
const checks = [
  ["ping answers only ok", async () => Object.keys(await get("action=ping")).join() === "ok"],
  ["health answers only ok", async () => Object.keys(await get("action=health")).join() === "ok"],
  ["an unknown link reveals nothing", async () => {
    const a = await get("action=household&token=zz" + Math.random().toString(36).slice(2, 10)), b = await get("action=household&token=" + encodeURIComponent("<x>'\"%00"))
    return JSON.stringify(a) === '{"ok":true,"household":null}' && JSON.stringify(b) === JSON.stringify(a)
  }],
  ["journeys: no city with fewer than 2 households", async () => { const j = await get("action=journeys"); return j.ok && Array.isArray(j.cities) && j.cities.every((c) => c.n >= 2) }],
  ["an error answer carries no internals", async () => { const j = await get("action=crew&token=x"); return !/Exception|at \w+ \(|Sheet|@|AKfy/.test(JSON.stringify(j)) }],
]
let bad = 0
for (const [name, run] of checks) { const ok = await run().catch(() => false); if (!ok) bad++; console.log(`${ok ? "pass" : "FAIL"}  ${name}`) }
process.exit(bad ? 1 : 0)
