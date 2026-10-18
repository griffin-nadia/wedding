/**
 * Griffin & Nadia wedding site: back end.
 *
 * Lives in the site data Google Sheet (owned by the wedding Gmail) and is pushed with clasp.
 * Deployed as a web app (Execute as: Me, Who has access: Anyone). The /exec URL is the site's
 * VITE_API_URL. Redeploy to the same deployment so the address never changes.
 *
 * Tabs it expects (see docs/data-model.md). Columns are found by header name, never position:
 *   Guests   one row per person, grouped into households by Token
 *   RSVPs    one row per household (written by the site)
 *   Songs    one row per song pick (written by the site)
 *   Log      every submission and send, in plain words (written by the site)
 *   Emails   invite and reminder wording (created by the menu, edited by Nadia)
 *   Content  fortunes, Our story chapters and the site mode (created by the menu, edited by Nadia)
 *   Crew     four crew links for /kit and /lab (created by "Make crew links"; no guest data)
 *   Questions  Ask us questions and their answers (created on the first question)
 *   Summary, How to update  ours; the tidy adds the To look at box and "Your weekly 5 minutes"
 *   Archive  rows and columns the tidy moved out of other tabs (never deleted; docs/sheets.md)
 *
 * Visit counts (privacy first, only in this sheet: no cookies, IP addresses or third parties) go in
 * columns added at the END of Guests: First opened, Last opened, Opens, Started RSVP.
 * Repeat opens within 10 minutes aren't counted.
 *
 * Speed: households are cached for 6 hours (cleared on save and on any edit in the sheet). Visit
 * counts and confirmation emails are queued and sent by a 1-minute trigger (flushQueue), so guests
 * never wait on Gmail or extra sheet writes. If the trigger can't be set up, emails send inline.
 *
 * Script properties (Project settings > Script properties) override these defaults:
 *   SITE_URL        https://griffin-nadia.github.io/wedding
 *   CHANGES_LOCK    2027-04-30  (after this date the site refuses edits)
 *   REPLY_TO        griffinandnadia@gmail.com
 *   RSVP_BY         2027-02-15
 *   TEST_EMAIL      where test invites go (asked for the first time you send a test)
 *   NOTIFY_CHANGES  "yes" to email REPLY_TO when someone changes from coming to not coming
 *   RESEND_LIVE     "yes" to let "Can't find your invite?" email real guests (test households only until then)
 *   PLANNER_ID      the planner sheet's ID, so Travel can read its Accommodation Options tab (kept out of the repo)
 *   REMINDER_AT     when the gentle reminder goes, e.g. 2027-02-01T10:00:00+11:00 (off until you turn it on)
 *   SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET   optional: Spotify for song search (needs a Premium
 *                   app owner). Without them, or if Spotify says no, search uses iTunes.
 */

// The couple's names, once. Swapping the order is this one line (and COUPLE in src/content/en.ts).
const FIRST = "Griffin"
const SECOND = "Nadia"
const COUPLE = FIRST + " & " + SECOND

const TABS = { guests: "Guests", rsvps: "RSVPs", songs: "Songs", log: "Log", emails: "Emails", questions: "Questions" }

const DEFAULTS = {
  SITE_URL: "https://griffin-nadia.github.io/wedding",
  CHANGES_LOCK: "2027-04-30",
  REPLY_TO: "griffinandnadia@gmail.com",
  RSVP_BY: "2027-02-15",
  TEST_EMAIL: "",
  NOTIFY_CHANGES: "no",
}

const WEDDING = {
  date: "Fri 15 Oct 2027, 11:00 am Japan time",
  venue: "The Sodoh Higashiyama, Kyoto",
}

const DATE_RANGE = { from: "2027-09-01", to: "2027-11-30" }

const MAX = { name: 40, dietary: 200, song: 200, message: 2000, songs: 2, payload: 5000 } // two songs, as the form (18f, run 19)

// A guest row whose First name is one of these is a plus one the household can name.
const PLUS_ONE = /^(guest|plus one|\+1)$/i

const VISITS = ["First opened", "Last opened", "Opens", "Started RSVP"]
const CACHE_SECONDS = 6 * 60 * 60

// Invite week: ping the web app every 15 minutes so the first guests don't hit a cold start.
const WARM = { from: "2026-10-15T00:00:00+11:00", to: "2026-10-23T00:00:00+11:00", url: "https://script.google.com/macros/s/AKfycbxkbvJ9oRlafnzMYY-iBGKeC-0u9TP85jUzPeRtHIAnXs7aNspQRciOagH9FKzHhWIbZw/exec" }
const REPEAT_OPEN_MS = 10 * 60 * 1000

// Test sends stop after this many households, so a test never eats the day's email quota.
const TEST_SAMPLE = 5

const ERRORS = {
  bad_request: "Something was missing from that RSVP. Please try again.",
  not_found: "We couldn't find this invite.",
  bad_guest: "That RSVP included someone who isn't in this household.",
  bad_attending: "Please choose coming or can't make it for each person.",
  bad_date: "Please check your dates: between 1 Sep and 30 Nov 2027, and leaving on or after arriving.",
  closed: "Changes are closed now. Please message " + FIRST + " or " + SECOND + ".",
  busy: "Lots of people are replying right now. Please try again in a minute.",
  server: "Something went wrong saving that. Please try again.",
  read_failed: "We couldn't load your invite just now. Please try again.",
  bad_email: "That doesn't look like an email address.",
  search_failed: "Song search isn't working right now. Just type the song instead.",
}

// Where a reply can still be changed: until the lock, then their "life happens" line (planner, 7 to 11 Oct)
function changeLine_() {
  return isLocked_()
    ? "We know that life happens, so if you need to make any changes after the 30th of April please contact us directly."
    : "You can change your reply until " + longDate_(prop_("CHANGES_LOCK")) + "."
}

// Invite and reminder wording. The Emails tab overrides these, so Nadia can edit without code.
// {household}, {rsvp_by}, {lock}, {date} and {venue} are filled in when sending.
const COPY = {
  invite_subject: "You're invited: " + COUPLE + ", Kyoto, Fri 15 Oct 2027",
  invite_heading: "You're invited",
  invite_body:
    "Hi {household},\n\nWe're getting married in Kyoto and we'd love you to be there.\n\nYour invite page has everything: the day, travel tips and your RSVP. Please RSVP by {rsvp_by}.",
  invite_button: "Open your invite",
  reminder_subject: "A quick reminder to RSVP: " + COUPLE,
  reminder_heading: "Can you make it?",
  reminder_body:
    "Hi {household},\n\nJust a friendly nudge to RSVP for our wedding in Kyoto. It only takes a minute.\n\nPlease RSVP by {rsvp_by}.",
  reminder_button: "RSVP now",
  final_subject: "Final numbers soon: " + COUPLE + ", Kyoto",
  final_heading: "Is your reply still right?",
  final_body:
    "Hi {household},\n\nWe send final numbers to the venue soon. If anything's changed (who's coming, food, or your travel dates), you can update your reply until {lock}.\n\nAfter that, message us directly.",
  final_button: "Check your reply",
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Wedding site")
    .addItem("Make tokens + links for new rows", "makeTokensAndLinks")
    .addSeparator()
    .addItem("Send invites (test, to me only)…", "sendInvitesTest")
    .addItem("Send invites to everyone not yet invited…", "sendInvitesAll")
    .addItem("Resend invite to selected household", "resendInviteSelected")
    .addItem("Send a reminder to households who haven't replied…", "sendReminders")
    .addItem("Send the \"Final numbers soon\" note to households coming…", "sendFinalNumbers")
    .addSeparator()
    .addItem("Set up the Emails tab", "setupEmailsTab")
    .addItem("Set up the Content tab (fortunes)", "setupContentTab")
    .addItem("Check song search", "checkSongSearch")
    .addItem("Turn on the fast email queue", "setupQueue")
    .addItem("Check the email queue…", "checkQueue")
    .addItem("Clear queued items for test households…", "clearTestQueue")
    .addItem("Reset test households…", "resetTestHouseholds")
    .addItem("Make crew links", "makeCrewLinks")
    .addSeparator()
    .addItem("Prepare for launch (report only)…", "prepareForLaunch")
    .addItem("Prepare for launch: run for real…", "prepareForLaunchForReal")
    .addSeparator()
    .addItem("Weekly backup: check (report only)…", "weeklyBackupCheck")
    .addItem("Weekly backup: turn on", "setupWeeklyBackup")
    .addItem("Name order: find and fix \"Nadia & Griffin\"…", "fixNameOrder")
    .addSeparator()
    .addItem("Schedule the February reminder…", "scheduleReminder")
    .addItem("Cancel the February reminder", "cancelReminder")
    .addSeparator()
    .addItem("Tidy the sheets (report)", "tidySheets")
    .addItem("Tidy the sheets: do it", "tidySheetsForReal")
    .addItem("Refresh the To look at box", "refreshLookAt")
    .addToUi()
  // Once the tidy has added it, the Summary's To look at box is fresh every time the sheet opens
  safely_(() => refreshLookAt_(false))
}

/**
 * The names go Griffin & Nadia everywhere. Text typed into the sheet (the Summary tab's heading, the Emails tab's
 * wording, anything else) doesn't follow COUPLE, so this finds "Nadia & Griffin" / "Nadia and Griffin" in every tab,
 * lists each cell, and only changes them if you say yes. Formulas are left alone (listed, not changed).
 */
function fixNameOrder() {
  const ui = SpreadsheetApp.getUi()
  const wrong = /Nadia\s*(&|and|＆)\s*Griffin/g
  const hits = []
  SpreadsheetApp.getActive().getSheets().forEach((sh) => {
    const range = sh.getDataRange(), values = range.getValues(), formulas = range.getFormulas()
    values.forEach((row, r) => row.forEach((v, c) => {
      if (typeof v === "string" && v.match(wrong)) hits.push({ sh: sh, r: r + 1, c: c + 1, v: v, formula: Boolean(formulas[r][c]) })
    }))
  })
  if (!hits.length) return ui.alert("Name order", "Nothing says \"Nadia & Griffin\" any more. All Griffin & Nadia.", ui.ButtonSet.OK)
  const list = hits.slice(0, 30).map((h) => h.sh.getName() + "!" + h.sh.getRange(h.r, h.c).getA1Notation() + (h.formula ? " (formula, left alone)" : "") + ": " + h.v.slice(0, 60)).join("\n")
  const text = hits.length + " cell(s) say Nadia before Griffin:\n\n" + list + (hits.length > 30 ? "\n…" : "") + "\n\nChange them to Griffin & Nadia (the same joining word: & or and)?"
  if (ui.alert("Name order", text, ui.ButtonSet.YES_NO) !== ui.Button.YES) return
  let n = 0
  hits.filter((h) => !h.formula).forEach((h) => { h.sh.getRange(h.r, h.c).setValue(h.v.replace(wrong, (m, j) => "Griffin " + j + " Nadia")); n++ })
  ui.alert("Name order", "Changed " + n + " cell(s).", ui.ButtonSet.OK)
}

// ---------- prepare for launch (a report by default; "run for real" backs up both sheets first) ----------

const BACKUP_FOLDER = "Wedding backups"

/** Reads the planner's Guest list tab: the header row (the first with a name-like heading) and how its columns map. */
function plannerGuestColumns_(values) {
  const at = values.findIndex((r) => r.some((c) => /^(first ?name|name|full name|guest(s| name)?|household|party)$/i.test(String(c).trim())))
  if (at < 0) return { at: -1, map: {}, headers: [] }
  const headers = values[at].map((c) => String(c).trim())
  const map = {}
  headers.forEach((h, i) => {
    const low = h.toLowerCase()
    if (map.household == null && /household|party|group|invite name|family/.test(low)) map.household = i
    else if (map.first == null && /^(first( ?name)?|given( name)?)$/.test(low)) map.first = i
    else if (map.last == null && /^(last( ?name)?|surname|family name)$/.test(low)) map.last = i
    else if (map.name == null && /^(name|full name|guest( name)?|guests)$/.test(low)) map.name = i
    else if (map.email == null && /e-?mail/.test(low)) map.email = i
    else if (map.phone == null && /phone|mobile/.test(low)) map.phone = i
  })
  return { at: at, map: map, headers: headers }
}

/**
 * What "Prepare for launch" would do, from plain rows (so it can be checked without a sheet). siteGuests: the Guests
 * tab as objects; tabs: { RSVPs, Songs, Log } as objects; planner: the Guest list tab's raw values; queueKeys: the
 * script properties' keys. Returns counts and lists only; nothing is changed.
 */
function planLaunch_(siteGuests, tabs, planner, queueKeys) {
  const isTest = (h) => TEST_HOUSEHOLD.test(String(h || ""))
  const testTokens = {}
  siteGuests.forEach((g) => { if (isTest(g.Household) && g.Token) testTokens[g.Token] = true })
  const clear = { Guests: siteGuests.filter((g) => isTest(g.Household)).length }
  Object.keys(tabs).forEach((t) => (clear[t] = tabs[t].filter((r) => testTokens[r.Token]).length))
  const kept = siteGuests.filter((g) => !isTest(g.Household) && (g.Household || g["First name"]))
  const visits = kept.reduce((n, g) => n + VISITS.filter((k) => g[k] !== "" && g[k] != null).length, 0)
  const cols = plannerGuestColumns_(planner)
  const problems = []
  if (cols.at < 0) problems.push("The planner's Guest list tab has no header row with a name column (Name, First name, Guest or Household).")
  else if (cols.map.first == null && cols.map.name == null) problems.push("The Guest list has no first-name or name column.")
  const add = []
  if (!problems.length) {
    const have = {}
    kept.forEach((g) => (have[(String(g.Household) + "|" + String(g["First name"])).toLowerCase()] = true))
    planner.slice(cols.at + 1).forEach((r) => {
      const cell = (k) => (cols.map[k] == null ? "" : String(r[cols.map[k]] == null ? "" : r[cols.map[k]]).trim())
      let first = cell("first"), last = cell("last")
      if (!first && cell("name")) { const parts = cell("name").split(/\s+/); first = parts[0]; last = last || parts.slice(1).join(" ") }
      if (!first) return
      const household = cell("household") || [first, last].filter(Boolean).join(" ")
      if (isTest(household)) return
      if (have[(household + "|" + first).toLowerCase()]) return
      have[(household + "|" + first).toLowerCase()] = true
      add.push({ household: household, first: first, last: last, email: cell("email"), phone: cell("phone") })
    })
  }
  // Households (kept plus added) with no email for anyone in them
  const emails = {}
  kept.forEach((g) => { emails[g.Household] = emails[g.Household] || Boolean(String(g.Email || "").trim()) })
  add.forEach((g) => { emails[g.household] = emails[g.household] || Boolean(g.email) })
  const noEmail = Object.keys(emails).filter((h) => !emails[h]).sort()
  const households = Object.keys(emails).length
  const needLinks = kept.filter((g) => !g.Token).length + add.length
  // Invite emails, one per guest with an address (Gmail's daily limit is per address)
  const inviteEmails = kept.filter((g) => String(g.Email || "").trim()).length + add.filter((g) => g.email).length
  return { clear: clear, kept: kept.length, visits: visits, inviteEmails: inviteEmails, queue: queueKeys.filter((k) => k.indexOf("q:") === 0).length, columns: cols.headers.length ? Object.keys(cols.map).map((k) => k + " ← " + cols.headers[cols.map[k]]) : [], add: add, households: households, needLinks: needLinks, noEmail: noEmail, problems: problems }
}

function launchPlanNow_() {
  const tabs = {}
  ;[TABS.rsvps, TABS.songs, TABS.log].forEach((t) => (tabs[t] = rows_(t)))
  const id = prop_("PLANNER_ID")
  const tab = id ? SpreadsheetApp.openById(id).getSheetByName("Guest list") : null
  const planner = tab ? tab.getDataRange().getValues() : []
  const plan = planLaunch_(rows_(TABS.guests), tabs, planner, Object.keys(PropertiesService.getScriptProperties().getProperties()))
  try { plan.quota = MailApp.getRemainingDailyQuota() } catch (err) { plan.quota = null }
  if (!id) plan.problems.push("PLANNER_ID isn't set (Project Settings → Script properties).")
  else if (!tab) plan.problems.push("The planner has no tab called \"Guest list\".")
  return plan
}

function launchReport_(plan, real) {
  const folder = DriveApp.getFoldersByName(BACKUP_FOLDER).hasNext() ? "the " + BACKUP_FOLDER + " folder" : "a new " + BACKUP_FOLDER + " folder"
  return (real ? "This will:\n" : "Report only. Nothing has been changed. Run for real would:\n") +
    "\n1. Back up the Site-Data sheet and the planner into " + folder + ", dated." +
    "\n2. Clear test rows: Guests " + plan.clear.Guests + ", RSVPs " + (plan.clear[TABS.rsvps] || 0) + ", Songs " + (plan.clear[TABS.songs] || 0) + ", Log " + (plan.clear[TABS.log] || 0) + "." +
    "\n3. Reset " + plan.visits + " visit count cell(s) and " + plan.queue + " queued item(s)." +
    "\n4. Copy " + plan.add.length + " guest(s) from the planner's Guest list into Guests (" + plan.kept + " real row(s) already there are kept; matches by household and first name are skipped)." +
    (plan.columns.length ? "\n   Columns: " + plan.columns.join(", ") + "." : "") +
    "\n5. Make " + plan.needLinks + " household link(s) (" + plan.households + " households in all)." +
    "\n6. Households with no email: " + (plan.noEmail.length ? plan.noEmail.length + "\n   " + plan.noEmail.join("\n   ") : "none") +
    "\n7. " + quotaLine_(plan.inviteEmails, plan.quota) +
    (plan.problems.length ? "\n\nCan't run yet:\n  " + plan.problems.join("\n  ") : "")
}

/** The email quota guard (final run N): will the invites fit in what Gmail allows today? Never sends anything. */
function quotaLine_(emails, quota) {
  const line = "Invite emails: " + emails + " (one per guest with an address)."
  if (quota == null) return line + " Couldn't read today's Gmail limit; check it from the wedding account."
  if (emails <= quota) return line + " Gmail allows about " + quota + " more today, so they fit."
  return line + " Gmail allows about " + quota + " more today, so they won't all fit. Send invites stops at the limit; run it again tomorrow and it picks up where it stopped (about " + Math.ceil(emails / Math.max(1, quota)) + " days). Leave room for confirmations."
}

/** Wedding site → Prepare for launch (report only): what run for real would do. Changes nothing. */
function prepareForLaunch() {
  const ui = SpreadsheetApp.getUi()
  ui.alert("Prepare for launch", launchReport_(launchPlanNow_(), false), ui.ButtonSet.OK)
}

/** Dated copies of a spreadsheet in the backups folder (made if missing). Returns the copy's name. */
function backupSpreadsheet_(id, label) {
  const folders = DriveApp.getFoldersByName(BACKUP_FOLDER)
  const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(BACKUP_FOLDER)
  const name = label + " backup " + Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyy-MM-dd HHmm")
  DriveApp.getFileById(id).makeCopy(name, folder)
  return name
}

/**
 * Wedding site → Prepare for launch: run for real. Shows the same report, then asks you to type LAUNCH. Backs up both
 * sheets first; stops if either backup fails. Never sends anything.
 */
