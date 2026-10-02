/**
 * Nadia & Griffin wedding site: back end.
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
 *
 * Visit counts (privacy first, only in this sheet: no cookies, IP addresses or third parties) go in
 * columns added at the END of Guests: First opened, Last opened, Opens, Started RSVP.
 * Repeat opens within 10 minutes aren't counted.
 *
 * Script properties (Project settings > Script properties) override these defaults:
 *   SITE_URL        https://griffin-nadia.github.io/wedding
 *   CHANGES_LOCK    2027-04-30  (after this date the site refuses edits)
 *   REPLY_TO        griffinandnadia@gmail.com
 *   RSVP_BY         2027-02-15
 *   TEST_EMAIL      where test invites go (asked for the first time you send a test)
 *   NOTIFY_CHANGES  "yes" to email REPLY_TO when someone changes from coming to not coming
 *   SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET   from a free Spotify developer app (song search).
 *                   Without them, song search is off and guests just type.
 */

const TABS = { guests: "Guests", rsvps: "RSVPs", songs: "Songs", log: "Log", emails: "Emails" }

const DEFAULTS = {
  SITE_URL: "https://griffin-nadia.github.io/wedding",
  CHANGES_LOCK: "2027-04-30",
  REPLY_TO: "griffinandnadia@gmail.com",
  RSVP_BY: "2027-02-15",
  TEST_EMAIL: "",
  NOTIFY_CHANGES: "no",
}

const WEDDING = {
  date: "Friday 15 October 2027, 11:00 am",
  venue: "The Sodoh Higashiyama, Kyoto",
}

const MAX = { name: 40, dietary: 100, song: 200, message: 2000, songs: 3, payload: 5000 }

// A guest row whose First name is one of these is a plus one the household can name.
const PLUS_ONE = /^(guest|plus one|\+1)$/i

const VISITS = ["First opened", "Last opened", "Opens", "Started RSVP"]
const REPEAT_OPEN_MS = 10 * 60 * 1000

// Test sends stop after this many households, so a test never eats the day's email quota.
const TEST_SAMPLE = 5

const ERRORS = {
  bad_request: "Something was missing from that RSVP. Please try again.",
  not_found: "We couldn't find this invite.",
  bad_guest: "That RSVP included someone who isn't in this household.",
  bad_attending: "Please choose coming or can't make it for each person.",
  bad_date: "Please check the dates.",
  closed: "Changes are closed now. Please message Nadia or Griffin.",
  busy: "Lots of people are replying right now. Please try again in a minute.",
  server: "Something went wrong saving that. Please try again.",
}

// Invite and reminder wording. The Emails tab overrides these, so Nadia can edit without code.
// {household}, {rsvp_by}, {date} and {venue} are filled in when sending.
const COPY = {
  invite_subject: "You're invited: Nadia & Griffin, Kyoto, 15 October 2027",
  invite_heading: "You're invited",
  invite_body:
    "Hi {household},\n\nWe're getting married in Kyoto and we'd love you to be there.\n\nYour invite page has everything: the day, travel tips and your RSVP. Please RSVP by {rsvp_by}.",
  invite_button: "Open your invite",
  reminder_subject: "A quick reminder to RSVP: Nadia & Griffin",
  reminder_heading: "Can you make it?",
  reminder_body:
    "Hi {household},\n\nJust a friendly nudge to RSVP for our wedding in Kyoto. It only takes a minute.\n\nPlease RSVP by {rsvp_by}.",
  reminder_button: "RSVP now",
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
    .addSeparator()
    .addItem("Set up the Emails tab", "setupEmailsTab")
    .addItem("Check song search (Spotify)", "checkSongSearch")
    .addItem("Reset test households…", "resetTestHouseholds")
    .addToUi()
}

// ---------- web app ----------

