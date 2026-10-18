import { useEffect, useState } from "react"
import { ArrowLeft, ClipboardCopy, Columns2, RotateCcw, SlidersHorizontal, Smartphone } from "lucide-react"
import { Segmented } from "@/components/segmented"
import { Button } from "@/components/ui/button"
import { Sheet, SheetBody, SheetContent, SheetHead, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { toast } from "@/components/ui/toast"
import { Qr } from "@/components/qr"
import { useTheme, type Theme } from "@/lib/theme"
import type { ALL } from "./registry"
import { setSpeed, useSpeed } from "./motion"
import { getParam, setParam, useParam } from "./params"
import { PerfBadge } from "./perf"

type E = (typeof ALL)[number]
const labBase = import.meta.env.VITE_LAB_BASE || import.meta.env.BASE_URL
const PAPERS = [["chosen", "Chosen"], ["subtle", "Very subtle"], ["fibre", "More fibre"], ["nofolds", "No folds"], ["off", "Off"]] as const

/** The wifi address of the dev server, when it runs with --host (scripts/lab-serve.mjs); empty otherwise */
export function useLan() {
  const [lan, setLan] = useState("")
  useEffect(() => { void fetch(`${import.meta.env.BASE_URL}__lab/lan`).then((r) => r.json()).then((j: { lan?: string }) => setLan(j.lan ?? "")).catch(() => {}) }, [])
  return lan
}
/** This exact view's address on the wifi (for a phone), or null when the server isn't on the wifi */
export const phoneUrl = (lan: string, search = location.search) => (lan ? `${lan}/lab-play.html${search}` : null)

/** A QR for a phone on the same wifi, or how to get one */
export function PhoneQr({ search }: { search: string }) {
  const url = phoneUrl(useLan(), search)
  if (!url) return <p className="text-small text-muted-foreground">For a phone: <code>npm run lab -- --host</code>, then this shows a QR code.</p>
  return (
    <div className="flex items-center gap-3">
      <Qr value={url} label="QR code for this view on a phone" className="size-32 shrink-0 text-foreground" />
      <a href={url} className="btn-text break-all text-small">{url}</a>
    </div>
  )
}

/** The view as a note to paste into Claude Code: what it is, the take, every setting, the link */
export function settingsNote(e: E, theme: Theme, speed: number) {
  const take = e.takes?.find((t) => t.id === (getParam("take") ?? e.takes?.[0].id))
  const knobs = (e.knobs ?? []).map((k) => {
    const v = getParam(`k.${k.id}`) ?? String(k.def)
    return `- ${k.label}: ${k.kind === "select" ? k.options.find(([o]) => o === v)?.[1] ?? v : `${v}${k.unit ?? ""}`} (k.${k.id}=${v})`
  })
  return [
    `Lab: ${e.title} (${e.areaTitle}, ${e.id})`,
    take ? `Take: ${take.label} (take=${take.id})` : null,
    ...knobs,
    `Theme: ${theme === "lantern" ? "Lantern" : "Light"}, speed ${speed}×`,
    e.deciding ? `Deciding: ${e.deciding}` : null,
    `View: ${location.origin}${location.pathname}${location.search}`,
  ].filter(Boolean).join("\n")
}
export async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text); toast("Settings copied."); return true } catch { return false }
}

/**
 * The experiment's controls, on top of it: Compare with live (swaps in place) and an Options sheet (the take, the
 * knobs, theme, paper, speed, Replay, Copy settings, the phone QR, back to the lab). Everything writes the address.
 */