function prepareForLaunchForReal() {
  const ui = SpreadsheetApp.getUi()
  const plan = launchPlanNow_()
  if (plan.problems.length) return ui.alert("Prepare for launch", launchReport_(plan, true), ui.ButtonSet.OK)
  const ok = ui.prompt("Prepare for launch: run for real", launchReport_(plan, true) + "\n\nType LAUNCH to go ahead.", ui.ButtonSet.OK_CANCEL)
  if (ok.getSelectedButton() !== ui.Button.OK || ok.getResponseText().trim() !== "LAUNCH") return ui.alert("Nothing changed.")
  let backups
  try { backups = [backupSpreadsheet_(SpreadsheetApp.getActive().getId(), "Site-Data"), backupSpreadsheet_(prop_("PLANNER_ID"), "Planner")] }
  catch (err) { return ui.alert("Stopped before changing anything: a backup failed (" + err + ").") }
  const lock = LockService.getScriptLock()
  if (!lock.tryLock(30000)) return ui.alert("Busy (a reply is saving). Try again in a minute. Backups made: " + backups.join(", "))
  try {
    // 2. Test households and everything of theirs
    const tokens = rows_(TABS.guests).filter((g) => TEST_HOUSEHOLD.test(String(g.Household || "")) && g.Token).map((g) => String(g.Token))
    if (tokens.length) resetHouseholds_(tokens)
    const g = sheet_(TABS.guests)
    let head = headers_(g)
    const data = g.getDataRange().getValues()
    for (let i = data.length - 1; i >= 1; i--) if (TEST_HOUSEHOLD.test(String(data[i][head.Household] || ""))) g.deleteRow(i + 1)
    // 3. Visit counts and the queue
    head = ensureVisitColumns_(g)
    if (g.getLastRow() > 1) VISITS.forEach((k) => g.getRange(2, head[k] + 1, g.getLastRow() - 1, 1).clearContent())
    const props = PropertiesService.getScriptProperties()
    Object.keys(props.getProperties()).filter((k) => k.indexOf("q:") === 0).forEach((k) => props.deleteProperty(k))
    // 4. The planner's guests, appended with fresh Guest IDs
    const ids = rows_(TABS.guests).map((r) => Number(String(r["Guest ID"] || "").replace(/\D/g, "")) || 0)
    let next = Math.max(0, ...ids) + 1
    const width = g.getLastColumn()
    const rows = plan.add.map((p) => {
      const r = new Array(width).fill("")
      const set = (k, v) => { if (k in head) r[head[k]] = v }
      set("Household", p.household); set("Guest ID", "g" + String(next++).padStart(3, "0")); set("First name", p.first)
      set("Last name", p.last); set("Email", p.email); set("Phone", p.phone)
      return r
    })
    if (rows.length) g.getRange(g.getLastRow() + 1, 1, rows.length, width).setValues(rows)
    SpreadsheetApp.flush()
    // 5. Links
    makeTokensAndLinks()
    forgetAllHouseholds_()
  } finally {
    lock.releaseLock()
  }
  ui.alert("Prepare for launch", "Done. Backups: " + backups.join(", ") + ".\n\nHouseholds with no email (text them their link): " + (plan.noEmail.join(", ") || "none") + ".\n\nNothing was sent. Next: Send invites (test, to me only)…, then to everyone.", ui.ButtonSet.OK)
}

// ---------- weekly backup (a dated copy of Site-Data every week, the newest 8 kept) ----------

const WEEKLY_PREFIX = "Site-Data weekly "
const WEEKLY_KEEP = 8

/** Which backups to bin: only ours (the prefix), oldest first, beyond the newest `keep`. Pure, so it can be checked. */
function backupsToTrash_(files, prefix, keep) {
  return files.filter((f) => f.name.indexOf(prefix) === 0).sort((a, b) => b.created - a.created).slice(keep)
}

function backupFolder_(make) {
  const it = DriveApp.getFoldersByName(BACKUP_FOLDER)
  return it.hasNext() ? it.next() : make ? DriveApp.createFolder(BACKUP_FOLDER) : null
}

function weeklyFiles_(folder) {
  const out = []
  if (!folder) return out
  const it = folder.getFiles()
  while (it.hasNext()) { const f = it.next(); out.push({ name: f.getName(), created: f.getDateCreated().getTime(), file: f }) }
  return out
}

/** The weekly trigger: a dated copy of this sheet in Wedding backups, then anything past the newest 8 goes to the bin. */
function weeklyBackup() {
  const folder = backupFolder_(true)
  const name = WEEKLY_PREFIX + Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyy-MM-dd")
  DriveApp.getFileById(SpreadsheetApp.getActive().getId()).makeCopy(name, folder)
  // The bin keeps them 30 days, so a backup binned by mistake can still be restored
  backupsToTrash_(weeklyFiles_(folder), WEEKLY_PREFIX, WEEKLY_KEEP).forEach((f) => f.file.setTrashed(true))
  PropertiesService.getScriptProperties().setProperty("last_weekly_backup", name)
}

/** Report only: what the next weekly backup would make and bin, and whether the trigger is on. Changes nothing. */
function weeklyBackupCheck() {
  const ui = SpreadsheetApp.getUi()
  const folder = backupFolder_(false)
  const files = weeklyFiles_(folder)
  const ours = files.filter((f) => f.name.indexOf(WEEKLY_PREFIX) === 0).length
  // The next run adds one, so the bin gets what's past the newest (keep - 1) now
  const bin = backupsToTrash_(files, WEEKLY_PREFIX, WEEKLY_KEEP - 1)
  const trigger = ScriptApp.getProjectTriggers().some((t) => t.getHandlerFunction() === "weeklyBackup")
  ui.alert("Weekly backup", "Report only. Nothing has been changed.\n\nFolder: " + (folder ? BACKUP_FOLDER : BACKUP_FOLDER + " (doesn't exist yet: the first backup makes it)") +
    "\nWeekly backups there now: " + ours + " (the newest " + WEEKLY_KEEP + " are kept)" +
    "\nNext backup: " + WEEKLY_PREFIX + Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyy-MM-dd") +
    "\nIt would bin: " + (bin.length ? bin.map((f) => f.name).join(", ") : "nothing") +
    "\nOther files in the folder (never touched): " + (files.length - ours) +
    "\nWeekly trigger: " + (trigger ? "on, from this account" : "not on from this account") +
    "\nLast backup: " + (PropertiesService.getScriptProperties().getProperty("last_weekly_backup") || "none yet"), ui.ButtonSet.OK)
}

/** Turns the weekly trigger on (Mondays about 3 am Kyoto time), from the wedding account only. Replaces any old one. */
function setupWeeklyBackup() {
  const ui = SpreadsheetApp.getUi()
  if (!isWeddingAccount_()) return ui.alert("Sign in as the wedding account", "Backups go in the Drive of whoever turns this on, so open this sheet signed in as " + prop_("REPLY_TO") + " and try again.", ui.ButtonSet.OK)
  ScriptApp.getProjectTriggers().filter((t) => t.getHandlerFunction() === "weeklyBackup").forEach((t) => ScriptApp.deleteTrigger(t))
  ScriptApp.newTrigger("weeklyBackup").timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(3).inTimezone("Asia/Tokyo").create()
  ui.alert("Weekly backup is on: every Monday about 3 am Kyoto time, a dated copy of this sheet in " + BACKUP_FOLDER + ", the newest " + WEEKLY_KEEP + " kept.")
}

// ---------- web app ----------

function doGet(e) {
  const p = (e && e.parameter) || {}
  const action = String(p.action || "").toLowerCase()
  try {
    if (action === "household") {
      const h = cachedHousehold_(p.token)
      if (h && p.open === "1") safely_(() => enqueue_("open", h.token))
      return json_({ ok: true, household: h })
    }
    if (action === "flying") return json_(flyingCounts_())
    if (action === "questions") return json_(publishedQuestions_())
    if (action === "journeys") return json_(journeys_())
    if (action === "fortunes") return json_({ ok: true, fortunes: fortunes_() })
    if (action === "stay") return json_(stayPicks_())
    if (action === "content") return json_(content_())
    if (action === "crew") return json_(crew_(p.token))
    if (action === "ping") {
      // Health check: is the minute trigger set up? (No guest data here.)
      const props = PropertiesService.getScriptProperties()
      const pending = Object.keys(props.getProperties()).filter((k) => k.indexOf("q:") === 0).length
      let trigger = null
      try { trigger = hasFlushTrigger_() } catch (err) { trigger = null }
      const lastAt = Number(props.getProperty("last_flush_at") || 0)
      return json_({ ok: true, queue: props.getProperty("flush_trigger") === "1", trigger: trigger, pending: pending, kinds: queueKinds_(), queueAccount: props.getProperty("queue_account") || "unknown", webAppAccount: isWeddingAccount_() ? "wedding" : "other", queueError: CacheService.getScriptCache().get("queue_err") || null, lastTestSend: props.getProperty("last_test_send"), triggerError: CacheService.getScriptCache().get("trigger_err") || null, lastFlush: lastAt ? new Date(lastAt).toISOString() : CacheService.getScriptCache().get("last_flush") || null })
    }
    if (action === "health") return json_(health_())
    if (action === "songs") return json_(searchSongs_(p.q, String(p.token || "").trim()))
    if (action === "started") {
      const token = String(p.token || "").trim()
      if (cachedHousehold_(token)) safely_(() => enqueue_("started", token))
      return json_({ ok: true })
    }
    if (action === "check") return json_(check_(p.token))
    return json_({ ok: true, service: "nadia-griffin-wedding" })
  } catch (err) {
    return fail_(action === "songs" ? "search_failed" : "read_failed", err)
  }
}

function doPost(e) {
  let body
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || "")
  } catch (err) {
    return fail_("bad_request")
  }
  if (body && body.action === "resend") return json_(resendLink_(body.email))
  if (body && body.action === "ask") return json_(ask_(body))
  if (body && body.action === "flying") return json_(setFlying_(body.token, body.city))
  if (body && body.action === "stamps") return json_(setStamps_(body.token, body.stamps))
  if (!body || typeof body !== "object" || body.action !== "rsvp") return fail_("bad_request")
  if (isLocked_()) return fail_("closed")

  // The site sends one id per reply (kept across retries), so a retry never saves twice.
  const idem = String(body.id || "").replace(/[^\w-]/g, "").slice(0, 64)
  const cache = CacheService.getScriptCache()
  if (idem) {
    const seen = cache.get("idem:" + idem)
    if (seen) return ContentService.createTextOutput(seen).setMimeType(ContentService.MimeType.JSON)
  }
  const remember = (out) => {
    // Only successful saves are remembered; a "busy" or error answer must stay retryable
    if (idem && out.getContent().startsWith('{"ok":true')) safely_(() => cache.put("idem:" + idem, out.getContent(), 21600))
    return out
  }
  if (flushTriggerReady_()) return remember(fastSave_(body))

  const lock = LockService.getScriptLock()
  if (!lock.tryLock(30000)) return fail_("busy")
  let before, after, changes, queued
  try {
    before = getHousehold_(body.token)
    if (!before) return fail_("not_found")
    const input = validate_(before, body)
    if (input.error) return fail_(input.error)
    saveRsvp_(before, input)
    SpreadsheetApp.flush()
    after = getHousehold_(before.token)
    changes = describeChanges_(before, after)
    log_(after.displayName, after.token, changes.join("\n"), JSON.stringify(input), after)
    SpreadsheetApp.flush()
    forgetHousehold_(after.token)
    queued = queueMail_(before, after, changes)
  } catch (err) {
    return fail_("server", err)
  } finally {
    lock.releaseLock()
  }

  // No trigger to send queued mail (not authorised yet): send now, after the lock is released.
  const updated = Boolean(before.respondedAt)
  if (!queued) {
    if (isWeddingAccount_()) {
      safely_(() => sendConfirmation_(after, updated ? changes : null))
      safely_(() => notifyDropped_(after.displayName, droppedNames_(before, after)))
    } else {
      wrongAccount_("The web app")
      holdMail_(after.token, updated, updated ? changes : ["No changes"], droppedNames_(before, after))
    }
  }
  return remember(json_({ ok: true, updated: updated, changes: changes, household: after }))
}

/**
 * Fast save (used once the minute trigger is on): check the reply, queue it, update the cached
 * household so a reload shows it straight away, and answer. flushQueue writes it to the sheet and
 * sends the email within a minute. Uses the user lock, so it never waits behind a flush.
 */
function fastSave_(body) {
  const lock = LockService.getUserLock()
  if (!lock.tryLock(10000)) return fail_("busy")
  try {
    const before = cachedHousehold_(body.token)
    if (!before) return fail_("not_found")
    const input = validate_(before, body)
    if (input.error) return fail_(input.error)
    const after = applyInput_(before, input)
    const changes = describeChanges_(before, after)
    PropertiesService.getScriptProperties().setProperty(
      "q:save:" + after.token + ":" + Date.now() + String(Math.floor(Math.random() * 1000)).padStart(3, "0"),
      JSON.stringify({ input: input, changes: changes, replied: Boolean(before.respondedAt), dropped: droppedNames_(before, after) }),
    )
    CacheService.getScriptCache().put(cacheKey_(after.token), JSON.stringify(after), CACHE_SECONDS)
    return json_({ ok: true, updated: Boolean(before.respondedAt), changes: changes, household: after })
  } catch (err) {
    return fail_("server", err)
  } finally {
    lock.releaseLock()
  }
}

/** The household as it will be once this reply is applied (same shape as getHousehold_). */
function applyInput_(h, input) {
  const byId = {}
  input.guests.forEach((g) => (byId[g.id] = g))
  return Object.assign({}, h, {
    guests: h.guests.map((g) => {
      const x = byId[g.id]
      if (!x) return g
      return Object.assign({}, g, {
        attending: x.attending || null,
        dietary: x.attending === "yes" ? x.dietary || "None" : "None",
        firstName: x.name !== null && x.name !== undefined ? x.name || "Guest" : g.firstName,
      })
    }),
    songs: input.songs.slice(),
    arrival: input.arrival,
    departure: input.departure,
    message: input.message,
    photos: input.photos === "yes" ? true : input.photos === "no" ? false : null,
    respondedAt: new Date().toISOString(),
  })
}

/** Queued replies for this household that the minute trigger hasn't written yet, oldest first. */
function pendingSaves_(token, all) {
  all = all || PropertiesService.getScriptProperties().getProperties()
  return Object.keys(all)
    .filter((k) => k.indexOf("q:save:" + token + ":") === 0)
    .sort()
    .map((k) => ({ key: k, data: JSON.parse(all[k]) }))
}

// ---------- reads ----------

function getHousehold_(token) {
  token = String(token || "").trim()
  if (!token) return null
  const guests = rows_(TABS.guests).filter((r) => r.Token === token)
  if (!guests.length) return null
  const rsvp = rows_(TABS.rsvps).find((r) => r.Token === token) || {}
  const songs = rows_(TABS.songs).filter((r) => r.Token === token).map((r) => String(r.Song))
  const named = PropertiesService.getScriptProperties().getProperties()
  return {
    token: token,
    displayName: guests[0].Household || guests.map((g) => g["First name"]).join(" & "),
    guests: guests.map((g) => {
      const id = String(g["Guest ID"])
      return {
        id: id,
        firstName: String(g["First name"] || ""),
        attending: g.Attending === "yes" || g.Attending === "no" ? g.Attending : null,
        dietary: g.Attending === "yes" ? String(g.Dietary || "None") : "None",
        plusOne: PLUS_ONE.test(String(g["First name"] || "").trim()) || named["plusone_" + id] === "1",
      }
    }),
    hasEmail: guests.some((g) => String(g.Email || "").trim()),
    songs: songs,
    arrival: fmtDate_(rsvp.Arriving),
    departure: fmtDate_(rsvp.Leaving),
    message: String(rsvp.Message || ""),
    respondedAt: rsvp["Responded at"] ? new Date(rsvp["Responded at"]).toISOString() : null,
    photos: rsvp["Photos OK"] === "yes" ? true : rsvp["Photos OK"] === "no" ? false : null,
  }
}

/** What's stored for one household, for checking saves (only ever that household's own rows). */
function check_(token) {
  const h = getHousehold_(token)
  if (!h) return { ok: false, code: "not_found", error: ERRORS.not_found }
  return {
    ok: true,
    household: h,
    rsvpRows: rows_(TABS.rsvps).filter((r) => r.Token === h.token).length,
    visits: visitsOf_(h.token),
    songRows: rows_(TABS.songs).filter((r) => r.Token === h.token).length,
    // How many of this household's rows carry the duplicate flag (a count, never the note itself)
    duplicateFlags: rows_(TABS.guests).filter((r) => r.Token === h.token && /Possible duplicate:/.test(String(r.Notes || ""))).length,
    // Where this household said it's flying from, as saved (its own row only), so a check can see the city arrived
    flying: rows_(TABS.guests).filter((r) => r.Token === h.token).map(flyingOf_).filter(Boolean)[0] || null,
    log: rows_(TABS.log)
      .filter((r) => r.Token === h.token)
      .map((r) => ({ time: r.Time instanceof Date ? r.Time.toISOString() : String(r.Time), kind: String(r.Kind || ""), flag: String(r.Flag || ""), changed: String(r["What changed"]) })),
  }
}

// ---------- song search (server side, so guests' browsers never talk to Apple or Spotify) ----------

/**
 * Up to 6 songs as { title, artist, artwork, url }. iTunes Search by default (no keys, no account);
 * Spotify instead when SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are set and it works.
 * Artwork comes back as a small data: URL, so no image loads from a third party either.
 */
function searchSongs_(q, token) {
  q = text_(q, 80)
  if (q.length < 2) return { ok: true, results: [] }
  const cache = CacheService.getScriptCache()
  if (token) {
    // Rate limit per household: 40 searches a minute is plenty for typing with a 300ms debounce
    const rl = "rl:" + token + ":" + Math.floor(Date.now() / 60000)
    const n = Number(cache.get(rl) || 0)
    if (n >= 40) return { ok: true, results: [], limited: true }
    cache.put(rl, String(n + 1), 120)
  }
  const key = "song:" + q.toLowerCase()
  const hit = cache.get(key)
  if (hit) return { ok: true, results: JSON.parse(hit) }
  let results = null
  try { results = spotifySearch_(q) } catch (err) { console.error("Spotify: " + err) }
  if (!results) {
    try { results = itunesSearch_(q) } catch (err) { console.error("iTunes: " + err) }
  }
  if (!results) return { ok: false, code: "search_failed", error: ERRORS.search_failed }
  results = withArtwork_(results)
  try { cache.put(key, JSON.stringify(results), 6 * 60 * 60) } catch (err) { /* over 100 KB: skip caching */ }
  return { ok: true, results: results }
}

function itunesSearch_(q) {
  const res = UrlFetchApp.fetch("https://itunes.apple.com/search?entity=song&limit=6&country=AU&term=" + encodeURIComponent(q), { muteHttpExceptions: true })
  if (res.getResponseCode() !== 200) return null
  return (JSON.parse(res.getContentText()).results || []).map((t) => ({
    title: String(t.trackName || ""),
    artist: String(t.artistName || ""),
    artwork: String(t.artworkUrl100 || ""), // 100px: sharp enough for the 44px thumbnail on 2x screens
    url: String(t.trackViewUrl || ""),
  }))
}

