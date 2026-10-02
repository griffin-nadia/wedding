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
 *   REMINDER_AT     when the gentle reminder goes, e.g. 2027-02-01T10:00:00+11:00 (off until you turn it on)
 *   SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET   optional: Spotify for song search (needs a Premium
 *                   app owner). Without them, or if Spotify says no, search uses iTunes.
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

const DATE_RANGE = { from: "2027-09-01", to: "2027-11-30" }

const MAX = { name: 40, dietary: 100, song: 200, message: 2000, songs: 3, payload: 5000 }

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
  closed: "Changes are closed now. Please message Nadia or Griffin.",
  busy: "Lots of people are replying right now. Please try again in a minute.",
  server: "Something went wrong saving that. Please try again.",
  read_failed: "We couldn't load your invite just now. Please try again.",
  bad_email: "That doesn't look like an email address.",
  search_failed: "Song search isn't working right now. Just type the song instead.",
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
    .addItem("Check song search", "checkSongSearch")
    .addItem("Turn on the fast email queue", "setupQueue")
    .addItem("Reset test households…", "resetTestHouseholds")
    .addSeparator()
    .addItem("Schedule the February reminder…", "scheduleReminder")
    .addItem("Cancel the February reminder", "cancelReminder")
    .addToUi()
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
    if (action === "ping") {
      // Health check: is the minute trigger set up? (No guest data here.)
      const props = PropertiesService.getScriptProperties()
      const pending = Object.keys(props.getProperties()).filter((k) => k.indexOf("q:") === 0).length
      return json_({ ok: true, queue: props.getProperty("flush_trigger") === "1", pending: pending, lastTestSend: props.getProperty("last_test_send"), triggerError: CacheService.getScriptCache().get("trigger_err") || null })
    }
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
    log_(after.displayName, after.token, changes.join("\n"), JSON.stringify(input))
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
    safely_(() => sendConfirmation_(after, updated ? changes : null))
    safely_(() => notifyDropped_(after.displayName, droppedNames_(before, after)))
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
    log: rows_(TABS.log)
      .filter((r) => r.Token === h.token)
      .map((r) => ({ time: r.Time instanceof Date ? r.Time.toISOString() : String(r.Time), changed: String(r["What changed"]) })),
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
function onEdit() {
  forgetAllHouseholds_()
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
  if (props.getProperty("flush_trigger") === "1") return true
  try {
    if (!ScriptApp.getProjectTriggers().some((t) => t.getHandlerFunction() === "flushQueue")) {
      ScriptApp.newTrigger("flushQueue").timeBased().everyMinutes(1).create()
    }
    props.setProperty("flush_trigger", "1")
    return true
  } catch (err) {
    CacheService.getScriptCache().put("trigger_err", String(err).slice(0, 300), 21600)
    return false
  }
}

/** Every minute: write queued visits, send queued confirmation emails, keep warm in invite week. */
function flushQueue() {
  const lock = LockService.getScriptLock()
  if (!lock.tryLock(20000)) return
  const props = PropertiesService.getScriptProperties()
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
          log_(h.displayName, token, item.changes.join("\n"), JSON.stringify(item.input))
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
      if (parts[1] === "mail") mails.push({ token: parts[2], data: JSON.parse(all[k]) })
      else if (events[parts[1]]) (events[parts[1]][parts[2]] = events[parts[1]][parts[2]] || []).push(Number(all[k]) > 1 ? Number(all[k]) : Number(parts[3].slice(0, 13)))
    })
    if (Object.keys(events.open).length || Object.keys(events.started).length) writeVisits_(events)
    keys.forEach((k) => props.deleteProperty(k))
  } finally {
    lock.releaseLock()
  }
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

// ---------- "Can't find your invite?" ----------

