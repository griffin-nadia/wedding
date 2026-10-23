// node scripts/render-emails.mjs [out-dir] — the invite, reminder, final-numbers and confirmation emails, rendered by the
// back end's own code (apps-script/Code.gs, loaded with Google's services stubbed out) for a made-up test household,
// as local HTML files. Nothing can send: MailApp is a stub that only records. Default out-dir: .brief/emails (gitignored).
import fs from "node:fs"
import path from "node:path"
import vm from "node:vm"

const out = process.argv[2] ?? ".brief/emails"
fs.mkdirSync(out, { recursive: true })
const sent = []
const ctx = {
  console,
  PropertiesService: { getScriptProperties: () => ({ getProperty: () => null, setProperty() {}, getProperties: () => ({}) }) },
  SpreadsheetApp: { getActive: () => ({ getSheetByName: () => null }) },
  CacheService: { getScriptCache: () => ({ get: () => null, put() {} }) },
  Session: { getEffectiveUser: () => ({ getEmail: () => "wedding@example.com" }) },
  MailApp: { sendEmail: (m) => sent.push(m) },
  // Apps Script's formatDate for the patterns the emails use ("EEE d MMM yyyy", "d MMMM yyyy", "d MMM"), in Kyoto time
  Utilities: { formatDate: (d, tz, f) => {
    const part = (o) => new Intl.DateTimeFormat("en-AU", { timeZone: "Asia/Tokyo", ...o }).format(d)
    return f.replace("EEE", part({ weekday: "short" })).replace("yyyy", part({ year: "numeric" })).replace("MMMM", part({ month: "long" })).replace(/M{3}(?!M)/, (x) => part({ month: "short" })).replace(/\bd\b/, part({ day: "numeric" }))
  } },
}
vm.createContext(ctx)
vm.runInContext(fs.readFileSync("apps-script/Code.gs", "utf8") + "\n;globalThis.__x = { inviteEmail_, sendConfirmation_, COPY, isLocked_ }", ctx)
// A test household (made up). emailsFor_ reads the sheet, so it answers for the stub instead.
vm.runInContext('emailsFor_ = () => ["test@example.com"]; isLocked_ = () => false', ctx)
const { inviteEmail_, sendConfirmation_ } = ctx.__x
const h = { token: "testtoken1", name: "Test Household", link: "https://griffin-nadia.github.io/wedding/?h=testtoken1" }
const page = (title, subject, html) => `<!doctype html><meta charset="utf-8"><title>${title}</title><body style="background:#f3e7d3;margin:0"><p style="font:13px sans-serif;padding:8px 16px;margin:0;background:#fff">Local preview, never sent. Subject: <b>${subject.replace(/</g, "&lt;")}</b></p>${html}</body>`
const files = []
for (const kind of ["invite", "reminder", "final"]) {
  const m = inviteEmail_(kind, h, "")
  fs.writeFileSync(path.join(out, `${kind}-en.html`), page(kind, m.subject, m.html)); files.push([`${kind}-en.html`, m.subject, m.html, m.text])
}
const guests = [{ id: "g1", firstName: "Test", attending: "yes", dietary: "Vegetarian" }, { id: "g2", firstName: "Second", attending: "no", dietary: "None" }]
for (const [name, changes] of [["confirmation-en", null], ["confirmation-updated-en", ["Second: coming → can't make it"]]]) {
  sent.length = 0
  sendConfirmation_({ token: h.token, displayName: h.name, guests, songs: ["A song, An artist"], arrival: "2027-10-12", departure: "2027-10-18" }, changes)
  const m = sent[0]
  fs.writeFileSync(path.join(out, `${name}.html`), page(name, m.subject, m.htmlBody)); files.push([`${name}.html`, m.subject, m.htmlBody, m.body, m.name, m.replyTo])
}
// What's checked: the links, the name order, the reply-by and change-by dates
const report = files.map(([f, subject, html, text, from, replyTo]) => ({
  file: f, subject,
  from: from ?? "Griffin & Nadia (name)", replyTo: replyTo ?? "wedding@example.com",
  links: [...new Set([...String(html).matchAll(/href="([^"]+)"/g)].map((x) => x[1]))],
  nadiaFirst: /Nadia\s*(&|and)\s*Griffin/.test(subject + html + text),
  rsvpBy: (/Mon 15 Feb 2027|15 February 2027/.exec(text) ?? [/Feb/.test(text) ? "other" : "-"])[0],
  changeBy: (/Fri 30 Apr 2027|30 April 2027/.exec(text) ?? [/Apr/.test(text) ? "other" : "-"])[0],
}))
fs.writeFileSync(path.join(out, "report.json"), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 1))