function doGet(e) {
  const p = (e && e.parameter) || {}
  const action = String(p.action || "").toLowerCase()
  try {
    if (action === "household") {
      const h = getHousehold_(p.token)
      if (h && p.open === "1") safely_(() => trackOpen_(h.token))
      return json_({ ok: true, household: h })
    }
    if (action === "songs") return json_(searchSongs_(p.q))
    if (action === "started") {
      safely_(() => trackStarted_(String(p.token || "").trim()))
      return json_({ ok: true })
    }
    if (action === "check") return json_(check_(p.token))
    return json_({ ok: true, service: "nadia-griffin-wedding" })
  } catch (err) {
    return fail_("server", err)
  }
}

function doPost(e) {
  let body
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || "")
  } catch (err) {
    return fail_("bad_request")
  }
  if (!body || typeof body !== "object" || body.action !== "rsvp") return fail_("bad_request")
  if (isLocked_()) return fail_("closed")

  const lock = LockService.getScriptLock()
  if (!lock.tryLock(30000)) return fail_("busy")
  let before, after, changes
  try {
    before = getHousehold_(body.token)
    if (!before) return fail_("not_found")
    const input = validate_(before, body)
    if (input.error) return fail_(input.error)
    saveRsvp_(before, input)
    SpreadsheetApp.flush()
    after = getHousehold_(before.token)
    changes = describeChanges_(before, after)
    log_(after.displayName, after.token, changes.join("\n"), JSON.stringify(input))
    SpreadsheetApp.flush()
  } catch (err) {
    return fail_("server", err)
  } finally {
    lock.releaseLock()
  }

  // Emails go out after the lock is released, so other saves don't wait on Gmail.
  const updated = Boolean(before.respondedAt)
  try {
    sendConfirmation_(after, updated ? changes : null)
  } catch (err) {
    console.error("Confirmation email failed: " + err)
  }
  try {
    notifyIfDropped_(before, after)
  } catch (err) {
    console.error("Change notice failed: " + err)
  }
  return json_({ ok: true, updated: updated, changes: changes, household: after })
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
    log: rows_(TABS.log)
      .filter((r) => r.Token === h.token)
      .map((r) => ({ time: r.Time instanceof Date ? r.Time.toISOString() : String(r.Time), changed: String(r["What changed"]) })),
  }
}

// ---------- song search (Spotify, server side so guests never talk to Spotify) ----------

function searchSongs_(q) {
  q = text_(q, 80)
  if (q.length < 2) return { ok: true, results: [] }
  const props = PropertiesService.getScriptProperties()
  const id = props.getProperty("SPOTIFY_CLIENT_ID")
  const secret = props.getProperty("SPOTIFY_CLIENT_SECRET")
  if (!id || !secret) return { ok: false, code: "not_configured" }
  const cache = CacheService.getScriptCache()
  const key = "song:" + q.toLowerCase()
  const hit = cache.get(key)
  if (hit) return { ok: true, results: JSON.parse(hit) }
  let token = cache.get("spotify_token")
  if (!token) {
    const res = UrlFetchApp.fetch("https://accounts.spotify.com/api/token", {
      method: "post",
      payload: { grant_type: "client_credentials" },
      headers: { Authorization: "Basic " + Utilities.base64Encode(id + ":" + secret) },
      muteHttpExceptions: true,
    })
    if (res.getResponseCode() !== 200) return { ok: false, code: "search_failed" }
    const body = JSON.parse(res.getContentText())
    token = body.access_token
    cache.put("spotify_token", token, Math.max(60, (body.expires_in || 3600) - 300))
  }
  const res = UrlFetchApp.fetch("https://api.spotify.com/v1/search?type=track&limit=6&market=AU&q=" + encodeURIComponent(q), {
    headers: { Authorization: "Bearer " + token },
    muteHttpExceptions: true,
  })
  if (res.getResponseCode() !== 200) return { ok: false, code: "search_failed" }
  const results = (JSON.parse(res.getContentText()).tracks || { items: [] }).items.map((t) => ({
    title: t.name,
    artist: (t.artists || []).map((a) => a.name).join(", "),
    url: t.external_urls ? t.external_urls.spotify : "",
  }))
  cache.put(key, JSON.stringify(results), 6 * 60 * 60)
  return { ok: true, results: results }
}

