// node scripts/scopes-check.mjs: the scopes apps-script/Code.gs needs, from the Google services it calls, against the
// oauthScopes declared in apps-script/appsscript.json. Fails if the code needs one that isn't declared, or one is
// declared that nothing uses. Run 20, after the 19 Oct 2026 outage: a push that quietly needed a new scope stopped
// the sheet opening for hours. A new scope is fine, but the wedding account has to approve it before it's deployed.
import fs from "node:fs"

const S = (s) => `https://www.googleapis.com/auth/${s}`
// What each service call needs. A call matching none of these needs no scope (Properties, Cache, Lock, Utilities…).
const NEEDS = [
  [/\bSpreadsheetApp\.(getActive|openById|openByUrl|flush|getActiveSheet|create)\b/, S("spreadsheets")],
  [/\bSpreadsheetApp\.getUi\b|\bHtmlService\./, S("script.container.ui")],
  [/\bDriveApp\./, S("drive")],
  [/\bMailApp\./, S("script.send_mail")],
  [/\bGmailApp\./, S("gmail.modify")],
  [/\bUrlFetchApp\./, S("script.external_request")],
  [/\bScriptApp\.(newTrigger|getProjectTriggers|deleteTrigger|requireScopes)\b/, S("script.scriptapp")],
  [/\bSession\.getEffectiveUser\(\)\.getEmail\b|\bSession\.getActiveUser\(\)\.getEmail\b/, S("userinfo.email")],
  [/\bCalendarApp\./, S("calendar")],
  [/\bDocumentApp\./, S("documents")],
  [/\bFormApp\./, S("forms")],
]
// Services with a scope this check doesn't know yet: add them to NEEDS rather than guess
const KNOWN_FREE = /^(PropertiesService|CacheService|LockService|Utilities|ContentService|Logger|console|Session)$/
const KNOWN = new Set(["SpreadsheetApp", "HtmlService", "DriveApp", "MailApp", "GmailApp", "UrlFetchApp", "ScriptApp", "CalendarApp", "DocumentApp", "FormApp"])

export function check(code, manifest) {
  const needed = new Set(NEEDS.filter(([re]) => re.test(code)).map(([, s]) => s))
  const declared = new Set(manifest.oauthScopes ?? [])
  const unknown = [...new Set([...code.matchAll(/\b([A-Z][A-Za-z]+App|[A-Z][A-Za-z]+Service)\./g)].map((m) => m[1]))].filter((s) => !KNOWN.has(s) && !KNOWN_FREE.test(s))
  return { missing: [...needed].filter((s) => !declared.has(s)), unused: [...declared].filter((s) => !needed.has(s)), unknown }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const code = fs.readdirSync("apps-script").filter((f) => f.endsWith(".gs")).map((f) => fs.readFileSync(`apps-script/${f}`, "utf8")).join("\n")
  const r = check(code, JSON.parse(fs.readFileSync("apps-script/appsscript.json", "utf8")))
  for (const s of r.missing) console.error(`✖ new scope: ${s}\n  Add it to apps-script/appsscript.json, then approve it as the wedding account (run health_ once in the editor) before deploying (docs/deploy.md).`)
  for (const s of r.unused) console.error(`✖ declared but not used: ${s} (remove it from apps-script/appsscript.json)`)
  for (const s of r.unknown) console.error(`✖ ${s}: this check doesn't know its scope yet; add it to scripts/scopes-check.mjs`)
  if (r.missing.length || r.unused.length || r.unknown.length) process.exit(1)
  console.log(`Scopes match: ${JSON.parse(fs.readFileSync("apps-script/appsscript.json", "utf8")).oauthScopes.length} declared, all used.`)
}