export function Controls({ e, live, setLive, replay }: { e: E; live: boolean; setLive: (v: boolean) => void; replay: () => void }) {
  const speed = useSpeed()
  const { theme, setTheme } = useTheme()
  const [take, setTake] = useParam("take", e.takes?.[0].id ?? "")
  const [paper] = useParam("paper", "chosen")
  const [fallback, setFallback] = useState<string | null>(null)
  // The theme for this view only: the guest site on this device keeps its own saved one
  const pickTheme = (t: Theme) => {
    let saved: string | null = null
    try { saved = localStorage.getItem("ng-theme") } catch { /* fine */ }
    setTheme(t)
    try { if (saved === null) localStorage.removeItem("ng-theme"); else localStorage.setItem("ng-theme", saved) } catch { /* fine */ }
    setParam("theme", t === "lantern" ? "lantern" : "light")
  }
  const copy = async () => { const note = settingsNote(e, theme, speed); if (!(await copyText(note))) setFallback(note) }
  return (
    <div className="lab-controls">
      {e.live && (
        <button type="button" className="lab-fab lab-fab-quiet" title="Compare with live" aria-pressed={live} onClick={() => setLive(!live)}>
          <Columns2 className="size-5" aria-hidden /><span className="sr-only">Compare with live</span>
        </button>
      )}
      <Sheet>
        <SheetTrigger className="lab-fab btn-primary" title="Options"><SlidersHorizontal className="size-5" aria-hidden /><span className="sr-only">Options</span></SheetTrigger>
        <SheetContent aria-describedby={undefined} closeLabel="Close the options">
          <SheetHead>
            <p className="label-caps text-muted-foreground">{e.areaTitle}</p>
            <SheetTitle className="font-display text-heading text-foreground">{e.title}</SheetTitle>
          </SheetHead>
          <SheetBody className="flex flex-col gap-4">
            {e.deciding && <p className="lab-deciding"><strong>Deciding:</strong> {e.deciding}</p>}
            {e.parked && <p className="text-small"><strong>Parked:</strong> {e.parked}</p>}
            {e.takes && <Choice label="Take" value={take} onChange={(v) => { setTake(v); setLive(false) }} items={e.takes.map((t) => [t.id, t.label])} />}
            {e.knobs?.map((k) => <KnobField key={k.id} k={k} />)}
            <Segmented label="Theme" value={theme === "lantern" ? "lantern" : "light"} onChange={(v) => pickTheme(v === "lantern" ? "lantern" : "autumn")} items={[{ value: "light", label: "Light" }, { value: "lantern", label: "Lantern" }]} />
            <label className="lab-field">
              <span className="label-caps text-muted-foreground">Paper</span>
              {/* The paper starts once per page, so a change reloads (the address keeps everything else) */}
              <select className="field" value={paper} onChange={(ev) => { setParam("paper", ev.target.value === "chosen" ? null : ev.target.value); location.reload() }}>
                {PAPERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <label className="lab-speed">
              <span className="text-small text-muted-foreground">Speed</span>
              <input type="range" min={0.25} max={2} step={0.05} value={speed} onChange={(ev) => { const v = parseFloat(ev.target.value); setSpeed(v); setParam("speed", v === 1 ? null : String(v)) }} aria-valuetext={`${speed.toFixed(2)} times`} />
              <output className="numerals w-12 text-small text-foreground">{speed.toFixed(2)}×</output>
            </label>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={replay}><RotateCcw aria-hidden />Replay</Button>
              <Button variant="secondary" size="sm" onClick={copy}><ClipboardCopy aria-hidden />Copy settings</Button>
              <a className="btn-text inline-flex min-h-11 items-center gap-1 text-small" href={`${labBase}lab.html`}><ArrowLeft className="size-4" aria-hidden />All experiments</a>
            </div>
            {fallback && <label className="lab-field"><span className="text-small">Settings below (copying wasn't allowed):</span><textarea className="field" rows={6} readOnly value={fallback} onFocus={(ev) => ev.currentTarget.select()} autoFocus /></label>}
            <PerfBadge id={e.id} />
            <details>
              <summary className="inline-flex min-h-11 items-center gap-2 text-small"><Smartphone className="size-4" aria-hidden />On a phone</summary>
              <PhoneQr search={location.search} />
            </details>
          </SheetBody>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function KnobField({ k }: { k: NonNullable<E["knobs"]>[number] }) {
  const [v, set] = useParam(`k.${k.id}`, String(k.def))
  if (k.kind === "select") return <Choice label={k.label} value={v} onChange={set} items={k.options} />
  return (
    <label className="lab-speed">
      <span className="text-small text-muted-foreground">{k.label}</span>
      <input type="range" min={k.min} max={k.max} step={k.step} value={v} onChange={(ev) => set(ev.target.value)} aria-valuetext={`${v}${k.unit ?? ""}`} />
      <output className="numerals w-14 text-small text-foreground">{v}{k.unit ?? ""}</output>
    </label>
  )
}

/** A choice in the sheet: native radios, wrapping, so long labels never run off a phone */
function Choice({ label, value, onChange, items }: { label: string; value: string; onChange: (v: string) => void; items: [string, string][] }) {
  return (
    <fieldset className="lab-field">
      <legend className="label-caps text-muted-foreground">{label}</legend>
      <div className="lab-choice">
        {items.map(([v, l]) => (
          <label key={v} className="lab-pick"><input type="radio" name={`c-${label}`} value={v} checked={value === v} onChange={() => onChange(v)} />{l}</label>
        ))}
      </div>
    </fieldset>
  )
}
