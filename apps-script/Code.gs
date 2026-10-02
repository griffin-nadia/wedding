/**
 * Nadia & Griffin wedding site: back end.
 *
 * Lives in the site data Google Sheet (owned by the wedding Gmail):
 *   Extensions > Apps Script, paste this file, then Deploy > New deployment > Web app
 *   (Execute as: Me, Who has access: Anyone). Put the /exec URL in the site's .env as VITE_API_URL.
 *
 * Tabs it expects (see docs/data-model.md):
 *   Guests   one row per person, grouped into households by Token
 *   RSVPs    one row per household (written by the site)
 *   Songs    one row per song pick (written by the site)
 *   Log      every submission, for history (written by the site)
 *
 * Script properties (Project settings > Script properties):
 *   SITE_URL       https://griffin-nadia.github.io/wedding
 *   CHANGES_LOCK   e.g. 2027-04-30  (after this date the site refuses edits)
 *   REPLY_TO       e.g. the wedding Gmail address
 */

const TABS = { guests: "Guests", rsvps: "RSVPs", songs: "Songs", log: "Log" }

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Wedding site")
    .addItem("Make tokens + links for new rows", "makeTokensAndLinks")
    .addToUi()
}

function doGet(e) {
  const action = (e.parameter.action || "").toLowerCase()
  if (action === "household") return json_({ household: getHousehold_(e.parameter.token) })
  return json_({ ok: true, service: "nadia-griffin-wedding" })
}

function doPost(e) {
  const lock = LockService.getScriptLock()
  lock.waitLock(20000)
  try {
    const body = JSON.parse(e.postData.contents || "{}")
    if (body.action !== "rsvp") return json_({ ok: false, error: "Unknown action" })
    if (isLocked_()) return json_({ ok: false, error: "Changes are closed. Please message Nadia or Griffin." })
    const household = getHousehold_(body.token)
    if (!household) return json_({ ok: false, error: "Invite not found" })
    saveRsvp_(household, body)
    const saved = getHousehold_(body.token)
    sendConfirmation_(saved)
    return json_({ ok: true, household: saved })
  } catch (err) {
    return json_({ ok: false, error: String(err) })
  } finally {
    lock.releaseLock()
  }
}

// ---------- reads ----------

function getHousehold_(token) {
  if (!token) return null
  const guests = rows_(TABS.guests).filter((r) => r.Token === token)
  if (!guests.length) return null
  const rsvp = rows_(TABS.rsvps).find((r) => r.Token === token) || {}
  const songs = rows_(TABS.songs).filter((r) => r.Token === token).map((r) => r.Song)
  return {
    token: token,
    displayName: guests[0].Household || guests.map((g) => g["First name"]).join(" & "),
    guests: guests.map((g) => ({
      id: String(g["Guest ID"]),
      firstName: g["First name"],
      attending: g.Attending === "yes" || g.Attending === "no" ? g.Attending : null,
      dietary: g.Dietary || "None",
    })),
    songs: songs,
    arrival: fmtDate_(rsvp.Arriving),
    departure: fmtDate_(rsvp.Leaving),
    message: rsvp.Message || "",
    respondedAt: rsvp["Responded at"] ? new Date(rsvp["Responded at"]).toISOString() : null,
  }
}

// ---------- writes ----------