// ---------- visits ----------

function trackOpen_(token) {
  withHouseholdRows_(token, (s, head, rows, data) => {
    const now = new Date()
    const last = data[rows[0] - 1][head["Last opened"]]
    if (last instanceof Date && now - last < REPEAT_OPEN_MS) return
    const opens = Number(data[rows[0] - 1][head.Opens]) || 0
    rows.forEach((r) => {
      if (!data[r - 1][head["First opened"]]) s.getRange(r, head["First opened"] + 1).setValue(now)
      s.getRange(r, head["Last opened"] + 1).setValue(now)
      s.getRange(r, head.Opens + 1).setValue(opens + 1)
    })
  })
}

function trackStarted_(token) {
  withHouseholdRows_(token, (s, head, rows, data) => {
    if (data[rows[0] - 1][head["Started RSVP"]]) return
    rows.forEach((r) => s.getRange(r, head["Started RSVP"] + 1).setValue(new Date()))
  })
}

/** Runs fn with the household's Guests rows (1-based), under a short lock. Skips if busy. */
function withHouseholdRows_(token, fn) {
  if (!token) return
  const lock = LockService.getScriptLock()
  if (!lock.tryLock(5000)) return
  try {
    const s = sheet_(TABS.guests)
    const head = ensureVisitColumns_(s)
    const data = s.getDataRange().getValues()
    const rows = []
    for (let i = 1; i < data.length; i++) if (String(data[i][head.Token]).trim() === token) rows.push(i + 1)
    if (rows.length) fn(s, head, rows, data)
  } finally {
    lock.releaseLock()
  }
}

function visitsOf_(token) {
  const r = rows_(TABS.guests).find((x) => x.Token === token) || {}
  const out = {}
  VISITS.forEach((k) => (out[k] = r[k] instanceof Date ? r[k].toISOString() : r[k] === undefined ? null : r[k]))
  return out
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
  const songs = []
  ;(Array.isArray(body.songs) ? body.songs : []).forEach((s) => {
    const t = text_(s, MAX.song)
    if (t && songs.indexOf(t) < 0 && songs.length < MAX.songs) songs.push(t)
  })
  return { guests: guests, songs: songs, arrival: arrival, departure: departure, message: text_(body.message, MAX.message, true) }
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
    }
  }

  // RSVPs: exactly one row per household
  const rSheet = sheet_(TABS.rsvps)
  const rHead = headers_(rSheet)
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

function log_(household, token, changed, payload) {
  const s = sheet_(TABS.log)
  const head = headers_(s)
  const r = []
  r[head.Time] = new Date()
  r[head.Household] = household
  r[head["What changed"]] = cell_(changed)
  r[head.Token] = token
  r[head.Payload] = cell_(String(payload || "").slice(0, MAX.payload))
  s.appendRow(fill_(r, s.getLastColumn()))
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
    eyebrow: changes ? "RSVP updated" : "RSVP received",
    heading: heading,
    paragraphs: ["Hi " + h.displayName + ","],
    list: changes && changes[0] !== "No changes" ? { title: "What changed", items: changes } : null,
    rows: rows,
    button: { label: "See or change your RSVP", url: linkFor_(h.token) },
    notes: ["You can change this until " + longDate_(prop_("CHANGES_LOCK")) + ".", "This link is just for your household, so please don't share it."],
  })
  MailApp.sendEmail({
    to: emails.join(","),
    replyTo: prop_("REPLY_TO"),
    name: "Nadia & Griffin",
    subject: (changes ? "Updated: your" : "Your") + " RSVP for Nadia & Griffin's wedding",
    body: mail.text,
    htmlBody: mail.html,
  })
}

