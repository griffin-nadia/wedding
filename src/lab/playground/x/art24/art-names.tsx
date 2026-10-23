import { useMemo } from "react"
import { NamesArt } from "@/components/names-art"
import { useLang } from "@/lib/lang"
import { useTake } from "../../params"
import { A, ART_CSS } from "./parts"
// The back end's own email code, read-only: the mock runs its real buildEmail_ with the invite's real words
import CODE from "../../../../../apps-script/Code.gs?raw"

/**
 * Nadia's names lettering (ART.names) two more places (run 24, section 8):
 * - og: the link preview image (1200 × 630), the lettering on paper with the date line, in a message bubble the
 *   way a phone shows a shared link, today's og-image.png under it to compare
 * - email: the invite email with the lettering as its header, the rest the real HTML from apps-script buildEmail_
 * Both are fixed day colours (an image and an email don't follow the theme), so they sit in data-theme="autumn".
 */
const P = "x-names"
const css = `
.${P}-bubble { width: min(100%, 420px); border-radius: 18px; overflow: hidden; background: #e9e9eb; color: #000; box-shadow: 0 1px 2px rgb(0 0 0 / .12); }
[data-theme="lantern"] .${P}-bubble { background: #26252a; color: #fff; }
.${P}-bubble p { margin: 0; padding: 8px 12px 0; font: 600 14px/1.3 system-ui, sans-serif; }
.${P}-bubble small { display: block; padding: 2px 12px 10px; font: 13px/1.3 system-ui, sans-serif; opacity: .65; }
.${P}-og { container-type: inline-size; position: relative; aspect-ratio: 1200 / 630; display: grid; place-items: center; align-content: center; gap: 2.6cqw;
  background: radial-gradient(120% 90% at 50% 40%, var(--brand-paper-bright), color-mix(in oklab, var(--brand-paper-bright) 86%, #b98a5a)); color: var(--ink); }
.${P}-og .names-art-wrap { width: 72cqw; }
.${P}-og-line { font: 500 3.4cqw / 1 var(--font-label); letter-spacing: .14em; text-transform: uppercase; color: var(--ink-soft); }
.${P}-today { width: min(100%, 420px); aspect-ratio: 1200 / 630; object-fit: cover; border-radius: 8px; box-shadow: 0 0 0 1px var(--line-hairline); }
.${P}-mail { width: 100%; max-width: 600px; border-radius: 10px; overflow: hidden; background: #fff; color: #222; box-shadow: 0 0 0 1px var(--line-hairline), 0 12px 30px -16px rgb(0 0 0 / .4); }
.${P}-mailhead { padding: 12px 16px; border-bottom: 1px solid #eee; font: 13px/1.5 system-ui, sans-serif; color: #444; }
.${P}-mailhead b { color: #111; font-weight: 600; }
.${P}-header { display: block; padding: 28px 16px 0; background: #fbf5ea; }
.${P}-header .names-art-wrap { width: min(100%, 360px); margin-inline: auto; }
.${P}-header + div { background: #fbf5ea; }
`

/** The invite email as the back end writes it: its buildEmail_ and esc_ and its COPY, WEDDING and DEFAULTS, run as they are */
function inviteEmail(household: string) {
  const grab = (re: RegExp) => { const m = CODE.match(re); if (!m) throw new Error(`Code.gs changed: ${re}`); return m[0] }
  const src = [
    grab(/const FIRST = [^\n]+\nconst SECOND = [^\n]+\nconst COUPLE = [^\n]+/),
    grab(/const DEFAULTS = \{[\s\S]*?\n\}/), grab(/const WEDDING = \{[\s\S]*?\n\}/), grab(/const COPY = \{[\s\S]*?\n\}/),
    grab(/function buildEmail_\(m\) \{[\s\S]*?\n\}/), grab(/function esc_\(s\) \{[\s\S]*?\n\}/),
    "return { buildEmail_, COPY, WEDDING, DEFAULTS, COUPLE }",
  ].join("\n")
  type Mail = { html: string; text: string }
  // Local lab only: the repo's own back-end code, nothing from outside
  const gs = new Function(src)() as { buildEmail_: (m: object) => Mail; COPY: Record<string, string>; WEDDING: { date: string; venue: string }; DEFAULTS: Record<string, string>; COUPLE: string }
  const full = new Date(`${gs.DEFAULTS.RSVP_BY}T12:00:00+09:00`).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Tokyo" })
  const fill = (s: string) => s.replace(/\{household\}/g, household).replace(/\{rsvp_by_full\}/g, full).replace(/\{date\}/g, gs.WEDDING.date).replace(/\{venue\}/g, gs.WEDDING.venue)
  const c = gs.COPY
  const mail = gs.buildEmail_({
    heading: fill(c.invite_heading), paragraphs: fill(c.invite_body).split(/\n\s*\n/),
    rows: [["When", gs.WEDDING.date], ["Where", gs.WEDDING.venue]],
    button: { label: fill(c.invite_button), url: `${gs.DEFAULTS.SITE_URL}/?h=sample` },
    after: fill(c.invite_after).split(/\n\s*\n/), notes: ["This link is just for your household, so please don't share it."], signoff: c.invite_signoff,
  })
  return { html: mail.html, subject: fill(c.invite_subject), from: gs.COUPLE }
}

export default function ArtNames() {
  const take = useTake("og")
  const { t } = useLang()
  const mail = useMemo(() => (take === "email" ? inviteEmail("Sam & Alex") : null), [take])
  return (
    <div className={A}>
      <style>{ART_CSS + css}</style>
      {take === "og" && <>
        <figure className={`${P}-bubble`} aria-label="A shared link in a message (a mock)">
          <div className={`${P}-og`} data-theme="autumn" role="img" aria-label={`The link preview image: ${t.meta.title}, ${t.home.dateLine}`}>
            <NamesArt />
            <span aria-hidden className={`${P}-og-line`}>{t.home.dateLine}</span>
          </div>
          <p>{t.meta.title}</p>
          <small>griffin-nadia.github.io</small>
        </figure>
        <p className={`${A}-note`}>Today's preview image, to compare:</p>
        <img className={`${P}-today`} src={`${import.meta.env.BASE_URL}og-image.png`} alt="Today's link preview image" />
      </>}
      {take === "email" && mail && (
        <article className={`${P}-mail`} aria-label="The invite email (a mock)">
          <div className={`${P}-mailhead`}><b>{mail.from}</b><br />{mail.subject}<br />to Sam &amp; Alex</div>
          <div className={`${P}-header`} data-theme="autumn"><NamesArt /></div>
          {/* The back end's own HTML (every word through its esc_), as a mail client shows it */}
          <div dangerouslySetInnerHTML={{ __html: mail.html }} />
        </article>
      )}
    </div>
  )
}