function saveRsvp_(household, body) {
  const now = new Date()
  const gSheet = sheet_(TABS.guests)
  const gHead = headers_(gSheet)
  const gData = gSheet.getDataRange().getValues()
  const byId = {}
  ;(body.guests || []).forEach((g) => (byId[String(g.id)] = g))
  for (let i = 1; i < gData.length; i++) {
    const row = gData[i]
    if (row[gHead.Token] !== household.token) continue
    const g = byId[String(row[gHead["Guest ID"]])]
    if (!g) continue
    gSheet.getRange(i + 1, gHead.Attending + 1).setValue(g.attending === "yes" || g.attending === "no" ? g.attending : "")
    gSheet.getRange(i + 1, gHead.Dietary + 1).setValue(clean_(g.dietary))
  }

  const rSheet = sheet_(TABS.rsvps)
  const rHead = headers_(rSheet)
  const rData = rSheet.getDataRange().getValues()
  const values = []
  values[rHead.Token] = household.token
  values[rHead.Household] = household.displayName
  values[rHead.Arriving] = clean_(body.arrival)
  values[rHead.Leaving] = clean_(body.departure)
  values[rHead.Message] = clean_(body.message)
  values[rHead["Responded at"]] = now
  const width = rSheet.getLastColumn()
  const full = Array.from({ length: width }, (_, i) => (values[i] === undefined ? "" : values[i]))
  const idx = rData.findIndex((r, i) => i > 0 && r[rHead.Token] === household.token)
  if (idx > 0) rSheet.getRange(idx + 1, 1, 1, width).setValues([full])
  else rSheet.appendRow(full)

  // Songs: replace this household's picks
  const sSheet = sheet_(TABS.songs)
  const sData = sSheet.getDataRange().getValues()
  for (let i = sData.length - 1; i >= 1; i--) if (sData[i][0] === household.token) sSheet.deleteRow(i + 1)
  ;(body.songs || []).filter(Boolean).slice(0, 3).forEach((s) => sSheet.appendRow([household.token, household.displayName, clean_(s), now]))

  sheet_(TABS.log).appendRow([now, household.token, JSON.stringify(body)])
}

function sendConfirmation_(h) {
  const emails = rows_(TABS.guests).filter((r) => r.Token === h.token && r.Email).map((r) => r.Email)
  if (!emails.length) return
  const props = PropertiesService.getScriptProperties()
  const link = (props.getProperty("SITE_URL") || "") + "/?h=" + h.token
  const lines = h.guests.map((g) => `${g.firstName}: ${g.attending === "yes" ? "coming" : "can't make it"}${g.attending === "yes" && g.dietary !== "None" ? " (" + g.dietary + ")" : ""}`)
  MailApp.sendEmail({
    to: emails.join(","),
    replyTo: props.getProperty("REPLY_TO") || undefined,
    subject: "Your RSVP for Nadia & Griffin's wedding",
    body: `Hi ${h.displayName},\n\nThanks! Here's what we've got:\n\n${lines.join("\n")}\n\nChange it any time before the cut-off: ${link}\n\nSee you in Kyoto!\nNadia & Griffin`,
  })
}

// ---------- admin ----------

/** Fills Token (shared per household) and Link for any guest rows that don't have them yet. */
function makeTokensAndLinks() {
  const s = sheet_(TABS.guests)
  const head = headers_(s)
  const data = s.getDataRange().getValues()
  const site = PropertiesService.getScriptProperties().getProperty("SITE_URL") || ""
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
    s.getRange(i + 1, head.Link + 1).setValue(site + "/?h=" + token)
  }
}

// ---------- helpers ----------

function makeToken_() {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789" // no look-alikes
  let t = ""
  for (let i = 0; i < 10; i++) t += chars[Math.floor(Math.random() * chars.length)]
  return t
}

function isLocked_() {
  const d = PropertiesService.getScriptProperties().getProperty("CHANGES_LOCK")
  return d ? new Date() > new Date(d + "T23:59:59+09:00") : false
}

function sheet_(name) {
  const s = SpreadsheetApp.getActive().getSheetByName(name)
  if (!s) throw new Error("Missing tab: " + name)
  return s
}

function headers_(s) {
  const h = {}
  s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0].forEach((name, i) => (h[name] = i))
  return h
}

function rows_(name) {
  const data = sheet_(name).getDataRange().getValues()
  const head = data[0]
  return data.slice(1).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])))
}

function fmtDate_(v) {
  if (!v) return ""
  const d = v instanceof Date ? v : new Date(v)
  return isNaN(d) ? String(v) : Utilities.formatDate(d, "Asia/Tokyo", "yyyy-MM-dd")
}

function clean_(v) {
  return String(v == null ? "" : v).slice(0, 500).replace(/^[=+\-@]/, "'$&") // stop formula injection
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}
