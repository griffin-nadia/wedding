import { useState } from "react"
import { ClipboardCopy, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { ALL } from "./registry"
import { playUrl, thumb } from "./shell"

const KEY = "ng-lab-picks"
const load = (): Record<string, string> => { try { return JSON.parse(localStorage.getItem(KEY) ?? "{}") } catch { return {} } }

/**
 * The Shortlist (lab run 19): every open decision on one page, its takes side by side, so Griffin and Nadia can choose
 * in one sitting. Each take opens full screen; a pick is remembered on this device, and Copy our picks makes the note
 * for Claude Code. Decisions without takes (a choice inside the experiment, like the paper's sliders) link to it.
 */
export function Shortlist() {
  const [picks, setPicks] = useState(load)
  const [show, setShow] = useState(false)
  const open = ALL.filter((e) => e.deciding)
  const pick = (id: string, take: string) => {
    const next = { ...picks, [id]: take }
    setPicks(next)
    try { localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* private mode: kept for this visit */ }
  }
  const note = () => [
    "Lab shortlist: our picks",
    ...open.map((e) => {
      const t = e.takes?.find((x) => x.id === picks[e.id])
      return `- ${e.title} (${e.id}): ${t ? `${t.label} (take=${t.id})` : e.takes ? "not picked yet" : "chosen inside the experiment (its Copy settings)"}`
    }),
  ].join("\n")
  const copy = async () => {
    try { await navigator.clipboard.writeText(note()); toast("Picks copied.") } catch { toast("Copying wasn't allowed: the picks are shown below.") ; setShow(true) }
  }
  const done = open.filter((e) => e.takes && picks[e.id]).length, total = open.filter((e) => e.takes).length
  return (
    <div className="lab-body flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-3">
        <p className="max-w-[70ch] text-small text-muted-foreground">
          Every open decision, side by side. Open a take to try it full screen (on a phone, scan its QR from the index), then pick one. Picks
          stay on this device.
        </p>
        <p className="numerals text-small text-foreground" aria-live="polite">{done} of {total} picked</p>
        <Button variant="secondary" size="sm" onClick={copy}><ClipboardCopy aria-hidden />Copy our picks</Button>
      </div>
      {show && <textarea className="field" rows={8} readOnly value={note()} aria-label="Our picks" onFocus={(ev) => ev.currentTarget.select()} />}
      {open.map((e) => (
        <fieldset key={e.id} className="lab-short">
          <legend className="font-display text-heading text-foreground">{e.title} <span className="label-caps text-muted-foreground">{e.areaTitle}</span></legend>
          <p className="lab-deciding"><strong>Deciding:</strong> {e.deciding}</p>
          <ul className="lab-short-takes">
            {(e.takes ?? [{ id: "", label: "Open it to choose" }]).map((t) => (
              <li key={t.id || "one"} className="lab-short-take" data-picked={(t.id && picks[e.id] === t.id) || undefined}>
                <a href={playUrl(e.id, t.id ? `take=${t.id}` : "")} target="_blank" rel="noreferrer" className="lab-card-link">
                  {thumb(e.id, t.id || undefined) ? <img src={thumb(e.id, t.id || undefined)} alt="" loading="lazy" className="lab-thumb" /> : <span aria-hidden className="lab-thumb" />}
                  <span className="inline-flex items-center gap-1 text-small text-foreground">{t.label}<ExternalLink className="size-4" aria-label="(opens full screen in a new tab)" /></span>
                </a>
                {t.id && (
                  <label className="lab-pick">
                    <input type="radio" name={`pick-${e.id}`} value={t.id} checked={picks[e.id] === t.id} onChange={() => pick(e.id, t.id)} />
                    <span>Pick {t.label}</span>
                  </label>
                )}
              </li>
            ))}
          </ul>
        </fieldset>
      ))}
    </div>
  )
}