/** Null when there are no keys or Spotify refuses (it needs a Premium owner for the Web API). */
function spotifySearch_(q) {
  const props = PropertiesService.getScriptProperties()
  const id = props.getProperty("SPOTIFY_CLIENT_ID")
  const secret = props.getProperty("SPOTIFY_CLIENT_SECRET")
  if (!id || !secret) return null
  const cache = CacheService.getScriptCache()
  let token = cache.get("spotify_token")
  if (!token) {
    const res = UrlFetchApp.fetch("https://accounts.spotify.com/api/token", {
      method: "post",
      payload: { grant_type: "client_credentials" },
      headers: { Authorization: "Basic " + Utilities.base64Encode(id + ":" + secret) },
      muteHttpExceptions: true,
    })
    if (res.getResponseCode() !== 200) return null
    const body = JSON.parse(res.getContentText())
    token = body.access_token
    cache.put("spotify_token", token, Math.max(60, (body.expires_in || 3600) - 300))
  }
  const res = UrlFetchApp.fetch("https://api.spotify.com/v1/search?type=track&limit=6&market=AU&q=" + encodeURIComponent(q), {
    headers: { Authorization: "Bearer " + token },
    muteHttpExceptions: true,
  })
  if (res.getResponseCode() !== 200) return null
  return ((JSON.parse(res.getContentText()).tracks || {}).items || []).map((t) => {
    const imgs = (t.album && t.album.images) || []
    return {
      title: String(t.name || ""),
      artist: (t.artists || []).map((a) => a.name).join(", "),
      artwork: imgs.length ? imgs[imgs.length - 1].url : "",
      url: t.external_urls ? t.external_urls.spotify : "",
    }
  })
}

/** Swaps artwork links for small inline images, fetched in parallel. Missing art is just left out. */
function withArtwork_(results) {
  const want = results.map((r, i) => ({ i: i, url: r.artwork })).filter((x) => /^https:\/\//.test(x.url))
  if (!want.length) return results.map((r) => Object.assign({}, r, { artwork: "" }))
  let responses = []
  try {
    responses = UrlFetchApp.fetchAll(want.map((x) => ({ url: x.url, muteHttpExceptions: true })))
  } catch (err) {
    responses = []
  }
  const out = results.map((r) => Object.assign({}, r, { artwork: "" }))
  responses.forEach((res, k) => {
    if (res.getResponseCode() !== 200) return
    const type = String(res.getHeaders()["Content-Type"] || "image/jpeg").split(";")[0]
    if (!/^image\//.test(type)) return
    out[want[k].i].artwork = "data:" + type + ";base64," + Utilities.base64Encode(res.getContent())
  })
  return out
}

// ---------- cache ----------

function cacheKey_(token) {
  const c = CacheService.getScriptCache()
  return "h:" + (c.get("gen") || "0") + ":" + token
}

function cachedHousehold_(token) {
  token = String(token || "").trim()
  if (!token) return null
  const c = CacheService.getScriptCache()
  const key = cacheKey_(token)
  const hit = c.get(key)
  if (hit) return JSON.parse(hit)
  let h = getHousehold_(token)
  if (h) pendingSaves_(token).forEach((p) => (h = applyInput_(h, p.data.input)))
  if (h) c.put(key, JSON.stringify(h), CACHE_SECONDS)
  return h
}

function forgetHousehold_(token) {
  CacheService.getScriptCache().remove(cacheKey_(token))
}

/** Clears every cached household (a new generation). */
function forgetAllHouseholds_() {
  CacheService.getScriptCache().put("gen", String(Date.now()), CACHE_SECONDS)
}

/** Simple trigger: any hand edit in the sheet (names, emails, rows) clears the cache. */
function onEdit(e) {
  forgetAllHouseholds_()
  // Edits to the Content tab show on the site straight away (fortunes, story, mode)
  CacheService.getScriptCache().removeAll(["fortunes", "content"])
  safely_(() => stampSeen_(e))
}

// ---------- stay picks (Travel → Where to stay) ----------

/**
 * Their hotel and Airbnb picks, read from the planner's Accommodation Options tab so Nadia's edits reach the site.
 * Read-only, cached 6 hours. Columns are found by header (Location, Hotel Name, Avg room price, Link, Comments, and
 * Sleeps if there is one); merged Location cells carry down; a row is an Airbnb when its link is. The note above the
 * table is theirs ("compare other booking sites"). Tracking bits are taken off every link.
 */
function stayPicks_() {
  const cache = CacheService.getScriptCache()
  const hit = cache.get("stay_picks")
  if (hit) return JSON.parse(hit)
  const id = prop_("PLANNER_ID")
  if (!id) return { ok: false, code: "not_configured" }
  const sheet = SpreadsheetApp.openById(id).getSheetByName("Accommodation Options")
  if (!sheet) return { ok: false, code: "not_found" }
  const out = { ok: true, note: "", hotels: [], airbnbs: [] }
  let col = null, area = ""
  sheet.getDataRange().getDisplayValues().forEach((r) => {
    const cells = r.map((c) => String(c).replace(/\s+/g, " ").trim())
    const low = cells.map((c) => c.toLowerCase())
    if (low.some((c) => /^links?$/.test(c))) {
      col = {}
      low.forEach((c, i) => {
        if (/location|area/.test(c)) col.area = i
        else if (/sleep|guests|people|pax/.test(c)) col.sleeps = i
        else if (/price|cost/.test(c)) col.price = i
        else if (/^links?$/.test(c)) col.link = i
        else if (/comment|note/.test(c)) col.note = i
        else if (/name|hotel|airbnb|place/.test(c)) col.name = i
      })
      area = ""
      return
    }
    if (!col) { if (!out.note && cells[0]) out.note = cells[0]; return }
    const href = cleanLink_(cells[col.link] || "")
    if (col.area != null && cells[col.area]) area = tidyArea_(cells[col.area])
    if (!href) return
    // "Sleeps 8 - not right next to a station" in Comments: the sleeps out front, the rest as the note
    let note = col.note != null && cells[col.note] !== "-" ? cells[col.note] : ""
    const sleepsIn = note.match(/^\s*sleeps\s*(\d+(?:\s*(?:to|-|–)\s*\d+)?)\s*[-–:,]?\s*/i)
    if (sleepsIn) note = note.slice(sleepsIn[0].length).replace(/^\((.*)\)$/, "$1").trim()
    note = note ? note.charAt(0).toUpperCase() + note.slice(1) : ""
    const row = {
      name: col.name != null ? cells[col.name] : "",
      area: area,
      price: (col.price != null ? cells[col.price] : "").replace(/~\s+/, "~").replace(/^~from\s+/i, "from ~").replace(/~(\d)/, "~$$$1").replace(/\s*\/\s*night/i, "").replace(/\s*\([^)]*\)\s*$/, "").trim(),
      note: note,
      sleeps: (col.sleeps != null ? cells[col.sleeps] : sleepsIn ? sleepsIn[1] : "").replace(/\s*[-–]\s*/, " to "),
      href: href,
    }
    ;(/airbnb\./i.test(href) ? out.airbnbs : out.hotels).push(row)
  })
  if (out.hotels.length || out.airbnbs.length) cache.put("stay_picks", JSON.stringify(out), 21600)
  return out
}

/** "Near Kyomizu-Gojo Station" → "Kiyomizu-Gojo", "Near Gojo Station (North of Kyoto Station)" → "Gojo": short chip labels. */
function tidyArea_(a) {
  let t = a.replace(/\([^)]*\)/g, "").replace(/^near\s+/i, "").trim()
  if (!/^kyoto station$/i.test(t)) t = t.replace(/\s+station$/i, "")
  return t.replace(/^ki?yomizu[\s-]*gojo$/i, "Kiyomizu-Gojo").replace(/^the sodoh$/i, "The Sodoh").trim()
}