/**
 * Emails the household link to an address on the guest list. Always answers the same way, so it
 * never reveals who's invited. Rate limited per address and overall. Until RESEND_LIVE is "yes",
 * it only sends to test households (so nothing reaches real guests before invites go out).
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
      paragraphs: ["Hi " + h.name + ",", "Someone asked for your link to Nadia and Griffin's wedding site. Here it is."],
      button: { label: "Open your invite", url: h.link },
      notes: ["This link is just for your household, so please don't share it.", "If you didn't ask for this, you can ignore it."],
    })
    MailApp.sendEmail({ to: email, replyTo: prop_("REPLY_TO"), name: "Nadia & Griffin", subject: "Your link for Nadia & Griffin's wedding", body: mail.text, htmlBody: mail.html })
    log_(h.name, h.token, "Link re-sent to " + email + " (asked on the site)", "")
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
    subject: "RSVP change: " + list + " can't make it now",
    body: household + " changed their RSVP.\n\n" + list + ": coming → can't make it\n\nSee the Log tab for details.",
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
  log_("(test send)", "", "Test invites: " + list.length + " sent to the test address. Invite sent not filled.", "")
  PropertiesService.getScriptProperties().setProperty("last_test_send", new Date().toISOString() + " · " + list.length)
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
  const list = households_().filter((h) => h.invited && !h.responded && h.emails.length)
  const result = sendBatch_("reminder", list, false)
  log_("Everyone", "", "Scheduled reminder: sent " + result.sent + (result.left ? ", " + result.left + " left (daily limit)" : ""), "")
  cancelReminder(true)
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
  forgetAllHouseholds_()
  ui.alert("Reset " + tests.length + " test household" + (tests.length === 1 ? "" : "s") + ".")
}

/** Creates the 1-minute trigger that sends confirmation emails and writes visit counts. */
function setupQueue() {
  PropertiesService.getScriptProperties().deleteProperty("flush_trigger")
  const ok = flushTriggerReady_()
  SpreadsheetApp.getUi().alert(ok ? "The email queue is on. Saves are faster, and visits are written every minute." : "Couldn't turn it on: " + (CacheService.getScriptCache().get("trigger_err") || "unknown error"))
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
  const font = "Georgia, 'Times New Roman', serif"
  const p = (s, size, colour) => '<p style="margin:0 0 14px;font:' + (size || 17) + "px/1.55 " + font + ";color:" + (colour || c.body) + '">' + esc_(s).replace(/\n/g, "<br>") + "</p>"
  let html = '<div style="max-width:520px;margin:0 auto;padding:24px 16px">'
  let text = ""
  if (m.eyebrow) { html += p(m.eyebrow, 14, c.link); text += m.eyebrow + "\n\n" }
  html += '<h1 style="margin:0 0 18px;font:400 26px/1.25 ' + font + ";color:" + c.ink + '">' + esc_(m.heading) + "</h1>"
  text += m.heading + "\n\n"
  ;(m.paragraphs || []).forEach((x) => { html += p(x); text += x + "\n\n" })
  if (m.list) {
    html += p(m.list.title, 16, c.ink) + '<ul style="margin:0 0 18px;padding-left:20px;font:16px/1.55 ' + font + ";color:" + c.body + '">' + m.list.items.map((i) => "<li>" + esc_(i) + "</li>").join("") + "</ul>"
    text += m.list.title + ":\n" + m.list.items.map((i) => "- " + i).join("\n") + "\n\n"
  }
  if (m.rows && m.rows.length) {
    html += '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 20px;border-top:1px solid ' + c.line + '">' +
      m.rows.map((r) => '<tr><td style="padding:8px 12px 8px 0;border-bottom:1px solid ' + c.line + ";font:600 16px/1.4 " + font + ";color:" + c.ink + ';vertical-align:top">' + esc_(r[0]) + '</td><td style="padding:8px 0;border-bottom:1px solid ' + c.line + ";font:16px/1.4 " + font + ";color:" + c.body + '">' + esc_(r[1]) + "</td></tr>").join("") +
      "</table>"
    text += m.rows.map((r) => r[0] + ": " + r[1]).join("\n") + "\n\n"
  }
  if (m.button) {
    html += '<p style="margin:4px 0 22px"><a href="' + esc_(m.button.url) + '" style="display:inline-block;background:' + c.button + ";color:" + c.onButton + ";text-decoration:none;font:600 17px/1 " + font + ';padding:14px 24px;border-radius:999px">' + esc_(m.button.label) + "</a></p>"
    text += m.button.label + ":\n" + m.button.url + "\n\n"
  }
  ;(m.notes || []).forEach((n) => { html += p(n, 14, c.muted); text += n + "\n" })
  html += p("Nadia & Griffin", 18, c.ink).replace("margin:0 0 14px", "margin:20px 0 0") + "</div>"
  text += "\nNadia & Griffin"
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
