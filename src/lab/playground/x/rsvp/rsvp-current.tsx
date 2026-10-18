import { CurrentSite } from "../../current"

/** The reply as the site has it today: Home with the sheet opened (/?rsvp=1), so it can be compared at the same size. */
const css = `
.x-rsvp-current { position: relative; min-height: var(--stage-h, 100svh); background: var(--background); }
.x-rsvp-current-note { position: absolute; left: 50%; top: 8px; transform: translateX(-50%); z-index: 2; margin: 0; padding: 6px 12px; border-radius: var(--radius-pill); background: var(--ink); color: var(--letter-bg); font: 500 var(--type-label-size) / var(--type-label-leading) var(--font-label); white-space: nowrap; pointer-events: none; opacity: 0.88; }
`
export default function RsvpCurrent() {
  return (
    <div className="x-rsvp-current">
      <style>{css}</style>
      <CurrentSite path="/?rsvp=1" title="RSVP today" />
      <p className="x-rsvp-current-note">Opens on the reply sheet. Close it and tap RSVP to open it again.</p>
    </div>
  )
}