/** https only, without ad and search tracking (gclid, utm_…, gad_…, Airbnb's search context). */
function cleanLink_(u) {
  if (!/^https:\/\//i.test(u)) return ""
  const parts = u.split("#")[0].split("?")
  const keep = (parts[1] || "").split("&").filter((p) => p && !/^(utm_|wiz_|gclid|gad_|gbraid|wbraid|fbclid|msclkid|srsltid|_gl=|mc_|s=|unique_share_id|review_page_entrypoint|source_impression_id|check_in|check_out|adults|children|infants|pets|guests|search_mode|previous_page_section_name|federated_search_id)/i.test(p))
  return parts[0] + (keep.length ? "?" + keep.join("&") : "")
}

// ---------- queue (sent by flushQueue every minute) ----------

/**
 * Visits: one property per household per 10 minutes (a repeat open in the same window just
 * overwrites it), so the queue stays small even if the trigger is off. No lock needed.
 */
function enqueue_(kind, token) {
  const bucket = Math.floor(Date.now() / REPEAT_OPEN_MS) * REPEAT_OPEN_MS
  const props = PropertiesService.getScriptProperties()
  if (kind === "started" && props.getProperty("q:started:" + token + ":0000000000000")) return // keep the first time
  props.setProperty("q:" + kind + ":" + token + ":" + (kind === "started" ? "0000000000000" : bucket), String(Date.now()))
}

/** Confirmation email for this save. Called under the save lock. Returns false if mail must go inline. */
function queueMail_(b, a, changes) {
  if (!flushTriggerReady_()) return false
  const props = PropertiesService.getScriptProperties()
  const key = "q:mail:" + a.token
  const prev = JSON.parse(props.getProperty(key) || "null")
  const updated = prev ? prev.updated : Boolean(b.respondedAt)
  const all = prev ? prev.changes.concat(changes).filter((c) => c !== "No changes") : changes
  const dropped = (prev ? prev.dropped : []).concat(droppedNames_(b, a))
  props.setProperty(key, JSON.stringify({ updated: updated, changes: all.length ? all : ["No changes"], dropped: dropped }))
  return true
}

function flushTriggerReady_() {
  const props = PropertiesService.getScriptProperties()
  // The stored flag alone isn't proof: in October the trigger stopped while the flag still said on, so replies and
  // emails queued with nothing to send them. Trust it only while flushes are actually running (one in the last
  // 5 minutes); otherwise check the trigger, recreate it if it's gone, and send inline until it runs again.
  const last = Number(props.getProperty("last_flush_at") || 0)
  if (props.getProperty("flush_trigger") === "1" && Date.now() - last < 5 * 60 * 1000) return true
  try {
    if (!hasFlushTrigger_()) {
      // Only the wedding account may own the trigger (it sends as its owner); from anywhere else, send nothing inline
      // either: the reply is still saved, and its email waits for the wedding account's trigger
      if (!isWeddingAccount_()) { wrongAccount_("The web app"); return false }
      ScriptApp.newTrigger("flushQueue").timeBased().everyMinutes(1).create()
      props.setProperty("flush_trigger", "1")
      props.setProperty("last_flush_at", String(Date.now())) // give the new trigger its first minute
      return true
    }
    props.setProperty("flush_trigger", "1")
    return false // the trigger exists but hasn't run lately: don't queue behind it
  } catch (err) {
    CacheService.getScriptCache().put("trigger_err", String(err).slice(0, 300), 21600)
    alert_("trigger_failed", err)
    return false
  }
}

/**
 * Mail only ever goes from the wedding account. Apps Script sends as whoever runs the code: the minute trigger runs
 * as whoever created it, and the web app as whoever deployed it. If either isn't the wedding account (REPLY_TO), the
 * mail waits in the queue for the wedding account's trigger instead, and the reason is kept for ?action=ping and
 * "Check the email queue…". Needs the userinfo.email scope (setupQueue asks for it); without it the address is
 * empty and counts as not the wedding account, so nothing ever sends from the wrong place.
 */
function runningAs_() {
  try { return String(Session.getEffectiveUser().getEmail() || "").toLowerCase() } catch (err) { return "" }
}
function isWeddingAccount_() {
  const me = runningAs_()
  return Boolean(me) && me === String(prop_("REPLY_TO")).toLowerCase()
}
function wrongAccount_(where) {
  const me = runningAs_() || "an unknown account"
  const msg = where + " is running as " + me + ", not " + prop_("REPLY_TO") + ": emails are held in the queue until the queue runs from the wedding account (docs/email-queue.md)."
  console.error(msg)
  CacheService.getScriptCache().put("queue_err", msg.slice(0, 300), 21600)
  PropertiesService.getScriptProperties().setProperty(where === "The email queue" ? "queue_account" : "webapp_account", me === prop_("REPLY_TO") ? "wedding" : "other")
}
/** Holds a confirmation for the wedding account's queue (the same shape queueMail_ writes). */
function holdMail_(token, updated, changes, dropped) {
  const props = PropertiesService.getScriptProperties()
  const key = "q:mail:" + token
  const prev = JSON.parse(props.getProperty(key) || "null")
  const all = (prev ? prev.changes : []).concat(changes || ["No changes"]).filter((c) => c !== "No changes")
  props.setProperty(key, JSON.stringify({ updated: prev ? prev.updated : updated, changes: all.length ? all : ["No changes"], dropped: (prev ? prev.dropped : []).concat(dropped || []) }))
}

function hasFlushTrigger_() {
  return ScriptApp.getProjectTriggers().some((t) => t.getHandlerFunction() === "flushQueue")
}

/** What's waiting, by kind (save, mail, open, started). Counts only, no tokens. */
function queueKinds_() {
  const kinds = {}
  Object.keys(PropertiesService.getScriptProperties().getProperties()).filter((k) => k.indexOf("q:") === 0)
    .forEach((k) => (kinds[k.split(":")[1]] = (kinds[k.split(":")[1]] || 0) + 1))
  return kinds
}

/** Every minute: write queued visits, send queued confirmation emails, keep warm in invite week. */
function flushQueue() {
  const lock = LockService.getScriptLock()
  if (!lock.tryLock(20000)) return
  CacheService.getScriptCache().put("last_flush", new Date().toISOString(), 21600)
  const props = PropertiesService.getScriptProperties()
  props.setProperty("last_flush_at", String(Date.now()))
  // Replies and visits are written whoever runs this (so no reply ever sits unsaved); emails only go from the
  // wedding account. From any other account they stay queued and the reason is logged.
  const mailOk = isWeddingAccount_()
  if (mailOk) props.setProperty("queue_account", "wedding")
  else wrongAccount_("The email queue")
  let mails = []
  try {
    const all = props.getProperties()
    // Queued replies first, oldest first, one household at a time
    const saveKeys = Object.keys(all).filter((k) => k.indexOf("q:save:") === 0).sort()
    const byToken = {}
    saveKeys.forEach((k) => (byToken[k.split(":")[2]] = byToken[k.split(":")[2]] || []).push(k))
    Object.keys(byToken).forEach((token) => {
      const mail = { updated: null, changes: [], dropped: [] }
      byToken[token].forEach((k) => {
        const item = JSON.parse(all[k])
        const h = getHousehold_(token)
        if (h) {
          saveRsvp_(h, item.input)
          log_(h.displayName, token, item.changes.join("\n"), JSON.stringify(item.input), applyInput_(h, item.input))
          if (mail.updated === null) mail.updated = item.replied
          mail.changes = mail.changes.concat(item.changes.filter((c) => c !== "No changes"))
          mail.dropped = mail.dropped.concat(item.dropped || [])
        }
        props.deleteProperty(k)
        SpreadsheetApp.flush()
      })
      if (mail.updated !== null) mails.push({ token: token, data: { updated: mail.updated, changes: mail.changes.length ? mail.changes : ["No changes"], dropped: mail.dropped } })
      // Drop the cached copy once nothing newer is waiting, so the next read comes from the sheet
      if (!pendingSaves_(token).length) forgetHousehold_(token)
    })
    const keys = Object.keys(all).filter((k) => k.indexOf("q:") === 0 && k.indexOf("q:save:") !== 0)
    const events = { open: {}, started: {} }
    keys.forEach((k) => {
      const parts = k.split(":")
      if ((parts[1] === "mail" || parts[1] === "out") && !mailOk) return // left queued for the wedding account
      if (parts[1] === "out") return // the outbox, sent below
      if (parts[1] === "mail") mails.push({ token: parts[2], data: JSON.parse(all[k]) })
      else if (events[parts[1]]) (events[parts[1]][parts[2]] = events[parts[1]][parts[2]] || []).push(Number(all[k]) > 1 ? Number(all[k]) : Number(parts[3].slice(0, 13)))
    })
    if (Object.keys(events.open).length || Object.keys(events.started).length) writeVisits_(events)
    keys.filter((k) => k.indexOf("q:out:") !== 0 && (mailOk || k.indexOf("q:mail:") !== 0)).forEach((k) => props.deleteProperty(k))
  } finally {
    lock.releaseLock()
  }
  // Confirmations for replies just written: sent now from the wedding account, otherwise held for it
  if (!mailOk) { mails.forEach((m) => holdMail_(m.token, m.data.updated, m.data.changes, m.data.dropped)); mails = [] }
  // The outbox (questions to the couple, answers to guests, links again), and published answers to queue for it
  if (mailOk) { safely_(sendAnswers_); safely_(flushOut_) }
  mails.forEach((m) => {
    const h = getHousehold_(m.token)
    if (!h) return
    safely_(() => sendConfirmation_(h, m.data.updated ? m.data.changes : null))
    safely_(() => notifyDropped_(h.displayName, m.data.dropped || []))
  })
  const now = Date.now()
  if (now >= new Date(WARM.from).getTime() && now < new Date(WARM.to).getTime() && new Date().getMinutes() % 15 === 0) {
    safely_(() => UrlFetchApp.fetch(WARM.url + "?action=ping", { muteHttpExceptions: true }))
  }
}

/** Applies queued opens (10-minute rule) and first "Started RSVP" times to Guests. */
function writeVisits_(events) {
  const s = sheet_(TABS.guests)
  const head = ensureVisitColumns_(s)
  const data = s.getDataRange().getValues()
  const rowsOf = {}
  for (let i = 1; i < data.length; i++) {
    const t = String(data[i][head.Token]).trim()
    if (t) (rowsOf[t] = rowsOf[t] || []).push(i)
  }
  const tokens = Object.keys(Object.assign({}, events.open, events.started))
  tokens.forEach((token) => {
    const rows = rowsOf[token]
    if (!rows) return
    const first = data[rows[0]]
    let firstOpened = first[head["First opened"]]
    let last = first[head["Last opened"]]
    let opens = Number(first[head.Opens]) || 0
    ;(events.open[token] || []).sort().forEach((ms) => {
      if (last instanceof Date && ms - last.getTime() < REPEAT_OPEN_MS) return
      last = new Date(ms)
      if (!firstOpened) firstOpened = last
      opens++
    })
    let started = first[head["Started RSVP"]]
    if (!started && events.started[token]) started = new Date(Math.min.apply(null, events.started[token]))
    rows.forEach((r) => {
      s.getRange(r + 1, head["First opened"] + 1).setValue(firstOpened || "")
      s.getRange(r + 1, head["Last opened"] + 1).setValue(last || "")
      s.getRange(r + 1, head.Opens + 1).setValue(opens || "")
      s.getRange(r + 1, head["Started RSVP"] + 1).setValue(started || "")
    })
  })
}

function visitsOf_(token) {
  const r = rows_(TABS.guests).find((x) => x.Token === token) || {}
  const out = {}
  VISITS.forEach((k) => (out[k] = r[k] instanceof Date ? r[k].toISOString() : r[k] === undefined ? null : r[k]))
  return out
}

/** Adds any missing headers at the end of a tab (never moves existing ones). Returns the header map. */
function ensureColumns_(s, names) {
  let head = headers_(s)
  const missing = names.filter((k) => !(k in head))
  if (missing.length) {
    s.getRange(1, s.getLastColumn() + 1, 1, missing.length).setValues([missing]).setFontWeight("bold")
    head = headers_(s)
  }
  return head
}

/** Adds any missing visit columns at the end of Guests (never moves existing ones). */
function ensureVisitColumns_(s) {
  let head = headers_(s)
  const missing = VISITS.filter((k) => !(k in head))
  if (missing.length) {
    const start = s.getLastColumn() + 1
    s.getRange(1, start, 1, missing.length).setValues([missing]).setFontWeight("bold")
    head = headers_(s)
    addVisitNotes_()
  }
  return head
}

/** Explains the visit columns at the bottom of the How to update tab, once. */
function addVisitNotes_() {
  const s = SpreadsheetApp.getActive().getSheetByName("How to update")
  if (!s) return
  const text = s.getDataRange().getValues().map((r) => r.join(" ")).join(" ")
  if (text.indexOf("First opened") >= 0) return
  const lines = [
    ["Visits (last columns on Guests)"],
    ["Counted only in this sheet. No cookies, IP addresses or tracking services. Opens within 10 minutes of the last one aren't counted."],
    ["First opened: the first time the household opened their link."],
    ["Last opened: the most recent time."],
    ["Opens: how many separate visits."],
    ["Started RSVP: when they first opened the RSVP form."],
    ["Funnel: invited (Invite sent) → opened (First opened) → started (Started RSVP) → replied (RSVPs tab, Responded at)."],
  ]
  const start = s.getLastRow() + 2
  s.getRange(start, 1, lines.length, 1).setValues(lines)
  s.getRange(start, 1).setFontWeight("bold")
}

// ---------- writes ----------

function validate_(h, body) {
  const ids = {}
  h.guests.forEach((g) => (ids[g.id] = g))
  const guests = []
  const list = Array.isArray(body.guests) ? body.guests : []
  for (let i = 0; i < list.length; i++) {
    const g = list[i]
    if (!g || typeof g !== "object" || !ids[String(g.id)]) return { error: "bad_guest" }
    const a = g.attending == null ? "" : String(g.attending)
    if (a !== "yes" && a !== "no" && a !== "") return { error: "bad_attending" }
    guests.push({
      id: String(g.id),
      attending: a,
      dietary: a === "yes" ? text_(g.dietary, MAX.dietary) || "None" : "",
      name: ids[String(g.id)].plusOne ? text_(g.firstName, MAX.name) : null,
    })
  }
  const arrival = date_(body.arrival)
  const departure = date_(body.departure)
  if (arrival === null || departure === null) return { error: "bad_date" }
  // Trip dates sit around the wedding (1 Sep to 30 Nov 2027) and leaving can't be before arriving
  const inRange = (d) => !d || (d >= DATE_RANGE.from && d <= DATE_RANGE.to)
  if (!inRange(arrival) || !inRange(departure) || (arrival && departure && departure < arrival)) return { error: "bad_date" }
  const songs = []
  ;(Array.isArray(body.songs) ? body.songs : []).forEach((s) => {
    const t = text_(s, MAX.song)
    if (t && songs.indexOf(t) < 0 && songs.length < MAX.songs) songs.push(t)
  })
  const photos = body.photos === true ? "yes" : body.photos === false ? "no" : ""
  return { guests: guests, songs: songs, arrival: arrival, departure: departure, message: text_(body.message, MAX.message, true), photos: photos }
}

function saveRsvp_(h, input) {
  const now = new Date()
  const props = PropertiesService.getScriptProperties()

  // Guests: attending, dietary (cleared unless coming) and plus-one names
  const gSheet = sheet_(TABS.guests)
  const gHead = headers_(gSheet)
  const gData = gSheet.getDataRange().getValues()
  const byId = {}
  input.guests.forEach((g) => (byId[g.id] = g))
  for (let i = 1; i < gData.length; i++) {
    const row = gData[i]
    if (String(row[gHead.Token]) !== h.token) continue
    const g = byId[String(row[gHead["Guest ID"]])]
    if (!g) continue
    gSheet.getRange(i + 1, gHead.Attending + 1).setValue(g.attending)
    gSheet.getRange(i + 1, gHead.Dietary + 1).setValue(cell_(g.dietary))
    if (g.name !== null) {
      const name = g.name || "Guest"
      if (name !== String(row[gHead["First name"]])) {
        gSheet.getRange(i + 1, gHead["First name"] + 1).setValue(cell_(name))
        props.setProperty("plusone_" + g.id, "1")
      }
      flagDuplicate_(gSheet, i, name, h.token, gData)
    }
  }

  // RSVPs: exactly one row per household
  const rSheet = sheet_(TABS.rsvps)
  const rHead = ensureColumns_(rSheet, ["Photos OK"])
  const rData = rSheet.getDataRange().getValues()
  const mine = []
  for (let i = 1; i < rData.length; i++) if (String(rData[i][rHead.Token]) === h.token) mine.push(i)
  const width = rSheet.getLastColumn()
  const row = mine.length ? rData[mine[0]].slice(0, width) : Array.from({ length: width }, () => "")
  row[rHead.Token] = h.token
  row[rHead.Household] = h.displayName
  row[rHead.Arriving] = cell_(input.arrival)
  row[rHead.Leaving] = cell_(input.departure)
  row[rHead.Message] = cell_(input.message)
  row[rHead["Responded at"]] = now
  row[rHead["Photos OK"]] = input.photos
  if (mine.length) {
    rSheet.getRange(mine[0] + 1, 1, 1, width).setValues([row])
    for (let k = mine.length - 1; k >= 1; k--) rSheet.deleteRow(mine[k] + 1)
  } else {
    rSheet.appendRow(row)
  }

  // Songs: replace this household's picks, keeping the original time for songs they kept
  const sSheet = sheet_(TABS.songs)
  const sHead = headers_(sSheet)
  const sData = sSheet.getDataRange().getValues()
  const addedAt = {}
  for (let i = sData.length - 1; i >= 1; i--) {
    if (String(sData[i][sHead.Token]) !== h.token) continue
    addedAt[String(sData[i][sHead.Song])] = sData[i][sHead["Added at"]]
    sSheet.deleteRow(i + 1)
  }
  input.songs.forEach((s) => {
    const r = []
    r[sHead.Token] = h.token
    r[sHead.Household] = h.displayName
    r[sHead.Song] = cell_(s)
    r[sHead["Added at"]] = addedAt[s] || now
    sSheet.appendRow(fill_(r, sSheet.getLastColumn()))
  })
}

/**
 * A plus one's name that already belongs to someone in another household gets a note on their own
 * Guests row ("Possible duplicate: <household>") for Nadia to check. The guest never sees it.
 * Matches first name plus last name when both rows have one, else the first name alone.
 */
function flagDuplicate_(gSheet, rowIndex, name, token, gData) {
  const head = ensureColumns_(gSheet, ["Notes"])
  const cell = gSheet.getRange(rowIndex + 1, head.Notes + 1)
  const prior = String(cell.getValue() || "")
  const keep = prior.replace(/\s*Possible duplicate: [^\n]*/g, "").trim()
  const key = (v) => String(v || "").trim().toLowerCase().replace(/\s+/g, " ")
  const mine = key(name)
  let match = ""
  if (mine && !PLUS_ONE.test(mine)) {
    for (let k = 1; k < gData.length; k++) {
      if (k === rowIndex || String(gData[k][head.Token]).trim() === token) continue
      const first = key(gData[k][head["First name"]])
      const full = "Last name" in head ? key(first + " " + key(gData[k][head["Last name"]])) : first
      if (first === mine || full === mine) { match = String(gData[k][head.Household] || "another household"); break }
    }
  }
  const next = match ? (keep ? keep + "\n" : "") + "Possible duplicate: " + match : keep
  if (next !== prior) cell.setValue(next)
}

// The Log tab, laid out so Nadia can read it at a glance (v3 S): one row per event, who's coming and
// what they said in their own columns, and a Flag (with a soft highlight) on anything that needs a look.
const LOG_COLUMNS = ["Time", "Household", "Kind", "Coming", "Not coming", "Dietary", "Songs", "Dates", "Message", "Flag", "What changed", "Token", "Payload"]
const LOG_FLAG_BG = "#fbf1d9" // honey paper: needs a look
const LOG_MESSAGE_BG = "#eef1e6" // sage paper: they wrote something

/** Adds any missing Log columns just before "What changed" (old rows keep their values), once. */
function ensureLogLayout_(s) {
  let head = headers_(s)
  if ("Kind" in head && "Flag" in head) return head
  LOG_COLUMNS.forEach((name) => {
    if (name in head) return
    const before = "What changed" in head ? head["What changed"] + 1 : s.getLastColumn() + 1
    s.insertColumnBefore(before)
    s.getRange(1, before).setValue(name)
    head = headers_(s)
  })
  s.getRange(1, 1, 1, s.getLastColumn()).setFontWeight("bold")
  s.setFrozenRows(1)
  ;[["Kind", 120], ["Coming", 200], ["Not coming", 160], ["Dietary", 220], ["Songs", 220], ["Dates", 150], ["Message", 320], ["Flag", 220]].forEach(([k, w]) => s.setColumnWidth(head[k] + 1, w))
  return head
}

/** What kind of entry this is, from its wording. */
function logKind_(changed, after) {
  if (after) return /^First reply/.test(changed) ? "First reply" : "Changed reply"
  if (/^Invite sent/.test(changed)) return "Invite sent"
  if (/^Reminder sent/.test(changed)) return "Reminder sent"
  if (/^Final numbers note/.test(changed)) return "Final numbers note"
  if (/^Link re-sent/.test(changed)) return "Link re-sent"
  if (/^Test/.test(changed)) return "Test send"
  if (/reminder/i.test(changed)) return "Reminders"
  return "Note"
}

function log_(household, token, changed, payload, after) {
  const s = sheet_(TABS.log)
  const head = ensureLogLayout_(s)
  const r = []
  r[head.Time] = new Date()
  r[head.Household] = household
  r[head.Kind] = logKind_(String(changed || ""), after)
  let flagged = false, wrote = false
  if (after) {
    const yes = after.guests.filter((g) => g.attending === "yes"), no = after.guests.filter((g) => g.attending === "no")
    r[head.Coming] = yes.map((g) => g.firstName).join(", ")
    r[head["Not coming"]] = no.map((g) => g.firstName).join(", ")
    r[head.Dietary] = cell_(yes.filter((g) => g.dietary && g.dietary !== "None").map((g) => g.firstName + ": " + g.dietary).join("; "))
    r[head.Songs] = cell_(after.songs.join("; "))
    r[head.Dates] = after.arrival || after.departure ? (shortDate_(after.arrival) || "?") + " to " + (shortDate_(after.departure) || "?") : ""
    r[head.Message] = cell_(after.message || "")
    const flags = []
    if (/→ can't make it/.test(changed)) flags.push("Now can't make it")
    const dup = rows_(TABS.guests).filter((g) => g.Token === token && /Possible duplicate:/.test(String(g.Notes || ""))).map((g) => String(g.Notes).match(/Possible duplicate: [^\n]*/)[0])
    if (dup.length) flags.push(dup.join("; "))
    if (after.message && /Message (added|updated)|^First reply/.test(changed)) { flags.push("New message"); wrote = true }
    r[head.Flag] = flags.join("; ")
    flagged = flags.some((f) => f !== "New message")
  }
  r[head["What changed"]] = cell_(changed)
  r[head.Token] = token
  r[head.Payload] = cell_(String(payload || "").slice(0, MAX.payload))
  s.appendRow(fill_(r, s.getLastColumn()))
  if (flagged || wrote) s.getRange(s.getLastRow(), 1, 1, s.getLastColumn()).setBackground(flagged ? LOG_FLAG_BG : LOG_MESSAGE_BG)
}

// ---------- fortunes (Content tab) ----------

// All "great blessing" (大吉): no bad luck at a wedding. Nadia can edit them in the Content tab.
const FORTUNES = [
  "Higashiyama is all hills and stone steps. Pack shoes you can walk in.",
  "Mid October days are mild and evenings cool. Bring a light layer.",
  "Many small shops and temples are cash only. Keep some yen on you.",
  "Get an IC card (ICOCA or Suica, or add one to your phone wallet) for buses and trains.",
  "Taxi doors open and close by themselves. Let them.",
  "There's no tipping in Japan. A thank you is plenty.",
  "Rain happens. Any convenience store sells a good umbrella.",
  "Send big bags ahead from the airport with a luggage delivery service.",
  "The temples near the venue are calm before 8 am.",
  "Public bins are rare. Carry a small bag for rubbish.",
  "The Haruka train runs from Kansai Airport to Kyoto Station in about 75 minutes.",
  "You will eat very well.",
]

/** The 12 fortunes: from the Content tab (Key fortune_1 to fortune_12) where filled in, else the drafts. */
function fortunes_() {
  const cache = CacheService.getScriptCache()
  const hit = cache.get("fortunes")
  if (hit) return JSON.parse(hit)
  const out = FORTUNES.slice()
  const tab = SpreadsheetApp.getActive().getSheetByName("Content")
  if (tab) rows_("Content").forEach((r) => {
    const m = /^fortune_(\d+)$/.exec(String(r.Key || "").trim())
    if (m && Number(m[1]) >= 1 && Number(m[1]) <= 12 && String(r.Text || "").trim()) out[Number(m[1]) - 1] = String(r.Text).trim()
  })
  cache.put("fortunes", JSON.stringify(out), 600)
  return out
}

function setupContentTab() {
  const ss = SpreadsheetApp.getActive()
  if (ss.getSheetByName("Content")) return SpreadsheetApp.getUi().alert("The Content tab is already there.")
  const s = ss.insertSheet("Content")
  const rows = [["Key", "Text", "Notes"]].concat(FORTUNES.map((f, i) => ["fortune_" + (i + 1), f, i === 0 ? "Fortunes after RSVP. All great blessings, one per household. Edit the Text column only." : ""]))
  s.getRange(1, 1, rows.length, 3).setValues(rows)
  s.getRange(1, 1, 1, 3).setFontWeight("bold")
  s.setColumnWidth(1, 120); s.setColumnWidth(2, 520); s.setColumnWidth(3, 360)
  CacheService.getScriptCache().remove("fortunes")
  SpreadsheetApp.getUi().alert("Added the Content tab with the 12 fortunes.")
}

/**
 * Our story and the site mode, from the Content tab: story_1_title, story_1_year, story_1_body (paragraphs
 * split on blank lines), up to story_6; mode = invite | week-of | keepsake; contact_day = who to call on the day
 * (shown under the FAQs once filled in). Story and contact stay hidden until filled in.
 */
function content_() {
  const cache = CacheService.getScriptCache()
  const hit = cache.get("content")
  if (hit) return JSON.parse(hit)
  const out = { ok: true, story: [], mode: "invite" }
  if (SpreadsheetApp.getActive().getSheetByName("Content")) {
    const kv = {}
    rows_("Content").forEach((r) => { const k = String(r.Key || "").trim(); if (k) kv[k] = String(r.Text || "").trim() })
    for (let n = 1; n <= 6; n++) {
      const title = kv["story_" + n + "_title"], body = kv["story_" + n + "_body"]
      if (!title || !body) continue
      out.story.push({ key: String(n), title: title.slice(0, 60), year: (kv["story_" + n + "_year"] || "").slice(0, 20), body: body.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean).slice(0, 6) })
    }
    if (["invite", "week-of", "keepsake"].indexOf(kv.mode) >= 0) out.mode = kv.mode
    if (kv.contact_day) out.contactDay = kv.contact_day.slice(0, 200)
  }
  cache.put("content", JSON.stringify(out), 600)
  return out
}

// ---------- crew links (/kit and /lab) ----------

const CREW = [["Jehan", "builder"], ["Griffin", "couple"], ["Nadia", "couple"], ["Wedding Gmail", "account"]]

/** { ok, name } only for a token in the Crew tab. Never says anything about households. */
function crew_(token) {
  token = String(token || "").trim()
  if (!/^[a-z2-9]{10}$/.test(token)) return { ok: false }
  const cache = CacheService.getScriptCache()
  const hit = cache.get("crew:" + token)
  if (hit) return hit === "-" ? { ok: false } : { ok: true, name: hit }
  const tab = SpreadsheetApp.getActive().getSheetByName("Crew")
  const row = tab ? rows_("Crew").find((r) => String(r.Token || "").trim() === token) : null
  cache.put("crew:" + token, row ? String(row.Name) : "-", 600)
  return row ? { ok: true, name: String(row.Name) } : { ok: false }
}

/** Menu: makes the Crew tab if needed, fills a token for each crew row, and writes their /kit and /lab links. */
function makeCrewLinks() {
  makeCrewLinks_()
  SpreadsheetApp.getUi().alert("Crew links are in the Crew tab. Send each person their own; anyone with a link can open /kit and /lab.")
}

/** The Crew tab and its links, without the alert. `first` presets the first row's token. */
function makeCrewLinks_(first) {
  const ss = SpreadsheetApp.getActive()
  let s = ss.getSheetByName("Crew")
  if (!s) {
    s = ss.insertSheet("Crew")
    const rows = [["Name", "Role", "Token", "Kit link", "Lab link"]].concat(CREW.map((c) => [c[0], c[1], "", "", ""]))
    s.getRange(1, 1, rows.length, 5).setValues(rows)
    s.getRange(1, 1, 1, 5).setFontWeight("bold")
    s.setColumnWidth(4, 420); s.setColumnWidth(5, 420)
  }
  const head = ensureColumns_(s, ["Name", "Role", "Token", "Kit link", "Lab link"])
  const data = s.getDataRange().getValues()
  for (let i = 1; i < data.length; i++) {
    if (!String(data[i][head.Name]).trim()) continue
    let token = String(data[i][head.Token] || "").trim()
    if (!token) { token = (i === 1 && first) || makeToken_(); s.getRange(i + 1, head.Token + 1).setValue(token) }
    s.getRange(i + 1, head["Kit link"] + 1).setValue(prop_("SITE_URL") + "/kit?c=" + token)
    s.getRange(i + 1, head["Lab link"] + 1).setValue(prop_("SITE_URL") + "/lab?c=" + token)
    CacheService.getScriptCache().remove("crew:" + token)
  }
}


// ---------- stamp book (concept B, December) ----------

const STAMPS = ["home", "day", "travel", "qa", "story", "reply"]

/** Saves the household's collected stamps (a fixed list) in a Stamps column at the end of Guests. */
function setStamps_(token, stamps) {
  token = String(token || "").trim()
  const list = (Array.isArray(stamps) ? stamps : []).map(String).filter((x, i, all) => STAMPS.indexOf(x) >= 0 && all.indexOf(x) === i)
  const lock = LockService.getUserLock()
  if (!lock.tryLock(10000)) return { ok: false, code: "busy", error: ERRORS.busy }
  try {
    const s = sheet_(TABS.guests)
    const head = ensureColumns_(s, ["Stamps"])
    const data = s.getDataRange().getValues()
    let found = false
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][head.Token]).trim() !== token) continue
      s.getRange(i + 1, head.Stamps + 1).setValue(list.join(", "))
      found = true
    }
    return found ? { ok: true } : { ok: false, code: "not_found", error: ERRORS.not_found }
  } finally {
    lock.releaseLock()
  }
}

// ---------- "Flying from" (anonymous counts for the journey map) ----------

const FLYING = ["Brisbane", "Melbourne", "Sydney", "Perth", "Adelaide", "Elsewhere in Australia", "Canada", "Already in Japan", "Somewhere else"]

// Where the old fixed answers are (18f and before), so their rows still draw a line (final run): a row with only an
// answer in "Flying from" and no coordinates is read as this city, until the household picks again
const FLYING_AT = {
  "Brisbane": [-27.468, 153.028, "AU"], "Melbourne": [-37.814, 144.963, "AU"], "Sydney": [-33.868, 151.207, "AU"],
  "Perth": [-31.952, 115.861, "AU"], "Adelaide": [-34.929, 138.599, "AU"], "Elsewhere in Australia": [-25.5, 134, "AU"],
  "Canada": [53, -100, "CA"], "Already in Japan": [35.68, 139.69, "JP"], "Somewhere else": [null, null, ""],
}