function notifyIfDropped_(b, a) {
  if (String(prop_("NOTIFY_CHANGES")).toLowerCase() !== "yes") return
  const dropped = a.guests.filter((g) => {
    const old = b.guests.find((x) => x.id === g.id)
    return old && old.attending === "yes" && g.attending === "no"
  })
  if (!dropped.length) return
  const names = dropped.map((g) => g.firstName).join(", ")
  MailApp.sendEmail({
    to: prop_("REPLY_TO"),
    subject: "RSVP change: " + names + " can't make it now",
    body: a.displayName + " changed their RSVP.\n\n" + names + ": coming → can't make it\n\nSee the Log tab for details.",
  })
}

// ---------- invites (menu) ----------

function sendInvitesTest() {
  const ui = SpreadsheetApp.getUi()
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
    MailApp.sendEmail({ to: to, replyTo: prop_("REPLY_TO"), name: "Nadia & Griffin", subject: "[TEST] " + mail.subject, body: mail.text, htmlBody: mail.html })
  })
  ui.alert("Sent " + list.length + " test invite" + (list.length === 1 ? "" : "s") + " to " + to + ".\n\n\"Invite sent\" was not filled in. Nobody else got anything.")
}

function sendInvitesAll() {
  const ui = SpreadsheetApp.getUi()
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
function sendBatch_(kind, list, markInvited) {
  const gSheet = sheet_(TABS.guests)
  const head = headers_(gSheet)
  let sent = 0
  for (let i = 0; i < list.length; i++) {
    const h = list[i]
    if (MailApp.getRemainingDailyQuota() < h.emails.length) return { sent: sent, left: list.length - i }
    const mail = inviteEmail_(kind, h)
    MailApp.sendEmail({ to: h.emails.join(","), replyTo: prop_("REPLY_TO"), name: "Nadia & Griffin", subject: mail.subject, body: mail.text, htmlBody: mail.html })
    if (markInvited) h.rows.forEach((r) => gSheet.getRange(r, head["Invite sent"] + 1).setValue(new Date()))
    log_(h.name, h.token, (kind === "invite" ? "Invite" : "Reminder") + " sent to " + h.emails.join(", "), "")
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
      .replace(/\{date\}/g, WEDDING.date)
      .replace(/\{venue\}/g, WEDDING.venue)
  const mail = buildEmail_({
    eyebrow: testNote || "Nadia & Griffin",
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

// ---------- Emails tab ----------

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

// ---------- test data ----------

// Households named like "Jehan (Test)" or "Test · Family". Real households never match.
const TEST_HOUSEHOLD = /(^test\b|\(test\))/i

/** Clears answers, songs, Log rows and visit counts for test households. Keeps their Guests rows. */
function resetTestHouseholds() {
  const ui = SpreadsheetApp.getUi()
  const tests = households_().filter((h) => TEST_HOUSEHOLD.test(h.name))
  if (!tests.length) return ui.alert("No test households found.")
  const ok = ui.alert("Reset test households", "Clear answers, songs, Log rows and visits for:\n\n" + tests.map((h) => h.name).join("\n") + "\n\nTheir rows on Guests stay.", ui.ButtonSet.OK_CANCEL)
  if (ok !== ui.Button.OK) return
  const tokens = tests.map((h) => h.token)
  const props = PropertiesService.getScriptProperties()

  const g = sheet_(TABS.guests)
  const head = headers_(g)
  const data = g.getDataRange().getValues()
  for (let i = 1; i < data.length; i++) {
    if (tokens.indexOf(String(data[i][head.Token]).trim()) < 0) continue
    ;["Attending", "Dietary", "Invite sent"].concat(VISITS).forEach((k) => {
      if (k in head) g.getRange(i + 1, head[k] + 1).setValue("")
    })
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
  ui.alert("Reset " + tests.length + " test household" + (tests.length === 1 ? "" : "s") + ".")
}

function checkSongSearch() {
  const r = searchSongs_("September Earth Wind")
  SpreadsheetApp.getUi().alert(
    r.ok ? "Song search works. First result: " + (r.results[0] ? r.results[0].title + ", " + r.results[0].artist : "none")
      : r.code === "not_configured" ? "Song search is off. Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in Project settings > Script properties."
      : "Spotify said no. Check the two keys are right.",
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

/** One simple layout for every email, in the site's colours. Returns { html, text }. */
function buildEmail_(m) {
  const c = { paper: "#f6efe3", card: "#fffdf8", ink: "#3a2a20", body: "#6b4a35", muted: "#736352", line: "#e6dcca", red: "#a8321f", onRed: "#fff6ea", eyebrow: "#b5482e" }
  const serif = "Georgia, 'Times New Roman', serif"
  const sans = "-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"
  const p = (s) => '<p style="margin:0 0 16px;font:16px/1.5 ' + sans + ";color:" + c.body + '">' + esc_(s).replace(/\n/g, "<br>") + "</p>"
  let html =
    '<div style="background:' + c.paper + ';padding:24px 12px">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:' + c.card + ";border:1px solid " + c.line + ';border-radius:12px">' +
    '<tr><td style="padding:32px 28px">' +
    '<p style="margin:0 0 8px;font:600 12px/1.4 ' + sans + ";letter-spacing:.08em;text-transform:uppercase;color:" + c.eyebrow + '">' + esc_(m.eyebrow) + "</p>" +
    '<h1 style="margin:0 0 20px;font:400 28px/1.25 ' + serif + ";color:" + c.ink + '">' + esc_(m.heading) + "</h1>" +
    (m.paragraphs || []).map(p).join("")
  let text = m.heading + "\n\n" + (m.paragraphs || []).join("\n\n") + "\n\n"
  if (m.list) {
    html +=
      '<p style="margin:0 0 6px;font:600 14px/1.4 ' + sans + ";color:" + c.ink + '">' + esc_(m.list.title) + "</p>" +
      '<ul style="margin:0 0 20px;padding-left:20px;font:15px/1.5 ' + sans + ";color:" + c.body + '">' + m.list.items.map((i) => "<li>" + esc_(i) + "</li>").join("") + "</ul>"
    text += m.list.title + ":\n" + m.list.items.map((i) => "- " + i).join("\n") + "\n\n"
  }
  if (m.rows && m.rows.length) {
    html +=
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border-top:1px solid ' + c.line + '">' +
      m.rows
        .map((r) => '<tr><td style="padding:10px 12px 10px 0;border-bottom:1px solid ' + c.line + ";font:600 15px/1.4 " + sans + ";color:" + c.ink + ';vertical-align:top">' + esc_(r[0]) + '</td><td align="right" style="padding:10px 0;border-bottom:1px solid ' + c.line + ";font:15px/1.4 " + sans + ";color:" + c.body + '">' + esc_(r[1]) + "</td></tr>")
        .join("") +
      "</table>"
    text += m.rows.map((r) => r[0] + ": " + r[1]).join("\n") + "\n\n"
  }
  if (m.button) {
    html +=
      '<p style="margin:0 0 24px"><a href="' + esc_(m.button.url) + '" style="display:inline-block;background:' + c.red + ";color:" + c.onRed + ";text-decoration:none;font:600 16px/1 " + sans + ';padding:16px 28px;border-radius:8px">' + esc_(m.button.label) + "</a></p>"
    text += m.button.label + ": " + m.button.url + "\n\n"
  }
  html += (m.notes || []).map((n) => '<p style="margin:0 0 6px;font:13px/1.5 ' + sans + ";color:" + c.muted + '">' + esc_(n) + "</p>").join("")
  text += (m.notes || []).join("\n") + "\n\n"
  html += '<p style="margin:24px 0 0;font:400 18px/1.4 ' + serif + ";color:" + c.ink + '">Nadia &amp; Griffin</p></td></tr></table></div>'
  text += "Nadia & Griffin"
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
  return ymd ? Utilities.formatDate(new Date(ymd + "T12:00:00+09:00"), "Asia/Tokyo", "d MMMM yyyy") : ""
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

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}

function fail_(code, err) {
  if (err) console.error(String(err && err.stack ? err.stack : err))
  return json_({ ok: false, code: code, error: ERRORS[code] })
}