/**
 * Saves where the household is flying from (final run): the city they picked from the site's list of real cities
 * (its GeoNames id, name, region, country and coordinates), or one of the older fixed answers. Never free text: the
 * site only sends a picked city, and everything is checked here too. In Guests columns at the end.
 */
function setFlying_(token, city) {
  token = String(token || "").trim()
  let row
  if (typeof city === "string") {
    if (FLYING.indexOf(city) < 0) return { ok: false, code: "bad_request", error: ERRORS.bad_request }
    const at = FLYING_AT[city]
    row = { name: city, id: "", region: "", country: at[2], lat: at[0], lon: at[1] }
  } else if (city && typeof city === "object") {
    const id = String(city.id || ""), name = String(city.name || "").trim(), country = String(city.country || "").trim().toUpperCase()
    const lat = city.lat === null ? null : Number(city.lat), lon = city.lon === null ? null : Number(city.lon)
    const okId = /^(\d{1,10}|jp|else)$/.test(id), okName = name.length > 0 && name.length <= 80
    const okCountry = country === "" || /^[A-Z]{2}$/.test(country)
    const okAt = (lat === null && lon === null) || (isFinite(lat) && isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180)
    if (!okId || !okName || !okCountry || !okAt) return { ok: false, code: "bad_request", error: ERRORS.bad_request }
    row = { name: name, id: id, region: String(city.region || "").slice(0, 80), country: country, lat: lat, lon: lon }
  } else return { ok: false, code: "bad_request", error: ERRORS.bad_request }
  const lock = LockService.getUserLock()
  if (!lock.tryLock(10000)) return { ok: false, code: "busy", error: ERRORS.busy }
  try {
    const s = sheet_(TABS.guests)
    const head = ensureColumns_(s, ["Flying from", "Flying id", "Flying region", "Flying country", "Flying lat", "Flying lon"])
    const data = s.getDataRange().getValues()
    let found = false
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][head.Token]).trim() !== token) continue
      s.getRange(i + 1, head["Flying from"] + 1).setValue("'" + row.name)
      s.getRange(i + 1, head["Flying id"] + 1).setValue("'" + row.id)
      s.getRange(i + 1, head["Flying region"] + 1).setValue("'" + row.region)
      s.getRange(i + 1, head["Flying country"] + 1).setValue("'" + row.country)
      s.getRange(i + 1, head["Flying lat"] + 1).setValue(row.lat === null ? "" : row.lat)
      s.getRange(i + 1, head["Flying lon"] + 1).setValue(row.lon === null ? "" : row.lon)
      found = true
    }
    if (!found) return { ok: false, code: "not_found", error: ERRORS.not_found }
    CacheService.getScriptCache().remove("flying")
    CacheService.getScriptCache().remove("journeys")
    return { ok: true }
  } finally {
    lock.releaseLock()
  }
}

/** A Guests row's city: its picked city, or (an older answer) the fixed answer's place. Null when there's none. */
function flyingOf_(r) {
  const name = String(r["Flying from"] || "").replace(/^'/, "")
  if (!name) return null
  let lat = r["Flying lat"], lon = r["Flying lon"], country = String(r["Flying country"] || "").replace(/^'/, "")
  if ((lat === "" || lat === undefined) && FLYING_AT[name]) { lat = FLYING_AT[name][0]; lon = FLYING_AT[name][1]; country = FLYING_AT[name][2] }
  return { name: name, country: country, lat: lat === "" || lat === null || lat === undefined ? null : Number(lat), lon: lon === "" || lon === null || lon === undefined ? null : Number(lon) }
}

/** Nearest of the older fixed answers, so a site from before the final run still gets its counts */
function bucketOf_(c) {
  if (FLYING.indexOf(c.name) >= 0) return c.name
  if (c.country === "CA") return "Canada"
  if (c.country === "JP") return "Already in Japan"
  if (c.country !== "AU" || c.lat === null) return "Somewhere else"
  let best = "Elsewhere in Australia", d = Infinity
  ;["Brisbane", "Melbourne", "Sydney", "Perth", "Adelaide"].forEach(function (b) { const at = FLYING_AT[b], dd = Math.pow(at[0] - c.lat, 2) + Math.pow((at[1] - c.lon) * Math.cos(c.lat * Math.PI / 180), 2); if (dd < d) { d = dd; best = b } })
  return best
}

/** Households per city (with its coordinates) and per older answer, and how many households there are. Counts only, never names. */
function flyingCounts_() {
  const cache = CacheService.getScriptCache()
  const hit = cache.get("flying")
  if (hit) return JSON.parse(hit)
  const seen = {}
  const counts = {}
  const cities = {}
  rows_(TABS.guests).forEach((r) => {
    const t = String(r.Token || "").trim()
    if (!t || TEST_HOUSEHOLD.test(String(r.Household || "")) || seen[t]) return
    seen[t] = true
    const c = flyingOf_(r)
    if (!c) return
    const b = bucketOf_(c)
    counts[b] = (counts[b] || 0) + 1
    if (c.lat === null) return
    const k = c.name + "|" + c.country
    cities[k] = cities[k] || { name: c.name, country: c.country, lat: c.lat, lon: c.lon, n: 0 }
    cities[k].n++
  })
  const list = Object.keys(cities).map((k) => cities[k])
  const out = { ok: true, counts: counts, cities: list, told: Object.values(counts).reduce((a, b) => a + b, 0), households: Object.keys(seen).length }
  cache.put("flying", JSON.stringify(out), 600)
  return out
}

// ---------- outbox: one-off emails, sent by flushQueue from the wedding account ----------

/** Queues one email (to, subject, body, htmlBody, replyTo, name) for the wedding account's queue. */
/** token: the household it's about, when there is one, so "Clear queued items for test households" can find it. */
function queueOut_(mail, token) {
  PropertiesService.getScriptProperties().setProperty("q:out:" + Date.now() + ":" + Math.random().toString(36).slice(2, 8), JSON.stringify(token ? Object.assign({ token: token }, mail) : mail))
}
/**
 * Sends what's in the outbox, oldest first, while the day's email quota lasts. Under 100 guests fits the daily
 * quota easily; if a send ever hits the limit, the rest wait in the outbox and go out the next day, by themselves.
 */
function flushOut_() {
  const props = PropertiesService.getScriptProperties()
  const keys = Object.keys(props.getProperties()).filter((k) => k.indexOf("q:out:") === 0).sort()
  for (const k of keys) {
    if (MailApp.getRemainingDailyQuota() < 1) { CacheService.getScriptCache().put("quota_paused", new Date().toISOString(), 86400); break }
    const m = JSON.parse(props.getProperty(k) || "null")
    props.deleteProperty(k)
    if (m) { delete m.token; MailApp.sendEmail({ name: COUPLE, replyTo: prop_("REPLY_TO"), ...m }) }
  }
}

// ---------- Ask us: questions to Griffin and Nadia ----------

const QUESTION_HEAD = ["Time", "Household", "Token", "Email", "Question", "Status", "Answer", "Answer (ja)", "Publish", "Sent", "Seen"]
/** The Questions tab, made the first time (status new / answered / published; Publish is a tickbox). */
function questionsSheet_() {
  const ss = SpreadsheetApp.getActive()
  let s = ss.getSheetByName(TABS.questions)
  if (!s) {
    s = ss.insertSheet(TABS.questions)
    s.getRange(1, 1, 1, QUESTION_HEAD.length).setValues([QUESTION_HEAD]).setFontWeight("bold")
    s.setFrozenRows(1)
    // A tickbox rule, not insertCheckboxes: that writes FALSE on every row and appendRow then lands after row 1000
    const box = SpreadsheetApp.newDataValidation().requireCheckbox().build()
    ;["Publish", "Seen"].forEach((k) => s.getRange(2, QUESTION_HEAD.indexOf(k) + 1, 999, 1).setDataValidation(box))
    s.getRange(2, QUESTION_HEAD.indexOf("Status") + 1, 999, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(["new", "answered", "published"], true).build())
  }
  return s
}

/**
 * A guest's question (the site's Ask us sheet). From an invite, the household is known; from "can't find your
 * invite" there's no token, so a name and an email come with it. Kept out: anything in the hidden website field (a
 * bot), more than 3 an hour from one household or email, empty or over 500 characters. Saved to the Questions tab
 * (as plain text), then Griffin and Nadia hear about it: an email through the wedding account's queue, and Discord
 * too if DISCORD_WEBHOOK_URL is set in Script Properties (docs/discord.md).
 */
function ask_(body) {
  if (String(body.website || "")) return { ok: true } // the honeypot: say yes, keep nothing
  const question = String(body.question || "").trim()
  if (!question || question.length > 500) return { ok: false, code: "bad_request", error: ERRORS.bad_request }
  const token = String(body.token || "").trim()
  let household = "", email = ""
  if (token) {
    const h = getHousehold_(token)
    if (!h) return { ok: false, code: "not_found", error: ERRORS.not_found }
    household = h.displayName
    email = rows_(TABS.guests).filter((r) => r.Token === token).map((r) => String(r.Email || "").trim()).filter(Boolean)[0] || ""
  } else {
    household = String(body.name || "").trim().slice(0, 60)
    email = String(body.email || "").trim().toLowerCase().slice(0, 120)
    if (!household || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, code: "bad_email", error: ERRORS.bad_email }
  }
  const cache = CacheService.getScriptCache(), key = "ask:" + (token || email) + ":" + Math.floor(Date.now() / 3600000)
  const n = Number(cache.get(key) || 0)
  if (n >= 3) return { ok: false, code: "busy", error: ERRORS.busy }
  cache.put(key, String(n + 1), 3700)
  questionsSheet_().appendRow([new Date(), "'" + household, "'" + token, "'" + email, "'" + question, "new", "", "", false, ""])
  const text = household + " asked:\n\n" + question + "\n\nAnswer it in the Questions tab; tick Publish to show it in the FAQs" + (email ? " and email it to them." : ".")
  queueOut_({ to: prop_("REPLY_TO"), subject: "A question from " + household, body: text }, token)
  const hook = prop_("DISCORD_WEBHOOK_URL")
  if (hook) safely_(() => UrlFetchApp.fetch(hook, { method: "post", contentType: "application/json", payload: JSON.stringify({ content: ("**A question from " + household + "**\n" + question).slice(0, 1900) }), muteHttpExceptions: true }))
  return { ok: true }
}

/** Ticked questions with an answer, for the FAQs' "You asked" (questions and answers only, no names). 10 minutes. */
function publishedQuestions_() {
  const cache = CacheService.getScriptCache(), hit = cache.get("questions")
  if (hit) return JSON.parse(hit)
  const s = SpreadsheetApp.getActive().getSheetByName(TABS.questions)
  const out = { ok: true, questions: [] }
  if (s) rows_(TABS.questions).forEach((r) => { if (r.Publish === true && String(r.Answer || "").trim()) out.questions.push({ q: String(r.Question).replace(/^'/, ""), a: String(r.Answer).replace(/^'/, ""), a_ja: String(r["Answer (ja)"] || "").replace(/^'/, "") }) })
  cache.put("questions", JSON.stringify(out), 600)
  return out
}

/** Each newly published answer goes to the household by email (once), and the row says published. */
function sendAnswers_() {
  const s = SpreadsheetApp.getActive().getSheetByName(TABS.questions)
  if (!s) return
  const data = s.getDataRange().getValues(), head = data[0].map((h) => String(h).trim()), col = (n) => head.indexOf(n)
  for (let i = 1; i < data.length; i++) {
    const r = data[i]
    if (r[col("Publish")] !== true || !String(r[col("Answer")] || "").trim() || r[col("Sent")]) continue
    const to = String(r[col("Email")] || "").replace(/^'/, "")
    if (to) queueOut_({ to: to, subject: "Your question, answered", body: "Hi " + String(r[col("Household")]).replace(/^'/, "") + ",\n\nYou asked: " + String(r[col("Question")]).replace(/^'/, "") + "\n\n" + String(r[col("Answer")]) + "\n\nIt's in the FAQs now too.\n\n" + COUPLE }, String(r[col("Token")] || "").replace(/^'/, ""))
    s.getRange(i + 1, col("Status") + 1).setValue("published")
    s.getRange(i + 1, col("Sent") + 1).setValue(new Date())
    CacheService.getScriptCache().remove("questions")
  }
}

/**
 * The globe's lines (final run): one per city that coming households are flying from, with how many and where. Only
 * households with someone coming, never test ones, never names or tokens. Cached for 10 minutes.
 */
function journeys_() {
  const cache = CacheService.getScriptCache()
  const hit = cache.get("journeys")
  if (hit) return JSON.parse(hit)
  const coming = {}, seen = {}, cities = {}
  rows_(TABS.guests).forEach((r) => { if (String(r.Attending || "").toLowerCase() === "yes") coming[String(r.Token || "").trim()] = true })
  rows_(TABS.guests).forEach((r) => {
    const t = String(r.Token || "").trim()
    if (!t || !coming[t] || seen[t] || TEST_HOUSEHOLD.test(String(r.Household || ""))) return
    seen[t] = true
    const c = flyingOf_(r)
    if (!c || c.lat === null) return
    const k = c.name + "|" + c.country
    cities[k] = cities[k] || { name: c.name, country: c.country, lat: Math.round(c.lat * 100) / 100, lon: Math.round(c.lon * 100) / 100, n: 0 }
    cities[k].n++
  })
  const out = { ok: true, cities: Object.keys(cities).map((k) => cities[k]) }
  cache.put("journeys", JSON.stringify(out), 600)
  return out
}

// ---------- "Can't find your invite?" ----------

/**
 * Emails the household link to an address on the guest list. Always answers the same way, so it
 * never reveals who's invited, and never says whether it could send (final run): the email goes into the wedding
 * account's outbox, so if mail is held (the web app isn't running as the wedding account yet) it just waits there.
 * Rate limited per address (3 an hour) and overall. Until RESEND_LIVE is "yes", it only sends to test households
 * (so nothing reaches real guests before invites go out).
 */
function resendLink_(email) {
  const same = { ok: true }
  email = String(email || "").trim().toLowerCase().slice(0, 120)
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, code: "bad_email", error: ERRORS.bad_email }
  const cache = CacheService.getScriptCache()
  const hour = Math.floor(Date.now() / 3600000)
  const per = "rs:" + email + ":" + hour
  const all = "rs:all:" + hour
  const nPer = Number(cache.get(per) || 0)
  const nAll = Number(cache.get(all) || 0)
  if (nPer >= 3 || nAll >= 30) return same
  cache.put(per, String(nPer + 1), 3700)
  cache.put(all, String(nAll + 1), 3700)
  const h = households_().find((x) => x.emails.some((e) => e.toLowerCase() === email))
  if (!h) return same
  if (String(prop_("RESEND_LIVE")).toLowerCase() !== "yes" && !TEST_HOUSEHOLD.test(h.name)) return same
  safely_(() => {
    const mail = buildEmail_({
      eyebrow: "Your invite link",
      heading: "Here's your invite",
      paragraphs: ["Hi " + h.name + ",", "Someone asked for your link to " + FIRST + " and " + SECOND + "'s wedding site. Here it is."],
      button: { label: "Open your invite", url: h.link },
      notes: ["This link is just for your household, so please don't share it.", "If you didn't ask for this, you can ignore it."],
    })
    // Queued, not sent here: the wedding account's queue sends it (or holds it until it can)
    queueOut_({ to: email, subject: "Your link for " + COUPLE + "'s wedding", body: mail.text, htmlBody: mail.html }, h.token)
    log_(h.name, h.token, "Link re-sent to " + email + " (asked on the site, queued)", "")
  })
  return same
}

// ---------- describing changes ----------

function status_(g) {
  if (g.attending === "yes") return g.dietary && g.dietary !== "None" ? "coming (" + g.dietary + ")" : "coming"
  if (g.attending === "no") return "can't make it"
  return "no answer"
}

function describeChanges_(b, a) {
  const lines = []
  if (!b.respondedAt) {
    lines.push("First reply: " + a.guests.map((g) => g.firstName + " " + status_(g)).join(", "))
  } else {
    a.guests.forEach((g) => {
      const old = b.guests.find((x) => x.id === g.id) || {}
      if (old.firstName && old.firstName !== g.firstName) lines.push(old.firstName + " is now " + g.firstName)
      if (old.attending !== g.attending) lines.push(g.firstName + ": " + status_(old) + " → " + status_(g))
      else if (g.attending === "yes" && old.dietary !== g.dietary) lines.push(g.firstName + ": dietary now " + g.dietary)
    })
  }
  if (b.arrival !== a.arrival || b.departure !== a.departure) {
    lines.push("Dates: arriving " + (shortDate_(a.arrival) || "not set") + ", leaving " + (shortDate_(a.departure) || "not set"))
  }
  const added = a.songs.filter((s) => b.songs.indexOf(s) < 0).map((s) => "added '" + s + "'")
  const removed = b.songs.filter((s) => a.songs.indexOf(s) < 0).map((s) => "removed '" + s + "'")
  if (added.length || removed.length) lines.push("Songs: " + added.concat(removed).join(", "))
  if (b.photos !== a.photos && a.photos !== null) lines.push(a.photos ? "Photos: happy to be in shared photos" : "Photos: please leave us out of shared photos")
  if (b.message !== a.message) lines.push(!b.message ? "Message added" : !a.message ? "Message removed" : "Message updated")
  if (!lines.length) lines.push("No changes")
  return lines
}

// ---------- confirmation email ----------

function sendConfirmation_(h, changes) {
  const emails = emailsFor_(h.token)
  if (!emails.length) return
  const coming = h.guests.filter((g) => g.attending === "yes")
  const heading =
    coming.length === h.guests.length
      ? "You're all set, see you in Kyoto"
      : coming.length === 0
        ? "Thanks for letting us know, we'll miss you"
        : "Thanks, here's who's coming"

  const rows = h.guests.map((g) => [g.firstName, g.attending === "yes" ? status_(g).replace(/^c/, "C") : g.attending === "no" ? "Can't make it" : "No answer yet"])
  if (coming.length) {
    if (h.arrival || h.departure) rows.push(["Dates", "Arriving " + (shortDate_(h.arrival) || "not set") + ", leaving " + (shortDate_(h.departure) || "not set")])
    if (h.songs.length) rows.push(["Songs", h.songs.join(", ")])
  }

  const mail = buildEmail_({
    heading: heading,
    paragraphs: ["Hi " + h.displayName + ","],
    list: changes && changes[0] !== "No changes" ? { title: "What changed", items: changes } : null,
    rows: rows,
    button: { label: "See or change your reply", url: linkFor_(h.token) },
    notes: [changeLine_(), "This link is just for your household, so please don't share it."],
  })
  MailApp.sendEmail({
    to: emails.join(","),
    replyTo: prop_("REPLY_TO"),
    name: COUPLE,
    subject: (changes ? "Updated: your" : "Your") + " reply for " + COUPLE + "'s wedding",
    body: mail.text,
    htmlBody: mail.html,
  })
}

function droppedNames_(b, a) {
  return a.guests
    .filter((g) => {
      const old = b.guests.find((x) => x.id === g.id)
      return old && old.attending === "yes" && g.attending === "no"
    })
    .map((g) => g.firstName)
}

function notifyDropped_(household, names) {
  if (String(prop_("NOTIFY_CHANGES")).toLowerCase() !== "yes" || !names.length) return
  const list = names.join(", ")
  MailApp.sendEmail({
    to: prop_("REPLY_TO"),
    subject: "Reply change: " + list + " can't make it now",
    body: household + " changed their RSVP.\n\n" + list + ": coming → can't make it\n\nSee the Log tab for details.",
  })
}

// ---------- invites (menu) ----------

function sendInvitesTest() {
  const ui = SpreadsheetApp.getUi()
  if (!menuFromWedding_(ui)) return
  const props = PropertiesService.getScriptProperties()
  const current = prop_("TEST_EMAIL") || prop_("REPLY_TO")
  const answer = ui.prompt("Send test invites", "Test invites go only to this address (leave blank to use " + current + "):", ui.ButtonSet.OK_CANCEL)
  if (answer.getSelectedButton() !== ui.Button.OK) return
  const to = answer.getResponseText().trim() || current
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return ui.alert("That doesn't look like an email address.")
  props.setProperty("TEST_EMAIL", to)

  const list = households_().slice(0, TEST_SAMPLE)
  if (!list.length) return ui.alert("No households with tokens yet. Run \"Make tokens + links for new rows\" first.")
  if (MailApp.getRemainingDailyQuota() < list.length) return ui.alert("Not enough emails left today. Try again tomorrow.")
  list.forEach((h) => {
    const mail = inviteEmail_("invite", h, "Test: the real invite would go to " + (h.emails.join(", ") || "nobody (no email, text them the link)"))
    MailApp.sendEmail({ to: to, replyTo: prop_("REPLY_TO"), name: COUPLE, subject: "[TEST] " + mail.subject, body: mail.text, htmlBody: mail.html })
  })
  log_("(test send)", "", "Test invites: " + list.length + " sent to the test address. Invite sent not filled.", "")
  PropertiesService.getScriptProperties().setProperty("last_test_send", new Date().toISOString() + " · " + list.length)
  ui.alert("Sent " + list.length + " test invite" + (list.length === 1 ? "" : "s") + " to " + to + ".\n\n\"Invite sent\" was not filled in. Nobody else got anything.")
}

function sendInvitesAll() {
  const ui = SpreadsheetApp.getUi()
  if (!menuFromWedding_(ui)) return
  const all = households_()
  const todo = all.filter((h) => !h.invited)
  const withEmail = todo.filter((h) => h.emails.length)
  const noEmail = todo.filter((h) => !h.emails.length)
  if (!todo.length) return ui.alert("Everyone has been invited already.")
  const emailCount = withEmail.reduce((n, h) => n + h.emails.length, 0)
  const quota = MailApp.getRemainingDailyQuota()
  const ok = ui.alert(
    "Send invites",
    "Send invites to " + withEmail.length + " household" + (withEmail.length === 1 ? "" : "s") + " (" + emailCount + " email" + (emailCount === 1 ? "" : "s") + ")?\n\n" +
      (noEmail.length ? noEmail.length + " household" + (noEmail.length === 1 ? " has" : "s have") + " no email. You'll get their links at the end to text them.\n\n" : "") +
      "Gmail allows about " + quota + " more emails today." + (emailCount > quota ? " This will stop when it runs out, then you can run it again tomorrow." : ""),
    ui.ButtonSet.OK_CANCEL,
  )
  if (ok !== ui.Button.OK) return
  ensureEmailsTab_()
  const result = sendBatch_("invite", withEmail, true)
  showResult_(
    "Invites sent",
    "Sent: " + result.sent + " household" + (result.sent === 1 ? "" : "s") + ".\n" +
      (result.left ? "Not sent yet (daily limit): " + result.left + ". Run this again tomorrow, it picks up where it stopped.\n" : "") +
      (noEmail.length ? "\nNo email, text these links:\n" + noEmail.map((h) => h.name + ": " + h.link).join("\n") + "\n" : ""),
  )
}

function resendInviteSelected() {
  const ui = SpreadsheetApp.getUi()
  if (!menuFromWedding_(ui)) return
  const s = SpreadsheetApp.getActiveSheet()
  const rowNum = s.getActiveRange() ? s.getActiveRange().getRow() : 0
  if (s.getName() !== TABS.guests || rowNum < 2) return ui.alert("Click any cell in the household's row on the Guests tab, then try again.")
  const head = headers_(s)
  const token = String(s.getRange(rowNum, head.Token + 1).getValue())
  const h = households_().find((x) => x.token === token)
  if (!h) return ui.alert("That row has no token yet. Run \"Make tokens + links for new rows\" first.")
  if (!h.emails.length) return ui.alert(h.name + " has no email. Text them this link:\n\n" + h.link)
  const ok = ui.alert("Resend invite", "Send the invite to " + h.name + " (" + h.emails.join(", ") + ")?", ui.ButtonSet.OK_CANCEL)
  if (ok !== ui.Button.OK) return
  ensureEmailsTab_()
  const result = sendBatch_("invite", [h], true)
  ui.alert(result.sent ? "Sent to " + h.name + "." : "Gmail's daily limit is used up. Try again tomorrow.")
}

function sendReminders() {
  const ui = SpreadsheetApp.getUi()
  if (!menuFromWedding_(ui)) return
  const list = households_().filter((h) => h.invited && !h.responded && h.emails.length)
  if (!list.length) return ui.alert("Nobody to remind. Every invited household with an email has replied.")
  const emailCount = list.reduce((n, h) => n + h.emails.length, 0)
  const ok = ui.alert(
    "Send reminders",
    "Send a reminder to " + list.length + " household" + (list.length === 1 ? "" : "s") + " who haven't replied (" + emailCount + " email" + (emailCount === 1 ? "" : "s") + ")?\n\nGmail allows about " + MailApp.getRemainingDailyQuota() + " more emails today.",
    ui.ButtonSet.OK_CANCEL,
  )
  if (ok !== ui.Button.OK) return
  ensureEmailsTab_()
  const result = sendBatch_("reminder", list, false)
  ui.alert("Sent " + result.sent + " reminder" + (result.sent === 1 ? "" : "s") + "." + (result.left ? "\n\n" + result.left + " not sent (daily limit). Run it again tomorrow." : ""))
}

/** Sends one email per household. Stops cleanly when Gmail's daily limit would be passed. */
/** Sending from the menu: only when signed in as the wedding account (emails go from whoever runs them). */
function menuFromWedding_(ui) {
  if (isWeddingAccount_()) return true
  ui.alert("Sign in as the wedding account", "You're signed in as " + (runningAs_() || "an unknown account") + ". Emails go from whoever sends them, so open this sheet signed in as " + prop_("REPLY_TO") + " and try again.", ui.ButtonSet.OK)
  return false
}

function sendBatch_(kind, list, markInvited) {
  const gSheet = sheet_(TABS.guests)
  const head = headers_(gSheet)
  let sent = 0
  for (let i = 0; i < list.length; i++) {
    const h = list[i]
    if (MailApp.getRemainingDailyQuota() < h.emails.length) return { sent: sent, left: list.length - i }
    const mail = inviteEmail_(kind, h)
    MailApp.sendEmail({ to: h.emails.join(","), replyTo: prop_("REPLY_TO"), name: COUPLE, subject: mail.subject, body: mail.text, htmlBody: mail.html })
    if (markInvited) h.rows.forEach((r) => gSheet.getRange(r, head["Invite sent"] + 1).setValue(new Date()))
    log_(h.name, h.token, ({ invite: "Invite", reminder: "Reminder", final: "Final numbers note" })[kind] + " sent to " + h.emails.join(", "), "")
    SpreadsheetApp.flush()
    sent++
  }
  return { sent: sent, left: 0 }
}

function inviteEmail_(kind, h, testNote) {
  const copy = emailCopy_()
  const fill = (s) =>
    String(s)
      .replace(/\{household\}/g, h.name)
      .replace(/\{rsvp_by\}/g, longDate_(prop_("RSVP_BY")))
      .replace(/\{lock\}/g, longDate_(prop_("CHANGES_LOCK")))
      .replace(/\{date\}/g, WEDDING.date)
      .replace(/\{venue\}/g, WEDDING.venue)
  const mail = buildEmail_({
    eyebrow: testNote || "",
    heading: fill(copy[kind + "_heading"]),
    paragraphs: fill(copy[kind + "_body"]).split(/\n\s*\n/),
    rows: [["When", WEDDING.date], ["Where", WEDDING.venue]],
    button: { label: fill(copy[kind + "_button"]), url: h.link },
    notes: ["This link is just for your household, so please don't share it."],
  })
  mail.subject = fill(copy[kind + "_subject"])
  return mail
}

/** Households from the Guests tab, grouped by Token. Rows without a token are skipped. */
function households_() {
  const s = sheet_(TABS.guests)
  const head = headers_(s)
  const data = s.getDataRange().getValues()
  const responded = {}
  rows_(TABS.rsvps).forEach((r) => (responded[r.Token] = Boolean(r["Responded at"])))
  const byToken = {}
  const order = []
  for (let i = 1; i < data.length; i++) {
    const token = String(data[i][head.Token] || "").trim()
    if (!token) continue
    if (!byToken[token]) {
      byToken[token] = { token: token, name: String(data[i][head.Household] || ""), link: linkFor_(token), emails: [], rows: [], invited: false, responded: Boolean(responded[token]) }
      order.push(token)
    }
    const h = byToken[token]
    const email = String(data[i][head.Email] || "").trim()
    if (email && h.emails.indexOf(email) < 0) h.emails.push(email)
    if (data[i][head["Invite sent"]]) h.invited = true
    h.rows.push(i + 1)
  }
  return order.map((t) => byToken[t])
}

function showResult_(title, text) {
  const html = HtmlService.createHtmlOutput(
    '<div style="font:14px/1.5 Arial,sans-serif"><textarea readonly style="width:100%;height:300px;font:13px/1.5 Arial,sans-serif">' + esc_(text) + "</textarea>" +
      '<p style="color:#666">Copy anything you need before closing.</p></div>',
  )
    .setWidth(520)
    .setHeight(400)
  SpreadsheetApp.getUi().showModalDialog(html, title)
}

// ---------- gentle reminder (off until scheduled) ----------

const REMINDER_DEFAULT = "2027-02-01T10:00:00+11:00" // Mon 1 Feb 2027, 10 am Melbourne

/** Sets a one-off trigger for the reminder. Nothing is scheduled until someone runs this. */
function scheduleReminder() {
  const ui = SpreadsheetApp.getUi()
  const at = new Date(prop_("REMINDER_AT") || REMINDER_DEFAULT)
  if (isNaN(at) || at < new Date()) return ui.alert("REMINDER_AT needs to be a future date, like 2027-02-01T10:00:00+11:00.")
  const ok = ui.alert("Schedule the reminder", "On " + Utilities.formatDate(at, "Australia/Melbourne", "EEE d MMM yyyy, h:mm a") + " (Melbourne), every invited household with an email that hasn't replied gets the reminder email. Schedule it?", ui.ButtonSet.OK_CANCEL)
  if (ok !== ui.Button.OK) return
  cancelReminder(true)
  ScriptApp.newTrigger("sendScheduledReminder").timeBased().at(at).create()
  ui.alert("Scheduled. Cancel any time from the Wedding site menu.")
}

function cancelReminder(quiet) {
  ScriptApp.getProjectTriggers().filter((t) => t.getHandlerFunction() === "sendScheduledReminder").forEach((t) => ScriptApp.deleteTrigger(t))
  if (quiet !== true) SpreadsheetApp.getUi().alert("The February reminder is off.")
}

/** Runs from the trigger: same list and limits as "Send a reminder…", no dialog. */
function sendScheduledReminder() {
  if (!isWeddingAccount_()) return wrongAccount_("The scheduled reminder") // made from another account: send nothing
  const list = households_().filter((h) => h.invited && !h.responded && h.emails.length)
  const result = sendBatch_("reminder", list, false)
  log_("Everyone", "", "Scheduled reminder: sent " + result.sent + (result.left ? ", " + result.left + " left (daily limit)" : ""), "")
  cancelReminder(true)
}

// ---------- Emails tab ----------

/** Menu only: before final numbers go to the venue, asks households who are coming to check their reply. */
function sendFinalNumbers() {
  const ui = SpreadsheetApp.getUi()
  if (!menuFromWedding_(ui)) return
  if (isLocked_()) return ui.alert("Changes are already closed, so there's nothing for guests to update.")
  const coming = {}
  rows_(TABS.guests).forEach((g) => { if (g.Attending === "yes") coming[g.Token] = true })
  const list = households_().filter((h) => h.responded && coming[h.token] && h.emails.length && !TEST_HOUSEHOLD.test(h.name))
  if (!list.length) return ui.alert("No households who are coming have an email yet.")
  const ok = ui.alert("Send \"Final numbers soon\"", "Send it to " + list.length + " household" + (list.length === 1 ? "" : "s") + " who are coming?\n\nGmail allows about " + MailApp.getRemainingDailyQuota() + " more emails today.", ui.ButtonSet.OK_CANCEL)
  if (ok !== ui.Button.OK) return
  const result = sendBatch_("final", list, false)
  ui.alert("Sent " + result.sent + "." + (result.left ? "\n\n" + result.left + " not sent (daily limit). Run it again tomorrow." : ""))
}

function setupEmailsTab() {
  const created = ensureEmailsTab_()
  SpreadsheetApp.getUi().alert(created ? "Added the Emails tab. Edit the Text column to change the invite and reminder wording." : "The Emails tab is already there.")
}

function ensureEmailsTab_() {
  const ss = SpreadsheetApp.getActive()
  if (ss.getSheetByName(TABS.emails)) return false
  const s = ss.insertSheet(TABS.emails)
  const rows = [["Key", "Text", "Notes"]].concat(
    Object.keys(COPY).map((k) => [k, COPY[k], k.indexOf("body") > 0 ? "Blank line = new paragraph. {household} and {rsvp_by} are filled in." : ""]),
  )
  s.getRange(1, 1, rows.length, 3).setValues(rows)
  s.getRange(1, 1, 1, 3).setFontWeight("bold")
  s.setColumnWidth(1, 160)
  s.setColumnWidth(2, 520)
  s.setColumnWidth(3, 320)
  s.getRange(2, 2, rows.length - 1, 1).setWrap(true)
  s.getRange(1, 1).setNote("Edit the Text column only. Don't rename the Key column or the tab. Delete a row to go back to the built-in wording.")
  return true
}

function emailCopy_() {
  const copy = Object.assign({}, COPY)
  if (!SpreadsheetApp.getActive().getSheetByName(TABS.emails)) return copy
  rows_(TABS.emails).forEach((r) => {
    if (r.Key in copy && String(r.Text || "").trim()) copy[r.Key] = String(r.Text)
  })
  return copy
}

// ---------- queue check ----------

/** What's queued, by household (test or not), before anything is sent. Optionally writes and sends it now. */
function checkQueue() {
  const ui = SpreadsheetApp.getUi()
  const all = PropertiesService.getScriptProperties().getProperties()
  const keys = Object.keys(all).filter((k) => k.indexOf("q:") === 0)
  if (!keys.length) return ui.alert("The queue is empty.")
  const names = {}
  households_().forEach((h) => (names[h.token] = h.name))
  const lines = { save: [], mail: [], out: [], open: 0, started: 0 }
  let real = 0
  keys.forEach((k) => {
    const kind = k.split(":")[1]
    // Outbox items (Ask us, "Send my link", answers) keep their household's token inside; older ones have none
    let token = k.split(":")[2]
    if (kind === "out") { try { token = JSON.parse(all[k]).token || "" } catch (err) { token = "" } }
    const name = names[token] || (kind === "out" ? "No household (a question to you, or from before 19 Oct)" : "Unknown link")
    if (!(kind in lines)) return
    if (kind === "open" || kind === "started") return lines[kind]++
    const test = TEST_HOUSEHOLD.test(name)
    if (!test) real++
    lines[kind].push(name + (test ? "" : "  (not a test household)"))
  })
  let trigger = "unknown"
  try { trigger = hasFlushTrigger_() ? "set up" : "missing" } catch (err) { trigger = "can't check: " + err }
  const last = Number(PropertiesService.getScriptProperties().getProperty("last_flush_at") || 0)
  const text = "Replies waiting to be written: " + lines.save.length + (lines.save.length ? "\n  " + lines.save.join("\n  ") : "") +
    "\nConfirmation emails waiting: " + lines.mail.length + (lines.mail.length ? "\n  " + lines.mail.join("\n  ") : "") +
    "\nOther emails waiting (Ask us, links, answers): " + lines.out.length + (lines.out.length ? "\n  " + lines.out.join("\n  ") : "") +
    "\nVisit counts waiting: " + lines.open + " opens, " + lines.started + " started" +
    "\n\nMinute trigger: " + trigger + ". Last run: " + (last ? new Date(last).toString() : "not recorded") +
    "\nThe queue last ran as: " + ({ wedding: "the wedding account", other: "another account (emails held)" }[PropertiesService.getScriptProperties().getProperty("queue_account")] || "not recorded yet") +
    (CacheService.getScriptCache().get("queue_err") ? "\n" + CacheService.getScriptCache().get("queue_err") : "") +
    (real ? "\n\n" + real + " item(s) are for households that aren't test households. Sending will email them." : "") +
    "\n\nWrite the replies and visits and send the emails now?"
  if (ui.alert("Email queue", text, ui.ButtonSet.YES_NO) !== ui.Button.YES) return
  flushQueue()
  ui.alert("Done. " + Object.keys(PropertiesService.getScriptProperties().getProperties()).filter((k) => k.indexOf("q:") === 0).length + " left in the queue.")
}

/** Deletes queued replies, emails and visits for test households only. Nothing is written or sent. */
function clearTestQueue() {
  const ui = SpreadsheetApp.getUi()
  const props = PropertiesService.getScriptProperties()
  const tests = {}
  households_().filter((h) => TEST_HOUSEHOLD.test(h.name)).forEach((h) => (tests[h.token] = h.name))
  const all = props.getProperties()
  // Outbox items (Ask us, "Send my link") carry their household's token inside, not in the key
  const outToken = (k) => { try { return k.indexOf("q:out:") === 0 ? JSON.parse(all[k]).token : "" } catch (err) { return "" } }
  const keys = Object.keys(all).filter((k) => k.indexOf("q:") === 0 && (tests[k.split(":")[2]] || tests[outToken(k)]))
  if (!keys.length) return ui.alert("Nothing queued for test households.")
  if (ui.alert("Clear test items", "Delete " + keys.length + " queued item(s) for test households without writing or sending them?", ui.ButtonSet.OK_CANCEL) !== ui.Button.OK) return
  keys.forEach((k) => props.deleteProperty(k))
  ui.alert("Cleared " + keys.length + ".")
}

// ---------- test data ----------

// Households named like "Jehan (Test)" or "Test · Family". Real households never match.
const TEST_HOUSEHOLD = /(^test\b|\(test\))/i

/** Clears answers, songs, Log rows and visit counts for test households. Keeps their Guests rows. */
function resetTestHouseholds() {
  const ui = SpreadsheetApp.getUi()
  const tests = households_().filter((h) => TEST_HOUSEHOLD.test(h.name))
  if (!tests.length) return ui.alert("No test households found.")
  const ok = ui.alert("Reset test households", "Clear answers, songs, Log rows, visits, stamps and duplicate flags for:\n\n" + tests.map((h) => h.name).join("\n") + "\n\nTheir rows on Guests stay.", ui.ButtonSet.OK_CANCEL)
  if (ok !== ui.Button.OK) return
  resetHouseholds_(tests.map((h) => h.token))
  ui.alert("Reset " + tests.length + " test household" + (tests.length === 1 ? "" : "s") + ".")
}

/** Clears answers, songs, Log rows, visits, stamps and duplicate flags for these tokens. Guests rows stay. */
function resetHouseholds_(tokens) {
  const props = PropertiesService.getScriptProperties()
  const g = sheet_(TABS.guests)
  const head = headers_(g)
  const data = g.getDataRange().getValues()
  for (let i = 1; i < data.length; i++) {
    if (tokens.indexOf(String(data[i][head.Token]).trim()) < 0) continue
    ;["Attending", "Dietary", "Invite sent", "Stamps", "Flying from"].concat(VISITS).forEach((k) => {
      if (k in head) g.getRange(i + 1, head[k] + 1).setValue("")
    })
    if ("Notes" in head) {
      const note = String(data[i][head.Notes] || "").replace(/\s*Possible duplicate: [^\n]*/g, "").trim()
      g.getRange(i + 1, head.Notes + 1).setValue(note)
    }
    const id = String(data[i][head["Guest ID"]])
    if (props.getProperty("plusone_" + id)) {
      g.getRange(i + 1, head["First name"] + 1).setValue("Guest")
      props.deleteProperty("plusone_" + id)
    }
  }
  ;[TABS.rsvps, TABS.songs, TABS.log].forEach((name) => {
    const s = sheet_(name)
    const col = headers_(s).Token
    const rows = s.getDataRange().getValues()
    for (let i = rows.length - 1; i >= 1; i--) if (tokens.indexOf(String(rows[i][col]).trim()) >= 0) s.deleteRow(i + 1)
  })
  forgetAllHouseholds_()
}

/**
 * Creates the 1-minute trigger that sends confirmation emails and writes visit counts. A trigger runs as whoever
 * made it, and its emails come from that account, so this only runs signed in as the wedding account (REPLY_TO).
 * On 16 Oct it was turned on from Jehan's own account and guests' confirmations would have come from his Gmail.
 */
function setupQueue() {
  // Google's consent screen lets people untick single permissions. This asks again for the ones the queue needs:
  // triggers ("run when you are not present") and the signed-in address, to check it's the wedding account.
  ScriptApp.requireScopes(ScriptApp.AuthMode.FULL, ["https://www.googleapis.com/auth/script.scriptapp", "https://www.googleapis.com/auth/userinfo.email"])
  const ui = SpreadsheetApp.getUi()
  const me = String(Session.getEffectiveUser().getEmail() || "").toLowerCase()
  const wedding = String(prop_("REPLY_TO")).toLowerCase()
  const props = PropertiesService.getScriptProperties()
  if (me !== wedding) {
    props.setProperty("queue_account", "other")
    return ui.alert("Sign in as the wedding account", "You're signed in as " + (me || "an unknown account") + ". Emails from the queue come from whoever turns it on, so open this sheet signed in as " + wedding + " and run this again.\n\nIf you turned it on from this account before, remove that one: Extensions → Apps Script → Triggers (the clock), then delete flushQueue.", ui.ButtonSet.OK)
  }
  // Start clean: a trigger that stopped running stays listed, so remove any old one and make a fresh one
  ScriptApp.getProjectTriggers().filter((t) => t.getHandlerFunction() === "flushQueue").forEach((t) => ScriptApp.deleteTrigger(t))
  props.deleteProperty("flush_trigger")
  const ok = flushTriggerReady_()
  if (ok) props.setProperty("queue_account", "wedding")
  ui.alert(ok ? "The email queue is on, sending from " + wedding + ". If you ever turned it on from another account, delete that trigger there (Extensions → Apps Script → Triggers)." : "Couldn't turn it on: " + (CacheService.getScriptCache().get("trigger_err") || "unknown error"))
}

function checkSongSearch() {
  const r = searchSongs_("September Earth Wind")
  SpreadsheetApp.getUi().alert(
    r.ok ? "Song search works (" + (PropertiesService.getScriptProperties().getProperty("SPOTIFY_CLIENT_ID") ? "Spotify, or iTunes if Spotify says no" : "iTunes") + "). First result: " + (r.results[0] ? r.results[0].title + ", " + r.results[0].artist : "none")
      : "Song search didn't work just now. Guests can still type songs. Check Executions for the error.",
  )
}

// ---------- tokens ----------

/** Fills Token (shared per household) and Link for any guest rows that don't have them yet. */
function makeTokensAndLinks() {
  const s = sheet_(TABS.guests)
  const head = headers_(s)
  const data = s.getDataRange().getValues()
  const byHousehold = {}
  for (let i = 1; i < data.length; i++) if (data[i][head.Token]) byHousehold[data[i][head.Household]] = data[i][head.Token]
  for (let i = 1; i < data.length; i++) {
    const hh = data[i][head.Household]
    if (!hh) continue
    let token = data[i][head.Token]
    if (!token) {
      token = byHousehold[hh] || makeToken_()
      byHousehold[hh] = token
      s.getRange(i + 1, head.Token + 1).setValue(token)
    }
    s.getRange(i + 1, head.Link + 1).setValue(linkFor_(token))
  }
}

function makeToken_() {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789" // no look-alikes
  let t = ""
  for (let i = 0; i < 10; i++) t += chars[Math.floor(Math.random() * chars.length)]
  return t
}

// ---------- email layout ----------

/**
 * Plain, text-first emails: no images, no capitals styling, one link. A light HTML version in the
 * site's colours plus the same words as plain text, so they read well anywhere and stay out of spam.
 */
function buildEmail_(m) {
  const c = { ink: "#421a05", body: "#754b38", muted: "#8b5a3c", line: "#e5d0a8", link: "#a43108", button: "#a84f32", onButton: "#fbf5ea" }
  // The site's type in email terms: a serif for the heading (Oranienbaum can't load in mail), the system sans
  // for everything else (Inter's job on the site)
  const serif = "Georgia, 'Times New Roman', serif"
  const font = "Inter, -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"
  const p = (s, size, colour) => '<p style="margin:0 0 14px;font:' + (size || 16) + "px/1.55 " + font + ";color:" + (colour || c.body) + '">' + esc_(s).replace(/\n/g, "<br>") + "</p>"
  let html = '<div style="max-width:520px;margin:0 auto;padding:24px 16px">'
  let text = ""
  if (m.eyebrow) { html += p(m.eyebrow, 14, c.link); text += m.eyebrow + "\n\n" }
  html += '<h1 style="margin:0 0 18px;font:400 28px/1.25 ' + serif + ";color:" + c.ink + '">' + esc_(m.heading) + "</h1>"
  text += m.heading + "\n\n"
  ;(m.paragraphs || []).forEach((x) => { html += p(x); text += x + "\n\n" })
  if (m.list) {
    html += p(m.list.title, 16, c.ink) + '<ul style="margin:0 0 18px;padding-left:20px;font:16px/1.55 ' + font + ";color:" + c.body + '">' + m.list.items.map((i) => "<li>" + esc_(i) + "</li>").join("") + "</ul>"
    text += m.list.title + ":\n" + m.list.items.map((i) => "- " + i).join("\n") + "\n\n"
  }
  if (m.rows && m.rows.length) {
    html += '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 20px;border-top:1px solid ' + c.line + '">' +
      m.rows.map((r) => '<tr><td style="padding:8px 12px 8px 0;border-bottom:1px solid ' + c.line + ";font:500 16px/1.4 " + font + ";color:" + c.ink + ';vertical-align:top">' + esc_(r[0]) + '</td><td style="padding:8px 0;border-bottom:1px solid ' + c.line + ";font:16px/1.4 " + font + ";color:" + c.body + '">' + esc_(r[1]) + "</td></tr>").join("") +
      "</table>"
    text += m.rows.map((r) => r[0] + ": " + r[1]).join("\n") + "\n\n"
  }
  if (m.button) {
    html += '<p style="margin:4px 0 22px"><a href="' + esc_(m.button.url) + '" style="display:inline-block;background:' + c.button + ";color:" + c.onButton + ";text-decoration:none;font:500 16px/1 " + font + ';padding:14px 24px;border-radius:8px">' + esc_(m.button.label) + "</a></p>"
    text += m.button.label + ":\n" + m.button.url + "\n\n"
  }
  ;(m.notes || []).forEach((n) => { html += p(n, 14, c.muted); text += n + "\n" })
  html += p(COUPLE, 18, c.ink).replace("margin:0 0 14px", "margin:20px 0 0") + "</div>"
  text += "\n" + COUPLE
  return { html: html, text: text }
}

// ---------- helpers ----------

function prop_(key) {
  return PropertiesService.getScriptProperties().getProperty(key) || DEFAULTS[key]
}

function linkFor_(token) {
  return prop_("SITE_URL") + "/?h=" + token
}

function emailsFor_(token) {
  return rows_(TABS.guests)
    .filter((r) => r.Token === token)
    .map((r) => String(r.Email || "").trim())
    .filter((e, i, all) => e && all.indexOf(e) === i)
}

// ---------- tidy the sheets (run 19): a report that changes nothing, then "do it" only when Jehan clicks it ----------
//
// Never deletes a row of anyone's data: test-era Log rows and stale helper columns are copied to the Archive tab
// exactly as they are (copyTo keeps the leading ' on guest text), checked, and only then taken out of their tab.
// Columns are never renamed or reordered (ask_ appends to Questions by position, everything else goes by header).

const TAB_ORDER = ["Summary", "Guests", "RSVPs", "Questions", "Songs", "Content", "How to update"]
const TAB_LAST = ["Crew", "Log", "Archive"]
const ARCHIVE = "Archive"
const DATA_TABS = [TABS.guests, TABS.rsvps, TABS.questions, TABS.songs, "Content", TABS.emails, "Crew", TABS.log]
const LOOK_TITLE = "To look at"
const LOOK_ITEMS = 10
const LOOK_ROWS = LOOK_ITEMS + 3 // the title, the headings, the items, one blank row above what was there
const LOOK_BG = "#f6f0e1" // cream paper
const DATE_FORMAT = "d mmm yyyy, h:mm am/pm"
const TIMESTAMPS = ["Time", "Responded at", "Added at", "First opened", "Last opened", "Started RSVP", "Invite sent", "Sent", "Seen at"]
const WIDTHS = {
  Household: 180, "Guest ID": 80, "First name": 120, "Last name": 120, Email: 220, Phone: 120, Token: 110, Link: 300,
  Attending: 90, Dietary: 200, Notes: 240, Arriving: 110, Leaving: 110, Message: 320, "Photos OK": 90, Seen: 60,
  Song: 260, Question: 320, Status: 100, Answer: 320, "Answer (ja)": 280, Publish: 80, Kind: 120, Coming: 200,
  "Not coming": 160, Songs: 220, Dates: 150, Flag: 220, "What changed": 320, Payload: 160, Key: 160, Text: 480,
  Name: 140, Role: 100, "Kit link": 360, "Lab link": 360, Stamps: 160, "Flying from": 160,
}
TIMESTAMPS.forEach((k) => (WIDTHS[k] = WIDTHS[k] || 170))
// Every column the back end or the docs know, per tab. Anything else is a "helper" column (only moved when empty)
const KNOWN_COLUMNS = {
  Guests: ["Household", "Guest ID", "First name", "Last name", "Email", "Phone", "Token", "Link", "Attending", "Dietary", "Notes", "Invite sent", "Stamps", "Flying from", "Flying id", "Flying region", "Flying country", "Flying lat", "Flying lon"].concat(VISITS),
  RSVPs: ["Token", "Household", "Arriving", "Leaving", "Message", "Responded at", "Photos OK", "Seen", "Seen at"],
  Songs: ["Token", "Household", "Song", "Added at"],
  Questions: QUESTION_HEAD,
  Log: LOG_COLUMNS,
}

/** The tabs in their tidy order: the main ones first, any others where they are, then Crew, Log and Archive. */
function tabOrder_(names) {
  const first = TAB_ORDER.filter((n) => names.indexOf(n) >= 0)
  const last = TAB_LAST.filter((n) => names.indexOf(n) >= 0)
  return first.concat(names.filter((n) => first.indexOf(n) < 0 && last.indexOf(n) < 0), last)
}

const time_ = (v) => (v instanceof Date ? v.getTime() : v ? new Date(v).getTime() : NaN)

/**
 * Test-era Log rows: every row from before the first real invite went out (Kind "Invite sent", or the older rows'
 * wording). Nothing until an invite has gone. log: the Log tab as objects. Returns sheet row numbers and what they are.
 */
function testEraRows_(log) {
  const invite = (r) => r.Kind === "Invite sent" || /^Invite sent/.test(String(r["What changed"] || ""))
  const firsts = log.filter(invite).map((r) => time_(r.Time)).filter((t) => !isNaN(t))
  if (!firsts.length) return { cutoff: null, rows: [] }
  const cutoff = Math.min.apply(null, firsts)
  const rows = []
  log.forEach((r, i) => { const t = time_(r.Time); if (!isNaN(t) && t < cutoff) rows.push({ row: i + 2, time: t, kind: String(r.Kind || logKind_(String(r["What changed"] || ""))), household: String(r.Household || "") }) })
  return { cutoff: cutoff, rows: rows }
}

/**
 * Helper columns that would move to Archive: to the right of every column we know, and either empty under a heading
 * we don't know, or holding something under no heading at all. A column of someone's own notes under a heading of
 * their own stays put (listed as left). header: row 1; filled: per column, whether any cell under it has something.
 */
function staleColumns_(tab, header, filled) {
  const known = KNOWN_COLUMNS[tab]
  if (!known) return { move: [], left: [] }
  const name = (i) => String(header[i] == null ? "" : header[i]).trim()
  let lastKnown = -1
  header.forEach((h, i) => { if (known.indexOf(name(i)) >= 0) lastKnown = i })
  const move = [], left = []
  header.forEach((h, i) => {
    if (i <= lastKnown || known.indexOf(name(i)) >= 0) return
    const col = { col: i + 1, header: name(i), filled: Boolean(filled[i]) }
    if (name(i) ? !col.filled : col.filled) move.push(col)
    else if (name(i)) left.push(col)
  })
  return { move: move, left: left }
}

/**
 * Empty rows in the middle of a tab (all blank, apart from an unticked box) and the rows under them, which move up so
 * the next new row lands straight under the others. A tickbox made with insertCheckboxes holds FALSE on every row,
 * and appendRow then writes after the last of them (Questions made by questionsSheet_ put new questions at row 1001).
 * rows: the data rows under the header; boxes: the tickbox columns (0-based). Sheet row numbers.
 */
function gapPlan_(rows, boxes) {
  const empty = (r) => r.every((v, c) => v === "" || v === null || (v === false && boxes.indexOf(c) >= 0))
  const clear = [], moves = []
  let next = 0 // the first empty row, once there is one: where the next row with something in it goes
  rows.forEach((r, i) => {
    if (empty(r)) { if (r.some((v) => v === false)) clear.push(i + 2); if (!next) next = i + 2; return }
    if (next) moves.push({ from: i + 2, to: next++ })
  })
  return { clear: clear, moves: moves }
}

/** A reply the household changed after it was ticked Seen (its Responded at is later than Seen at). */
function changedSinceSeen_(r) {
  return r.Seen === true && !isNaN(time_(r["Seen at"])) && time_(r["Responded at"]) > time_(r["Seen at"])
}

/**
 * The Summary's "To look at" box, from plain rows (each with _row, its sheet row): new questions, new or changed
 * replies since they were last ticked Seen, households who haven't replied, and the dietary needs of everyone coming.
 */
function toLookAt_(t) {
  const out = (title, tab, items) => ({ title: title, tab: tab, items: items })
  const qs = (t.questions || []).filter((r) => r.Seen !== true && (!String(r.Status || "").trim() || String(r.Status).trim() === "new"))
    .map((r) => ({ tab: TABS.questions, row: r._row, text: String(r.Household || "Someone") + ": " + String(r.Question || "").replace(/\s+/g, " ") }))
  const replies = []
  ;(t.rsvps || []).forEach((r) => {
    if (r.Seen !== true) replies.push({ tab: TABS.rsvps, row: r._row, text: "New: " + String(r.Household || r.Token) })
    else if (changedSinceSeen_(r)) replies.push({ tab: TABS.rsvps, row: r._row, text: "Changed: " + String(r.Household || r.Token) })
  })
  const replied = {}
  ;(t.rsvps || []).forEach((r) => (replied[String(r.Token)] = true))
  const waiting = [], seen = {}
  ;(t.guests || []).forEach((g) => {
    const k = String(g.Token || "")
    if (!k || seen[k] || replied[k]) return
    seen[k] = true
    waiting.push({ tab: TABS.guests, row: g._row, text: String(g.Household || g["First name"]) })
  })
  const diet = (t.guests || []).filter((g) => g.Attending === "yes" && String(g.Dietary || "").trim() && String(g.Dietary).trim() !== "None")
    .map((g) => ({ tab: TABS.guests, row: g._row, text: String(g["First name"]) + " (" + String(g.Household) + "): " + String(g.Dietary) }))
  return [out("New questions", TABS.questions, qs), out("New or changed replies", TABS.rsvps, replies), out("Not replied yet", TABS.guests, waiting), out("Dietary needs", TABS.guests, diet)]
}

/** The box as cell values: a column per list, each item a link to its row (gids: tab name to sheet id). */
function lookAtValues_(sections, gids, when) {
  const grid = Array.from({ length: LOOK_ROWS }, () => sections.map(() => ""))
  grid[0][0] = LOOK_TITLE + (when ? " (updated " + when + ")" : "")
  sections.forEach((s, c) => {
    grid[1][c] = s.title + " (" + s.items.length + ")"
    const shown = s.items.length > LOOK_ITEMS ? s.items.slice(0, LOOK_ITEMS - 1) : s.items
    shown.forEach((it, i) => {
      const label = String(it.text).replace(/[\r\n]+/g, " ").slice(0, 80).replace(/"/g, '""')
      grid[2 + i][c] = gids[it.tab] == null ? label : '=HYPERLINK("#gid=' + gids[it.tab] + "&range=A" + it.row + '","' + label + '")'
    })
    if (shown.length < s.items.length) grid[1 + LOOK_ITEMS][c] = "and " + (s.items.length - shown.length) + " more in " + s.tab
    if (!s.items.length) grid[2][c] = "Nothing"
  })
  return grid
}

function colLetter_(n) {
  let s = ""
  for (; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s
  return s
}

function numberedRows_(name) {
  return SpreadsheetApp.getActive().getSheetByName(name) ? rows_(name).map((r, i) => Object.assign(r, { _row: i + 2 })) : []
}

/** Writes (or, with make, first adds) the To look at box at the top of Summary. Refreshed on open once it's there. */
function refreshLookAt_(make) {
  const ss = SpreadsheetApp.getActive()
  let s = ss.getSheetByName("Summary")
  if (!s) { if (!make) return; s = ss.insertSheet("Summary", 0) }
  if (String(s.getRange(1, 1).getValue()).indexOf(LOOK_TITLE) !== 0) { if (!make) return; s.insertRowsBefore(1, LOOK_ROWS) }
  const gids = {}
  ss.getSheets().forEach((x) => (gids[x.getName()] = x.getSheetId()))
  const sections = toLookAt_({ questions: numberedRows_(TABS.questions), rsvps: numberedRows_(TABS.rsvps), guests: numberedRows_(TABS.guests) })
  const when = Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), "d MMM, h:mm a")
  const box = s.getRange(1, 1, LOOK_ROWS, sections.length)
  box.clearContent()
  box.setValues(lookAtValues_(sections, gids, when)).setFontWeight("normal").setFontSize(10)
  s.getRange(1, 1, LOOK_ROWS - 1, sections.length).setBackground(LOOK_BG).setVerticalAlignment("top")
  s.getRange(1, 1, 2, sections.length).setFontWeight("bold")
}

function refreshLookAt() {
  refreshLookAt_(true)
  SpreadsheetApp.getActive().toast("The To look at box on Summary is up to date.")
}

/** Simple-trigger part of onEdit: ticking Seen on an RSVPs row stamps Seen at (unticking clears it). */
function stampSeen_(e) {
  const r = e && e.range
  if (!r || r.getSheet().getName() !== TABS.rsvps) return
  const s = r.getSheet(), head = headers_(s)
  if (!("Seen" in head) || !("Seen at" in head)) return
  const c = head.Seen + 1
  if (c < r.getColumn() || c > r.getLastColumn()) return
  const top = Math.max(2, r.getRow()), n = r.getLastRow() - top + 1
  if (n < 1) return
  const seen = s.getRange(top, c, n, 1).getValues()
  s.getRange(top, head["Seen at"] + 1, n, 1).setValues(seen.map((v) => [v[0] === true ? new Date() : ""]))
}

const WEEKLY_HEAD = "Your weekly 5 minutes"
const WEEKLY_ROUTINE = [
  [WEEKLY_HEAD],
  ["1. Open Summary. The To look at box at the top has everything new (it refreshes when you open the sheet)."],
  ["2. Work through it. Each line is a link: click it to jump to that row."],
  ["3. Tick Seen on each reply and question you've read. If a household changes their reply after that, its row lights up (Changed) and it's back in the box."],
  ["4. Answer questions: type the Answer (and Answer (ja) if you can) and set Status to answered."],
  ["5. Tick Publish to put the answer in the FAQs. The household gets it by email and Status turns to published."],
  [""],
]

/** What the tidy would do, as steps: the words for the report and the change itself, read again when it runs. */
function tidyPlan_() {
  const ss = SpreadsheetApp.getActive()
  const steps = [], left = []
  const step = (text, run) => steps.push({ text: text, run: run })
  const fmt = (t) => Utilities.formatDate(new Date(t), ss.getSpreadsheetTimeZone(), "d MMM yyyy, h:mm a")

  // 1. Archive first (taking a column out shifts the ones after it, so the rest is worked out again when it runs)
  const log = ss.getSheetByName(TABS.log)
  const era = log ? testEraRows_(rows_(TABS.log)) : { rows: [] }
  if (era.rows.length) {
    step("Archive: move " + era.rows.length + " Log row(s) from before the first invite (" + fmt(era.cutoff) + "):\n" +
      era.rows.map((r) => "    Log row " + r.row + ": " + fmt(r.time) + ", " + r.kind + ", " + r.household).join("\n"),
    () => archiveRows_(log, era.rows.map((r) => r.row), "Rows from before the first invite"))
  }
  Object.keys(KNOWN_COLUMNS).forEach((tab) => {
    const s = ss.getSheetByName(tab)
    if (!s || s.getLastColumn() < 1) return
    const values = s.getDataRange().getValues()
    const filled = values[0].map((h, c) => values.slice(1).some((r) => r[c] !== "" && r[c] !== null && r[c] !== false))
    const cols = staleColumns_(tab, values[0], filled)
    cols.left.forEach((c) => left.push(tab + " column " + colLetter_(c.col) + " \"" + c.header + "\" (has something in it, and isn't one of ours)"))
    if (cols.move.length) step("Archive: move helper column(s) from " + tab + ": " + cols.move.map((c) => colLetter_(c.col) + " " + (c.header ? "\"" + c.header + "\" (empty)" : "(no heading)")).join(", "),
      () => cols.move.slice().reverse().forEach((c) => archiveColumn_(s, c.col, tab + " column " + colLetter_(c.col) + " " + (c.header || "(no heading)"))))
  })

  // 2. Empty rows in the middle (unticked boxes on every row) and the rows under them
  ;[[TABS.questions, ["Publish", "Seen"]], [TABS.rsvps, ["Seen"]]].forEach(([tab, boxNames]) => {
    const s = ss.getSheetByName(tab)
    if (!s || s.getLastRow() < 2) return
    const values = s.getDataRange().getValues(), head = values[0].map((h) => String(h).trim())
    const plan = gapPlan_(values.slice(1), boxNames.map((n) => head.indexOf(n)).filter((i) => i >= 0))
    if (plan.clear.length) step(tab + ": clear the unticked box on " + plan.clear.length + " empty row(s), so new rows land under the others (the tickboxes stay)",
      () => runs_(plan.clear).forEach((x) => s.getRange(x.from, 1, x.to - x.from + 1, s.getLastColumn()).clearContent()))
    if (plan.moves.length) step(tab + ": move " + plan.moves.length + " row(s) up to close the gap above them: " + plan.moves.map((m) => "row " + m.from + " to " + m.to).join(", "),
      () => plan.moves.forEach((m) => s.getRange(m.from, 1, 1, s.getLastColumn()).moveTo(s.getRange(m.to, 1))))
  })

  // 3. Every data tab: header, filter, banding, widths, dates; Seen tickboxes; the Questions dropdown and colours
  DATA_TABS.forEach((tab) => {
    const s = ss.getSheetByName(tab)
    if (!s || s.getLastColumn() < 1) return
    const head = headers_(s), want = []
    if (s.getFrozenRows() !== 1) want.push("freeze the header row")
    if (!s.getFilter()) want.push("turn the filter on")
    if (!s.getBandings().length) want.push("light banding")
    const widths = Object.keys(head).filter((k) => WIDTHS[k] && s.getColumnWidth(head[k] + 1) !== WIDTHS[k])
    if (widths.length) want.push("widths for " + widths.join(", "))
    const dates = Object.keys(head).filter((k) => TIMESTAMPS.indexOf(k) >= 0 && s.getRange(2, head[k] + 1).getNumberFormat() !== DATE_FORMAT)
    if (dates.length) want.push("readable dates (like 3 Oct 2026, 9:41 am) in " + dates.join(", "))
    const seenCols = tab === TABS.rsvps ? ["Seen", "Seen at"] : tab === TABS.questions ? ["Seen"] : []
    const missing = seenCols.filter((k) => !(k in head))
    if (missing.length) want.push("add " + missing.join(" and ") + " at the end (a tickbox for when you've read it" + (tab === TABS.rsvps ? "; Seen at is filled in when you tick" : "") + ")")
    if (tab === TABS.questions && "Status" in head && !s.getRange(2, head.Status + 1).getDataValidation()) want.push("a Status dropdown (new, answered, published)")
    if (tab === TABS.questions && !hasRule_(s, "Status")) want.push("colour the rows still new")
    if (tab === TABS.rsvps && !hasRule_(s, "Changed")) want.push("light up a reply changed since it was ticked Seen (Changed)")
    if (want.length) step(tab + ": " + want.join("; "), () => formatTab_(s, tab))
  })

  // 4. The Summary box and the weekly routine
  const summary = ss.getSheetByName("Summary")
  const hasBox = summary && String(summary.getRange(1, 1).getValue()).indexOf(LOOK_TITLE) === 0
  step(hasBox ? "Summary: refresh the To look at box" : "Summary: add the To look at box at the top (" + LOOK_ROWS + " new rows; what's there now moves down and its formulas keep working)" + (summary ? "" : ", in a new Summary tab"),
    () => refreshLookAt_(true))
  const how = ss.getSheetByName("How to update")
  const howNew = !how
  if (!how || how.getDataRange().getValues().map((r) => r.join(" ")).join(" ").indexOf(WEEKLY_HEAD) < 0) {
    step("How to update: add \"" + WEEKLY_HEAD + "\" at the top" + (how ? "" : " (a new tab)"), () => {
      const s = ss.getSheetByName("How to update") || ss.insertSheet("How to update")
      s.insertRowsBefore(1, WEEKLY_ROUTINE.length)
      s.getRange(1, 1, WEEKLY_ROUTINE.length, 1).setValues(WEEKLY_ROUTINE).setWrap(true)
      s.getRange(1, 1).setFontWeight("bold").setFontSize(12)
    })
  }

  // 5. Tab order, last (the Archive tab may be new)
  const names = ss.getSheets().map((x) => x.getName())
  const later = names.concat(steps.some((x) => /^Archive:/.test(x.text)) && names.indexOf(ARCHIVE) < 0 ? [ARCHIVE] : [], summary ? [] : ["Summary"], howNew ? ["How to update"] : [])
  const order = tabOrder_(later)
  if (order.join("|") !== later.join("|")) step("Tab order: " + order.join(", "), () => order.forEach((n, i) => { const x = ss.getSheetByName(n); if (x) { ss.setActiveSheet(x); ss.moveActiveSheet(i + 1) } }))
  return { steps: steps, left: left }
}

function hasRule_(s, kind) {
  return s.getConditionalFormatRules().some((r) => { const b = r.getBooleanCondition(); return b && String(b.getCriteriaValues()[0] || "").indexOf(kind === "Status" ? '="new"' : ">$") >= 0 })
}

/** Header, filter, banding, widths, dates, tickboxes and colours for one data tab (safe to run again). */
function formatTab_(s, tab) {
  if (tab === TABS.rsvps) ensureColumns_(s, ["Seen", "Seen at"])
  if (tab === TABS.questions) ensureColumns_(s, ["Seen"])
  const head = headers_(s), rows = Math.max(1, s.getMaxRows() - 1), width = s.getLastColumn()
  const all = s.getRange(1, 1, s.getMaxRows(), width)
  s.setFrozenRows(1)
  s.getRange(1, 1, 1, width).setFontWeight("bold")
  if (!s.getFilter()) all.createFilter()
  if (!s.getBandings().length) all.applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, true, false)
  Object.keys(head).forEach((k) => {
    if (WIDTHS[k]) s.setColumnWidth(head[k] + 1, WIDTHS[k])
    if (TIMESTAMPS.indexOf(k) >= 0) s.getRange(2, head[k] + 1, rows, 1).setNumberFormat(DATE_FORMAT)
  })
  const box = SpreadsheetApp.newDataValidation().requireCheckbox().build()
  ;["Seen"].concat(tab === TABS.questions ? ["Publish"] : []).forEach((k) => { if (k in head) s.getRange(2, head[k] + 1, rows, 1).setDataValidation(box) })
  const L = (k) => "$" + colLetter_(head[k] + 1) + "2"
  const rules = s.getConditionalFormatRules()
  const add = (formula) => rules.push(SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied(formula).setBackground(LOG_FLAG_BG).setRanges([s.getRange(2, 1, rows, width)]).build())
  if (tab === TABS.questions && "Status" in head) {
    s.getRange(2, head.Status + 1, rows, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(["new", "answered", "published"], true).build())
    if (!hasRule_(s, "Status")) add("=" + L("Status") + '="new"')
  }
  if (tab === TABS.rsvps && !hasRule_(s, "Changed")) add("=AND(" + L("Seen") + "=TRUE," + L("Seen at") + '<>"",' + L("Responded at") + ">" + L("Seen at") + ")")
  s.setConditionalFormatRules(rules)
}

/** The Archive tab, made at the end the first time. */
function archiveSheet_() {
  const ss = SpreadsheetApp.getActive()
  return ss.getSheetByName(ARCHIVE) || ss.insertSheet(ARCHIVE, ss.getSheets().length)
}

/** Copies a block to the bottom of Archive under a dated title, exactly as it is, and checks it arrived. */
function archiveBlock_(title, ranges) {
  const a = archiveSheet_()
  let row = a.getLastRow() + (a.getLastRow() ? 2 : 1)
  a.getRange(row, 1).setValue(title + ", moved " + Utilities.formatDate(new Date(), SpreadsheetApp.getActive().getSpreadsheetTimeZone(), "d MMM yyyy, h:mm a")).setFontWeight("bold")
  row++
  ranges.forEach((r) => {
    if (a.getMaxColumns() < r.getNumColumns()) a.insertColumnsAfter(a.getMaxColumns(), r.getNumColumns() - a.getMaxColumns())
    if (a.getMaxRows() < row + r.getNumRows()) a.insertRowsAfter(a.getMaxRows(), row + r.getNumRows() - a.getMaxRows())
    const to = a.getRange(row, 1, r.getNumRows(), r.getNumColumns())
    r.copyTo(to)
    SpreadsheetApp.flush()
    if (JSON.stringify(to.getValues()) !== JSON.stringify(r.getValues())) throw new Error("Archive copy didn't match (" + title + "): nothing was taken out")
    row += r.getNumRows()
  })
}

/** Row numbers as runs of neighbours, [{ from, to }], so a sheet call covers each run. */
function runs_(rowNumbers) {
  const runs = []
  rowNumbers.slice().sort((x, y) => x - y).forEach((r) => { const last = runs[runs.length - 1]; if (last && last.to === r - 1) last.to = r; else runs.push({ from: r, to: r }) })
  return runs
}

/** Moves whole rows (with the header above them) to Archive, then takes them out of their tab, bottom up. */
function archiveRows_(s, rowNumbers, title) {
  const width = s.getLastColumn(), runs = runs_(rowNumbers)
  archiveBlock_(title + " (" + s.getName() + ")", [s.getRange(1, 1, 1, width)].concat(runs.map((x) => s.getRange(x.from, 1, x.to - x.from + 1, width))))
  runs.reverse().forEach((x) => s.deleteRows(x.from, x.to - x.from + 1))
}

/** Moves one column (its heading and every row) to Archive, then takes it out of its tab. */
function archiveColumn_(s, col, title) {
  archiveBlock_(title, [s.getRange(1, col, Math.max(1, s.getLastRow()), 1)])
  s.deleteColumn(col)
}

function tidyReport_(plan, done) {
  return (done ? "Done:\n\n" : "Nothing has changed. \"Tidy the sheets: do it\" would:\n\n") +
    (plan.steps.length ? plan.steps.map((x, i) => (i + 1) + ". " + x.text).join("\n\n") : "Nothing: the sheets are tidy.") +
    (plan.left.length ? "\n\nLeft where they are (say if they should go to Archive):\n" + plan.left.map((x) => "    " + x).join("\n") : "") +
    "\n\nNo row of anyone's data is deleted: anything that moves is copied to the Archive tab first."
}

function tidySheets() {
  showResult_("Tidy the sheets (report)", tidyReport_(tidyPlan_(), false))
}

function tidySheetsForReal() {
  const ui = SpreadsheetApp.getUi()
  let plan = tidyPlan_()
  if (ui.alert("Tidy the sheets: do it", plan.steps.length + " change(s), listed in \"Tidy the sheets (report)\". Anything that moves is copied to Archive first. Go ahead?", ui.ButtonSet.YES_NO) !== ui.Button.YES) return
  const lock = LockService.getScriptLock()
  if (!lock.tryLock(30000)) return ui.alert("A reply is being saved. Try again in a minute.")
  try {
    plan = tidyPlan_() // again, under the lock: nothing can save in between
    plan.steps.forEach((x) => x.run())
    SpreadsheetApp.flush()
  } finally {
    lock.releaseLock()
  }
  forgetAllHouseholds_()
  showResult_("Tidy the sheets: done", tidyReport_(plan, true))
}

function isLocked_() {
  const d = prop_("CHANGES_LOCK")
  return d ? new Date() > new Date(d + "T23:59:59+09:00") : false
}

function sheet_(name) {
  const s = SpreadsheetApp.getActive().getSheetByName(name)
  if (!s) throw new Error("Missing tab: " + name)
  return s
}

function headers_(s) {
  const h = {}
  s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0].forEach((name, i) => (h[String(name).trim()] = i))
  return h
}

function rows_(name) {
  const data = sheet_(name).getDataRange().getValues()
  const head = data[0].map((h) => String(h).trim())
  return data.slice(1).map((r) => Object.fromEntries(head.map((h, i) => [h, typeof r[i] === "string" ? r[i].trim() : r[i]])))
}

function fill_(r, width) {
  return Array.from({ length: Math.max(width, r.length) }, (_, i) => (r[i] === undefined ? "" : r[i]))
}

/** Trims and caps user text. Single-line unless multiline is set. */
function text_(v, max, multiline) {
  let s = String(v == null ? "" : v).replace(/\r\n?/g, "\n")
  s = multiline ? s.replace(/\n{3,}/g, "\n\n") : s.replace(/\s+/g, " ")
  return s.trim().slice(0, max)
}

/** "yyyy-mm-dd" or "" are fine. Anything else returns null. */
function date_(v) {
  const s = String(v == null ? "" : v).trim()
  if (!s) return ""
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || isNaN(new Date(s + "T00:00:00Z"))) return null
  return s
}

/** Always stored as plain text, which also stops formula injection (= + - @). */
function cell_(v) {
  const s = String(v == null ? "" : v)
  return s ? "'" + s : ""
}

function fmtDate_(v) {
  if (!v) return ""
  const d = v instanceof Date ? v : new Date(v)
  return isNaN(d) ? String(v) : Utilities.formatDate(d, "Asia/Tokyo", "yyyy-MM-dd")
}

function shortDate_(ymd) {
  return ymd ? Utilities.formatDate(new Date(ymd + "T12:00:00+09:00"), "Asia/Tokyo", "d MMM") : ""
}

function longDate_(ymd) {
  return ymd ? Utilities.formatDate(new Date(ymd + "T12:00:00+09:00"), "Asia/Tokyo", "EEE d MMM yyyy") : ""
}

function esc_(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch])
}

function safely_(fn) {
  try {
    fn()
  } catch (err) {
    console.error(String(err && err.stack ? err.stack : err))
  }
}

/**
 * ?action=health (final run N), for UptimeRobot (docs/monitoring.md): ok is true only when the sheet opens and the
 * email queue is moving. No guest data, only yes/no and counts. Watch for the keyword "ok":true.
 */
function health_() {
  const out = { ok: true, service: "nadia-griffin-wedding", at: new Date().toISOString(), sheet: true, queueMoving: true, pending: 0, emailQuota: null }
  try { sheet_(TABS.guests).getLastRow() } catch (err) { out.sheet = false }
  try {
    const props = PropertiesService.getScriptProperties()
    out.pending = Object.keys(props.getProperties()).filter((k) => k.indexOf("q:") === 0).length
    const last = Number(props.getProperty("last_flush_at") || 0)
    // Something waiting and nothing sent for 15 minutes: the minute trigger has stopped
    out.queueMoving = !out.pending || (last > 0 && Date.now() - last < 15 * 60 * 1000)
  } catch (err) { out.queueMoving = false }
  try { out.emailQuota = MailApp.getRemainingDailyQuota() } catch (err) { /* not authorised yet: left null */ }
  out.ok = out.sheet && out.queueMoving
  return out
}

/**
 * Errors by email and to Discord (final run N). Off until set: ALERT_EMAIL (an address) and DISCORD_WEBHOOK_URL in
 * Script Properties. One alert per kind of error an hour; only the error's code and message, never guest data or
 * tokens. Email goes only from the wedding account, like everything else.
 */
function alert_(code, err) {
  try {
    const cache = CacheService.getScriptCache(), key = "alert:" + code
    if (cache.get(key)) return
    cache.put(key, "1", 3600)
    const msg = String(err && err.message ? err.message : err).replace(/[A-Za-z0-9_-]{20,}/g, "…").slice(0, 400)
    const text = "The wedding site's back end hit an error: " + code + "\n" + msg + "\n\nDetails: Extensions → Apps Script → Executions. One alert per kind of error an hour."
    const to = prop_("ALERT_EMAIL")
    if (to && isWeddingAccount_()) MailApp.sendEmail({ to: to, subject: "[Wedding site] error: " + code, body: text })
    const hook = prop_("DISCORD_WEBHOOK_URL")
    if (hook) UrlFetchApp.fetch(hook, { method: "post", contentType: "application/json", payload: JSON.stringify({ content: ("**Wedding site error: " + code + "**\n" + msg).slice(0, 1900) }), muteHttpExceptions: true })
  } catch (e) { console.error("alert_: " + e) }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}

function fail_(code, err) {
  if (err) { console.error(String(err && err.stack ? err.stack : err)); alert_(code, err) }
  return json_({ ok: false, code: code, error: ERRORS[code] })
}
