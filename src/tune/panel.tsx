import { useEffect, useMemo, useRef, useState } from "react"
import { Download, MapPin, RotateCcw, X } from "lucide-react"
import tokensCss from "@/styles/tokens.css?raw"
import { empty, exportJson, load, OPTIONS, save, type Note, type Scope, type TuneState } from "./store"
import { cn } from "@/lib/utils"

/**
 * The tuning panel: every token in tokens.css (read from the file itself, so it never drifts),
 * grouped by layer. System colours are edited per mode; everything else applies to both.
 * Notes mode: click anything to pin a note (selector, viewport and mode are kept with it).
 * Export copies tune.json and downloads it; .brief/tune.json is applied by scripts/apply-tune.mjs.
 */
type Token = { name: string; value: string; comment: string; group: string; perMode: boolean }

const GROUPS: [string, RegExp][] = [
  ["Brand", /^--brand-/], ["System", /^--sys-/], ["Letter", /^--letter-/], ["Inputs", /^--input-/], ["Buttons", /^--button-/],
  ["Countdown", /^--countdown-/], ["Scene", /^--scene-/], ["Type", /^--(type-|font-|rule-)/], ["Space", /^--space-/], ["Radius", /^--radius-/],
  ["Motion", /^--(duration-|ease-|press-)/],
]

function parse(): Token[] {
  const out = new Map<string, Token>()
  for (const line of tokensCss.split("\n")) {
    const m = line.match(/^\s*(--[a-z0-9-]+):\s*([^;]+);\s*(?:\/\*\s*(.*?)\s*\*\/)?/)
    if (!m) continue
    const [, name, value, comment = ""] = m
    const group = GROUPS.find(([, re]) => re.test(name))?.[0]
    if (!group || out.has(name)) continue
    out.set(name, { name, value: value.trim(), comment, group, perMode: group === "System" })
  }
  return [...out.values()]
}

const isColour = (v: string) => /^#|^rgb|var\(--brand-|var\(--sys-/.test(v) && !/px|ms|em/.test(v)
const isPx = (v: string) => /^-?\d+(\.\d+)?px$/.test(v)
const isMs = (v: string) => /^\d+(\.\d+)?m?s$/.test(v)

function toHex(css: string, probeHost: HTMLElement) {
  const p = document.createElement("span")
  p.style.color = css
  probeHost.appendChild(p)
  const c = getComputedStyle(p).color
  p.remove()
  const m = c.match(/\d+(\.\d+)?/g)
  return m ? "#" + m.slice(0, 3).map((x) => Math.round(+x).toString(16).padStart(2, "0")).join("") : "#000000"
}

/** A selector good enough to find the element again: id, or tag + classes + nth-of-type, up to 4 levels. */
function selectorFor(el: Element): string {
  const parts: string[] = []
  let node: Element | null = el
  for (let i = 0; node && i < 4 && node !== document.body; i++) {
    if (node.id) { parts.unshift(`#${CSS.escape(node.id)}`); break }
    const tag = node.tagName.toLowerCase()
    const cls = [...node.classList].filter((c) => !/[:[\]/]/.test(c)).slice(0, 2).map((c) => `.${CSS.escape(c)}`).join("")
    const parent: Element | null = node.parentElement
    const same = parent ? [...parent.children].filter((c) => c.tagName === node!.tagName) : []
    parts.unshift(`${tag}${cls}${same.length > 1 ? `:nth-of-type(${same.indexOf(node) + 1})` : ""}`)
    node = parent
  }
  return parts.join(" > ")
}

export function TunePanel({ onClose }: { onClose: () => void }) {
  const tokens = useMemo(parse, [])
  const [state, setState] = useState<TuneState>(load)
  const [mode, setMode] = useState<"autumn" | "lantern">(() => (document.documentElement.dataset.theme === "lantern" ? "lantern" : "autumn"))
  const [tab, setTab] = useState<"tokens" | "options" | "notes">("tokens")
  const [q, setQ] = useState("")
  const [pinning, setPinning] = useState(false)
  const [draft, setDraft] = useState<{ selector: string; x: number; y: number } | null>(null)
  const [msg, setMsg] = useState("")
  const host = useRef<HTMLDivElement>(null)
  const [, force] = useState(0)

  const update = (next: TuneState) => { setState(next); save(next) }
  const scopeOf = (t: Token): Scope => (t.perMode ? mode : "all")
  const current = (t: Token) => state.overrides[scopeOf(t)][t.name]
  const set = (t: Token, v: string) => {
    const s = scopeOf(t)
    const o = { ...state.overrides[s] }
    if (v === "" || v === t.value) delete o[t.name]; else o[t.name] = v
    update({ ...state, overrides: { ...state.overrides, [s]: o } })
  }

  // Notes: click anything (outside the panel) to pin a note to it
  useEffect(() => {
    if (!pinning) return
    const onClick = (e: MouseEvent) => {
      const el = e.target as Element
      if (host.current?.contains(el)) return
      e.preventDefault(); e.stopPropagation()
      setDraft({ selector: selectorFor(el), x: e.clientX, y: e.clientY })
      setPinning(false)
    }
    document.addEventListener("click", onClick, true)
    document.documentElement.classList.add("tune-pinning")
    return () => { document.removeEventListener("click", onClick, true); document.documentElement.classList.remove("tune-pinning") }
  }, [pinning])
  // Keep pins in place as the page scrolls or resizes
  useEffect(() => {
    const on = () => force((n) => n + 1)
    window.addEventListener("scroll", on, true); window.addEventListener("resize", on)
    return () => { window.removeEventListener("scroll", on, true); window.removeEventListener("resize", on) }
  }, [])

  const addNote = (text: string) => {
    if (!draft || !text.trim()) return setDraft(null)
    const n: Note = { id: Math.random().toString(36).slice(2, 8), selector: draft.selector, text: text.trim(), viewport: { w: innerWidth, h: innerHeight }, path: location.pathname + location.hash, theme: document.documentElement.dataset.theme || "autumn", at: new Date().toISOString() }
    update({ ...state, notes: [...state.notes, n] })
    setDraft(null)
  }

  async function doExport() {
    const json = exportJson(state)
    try { await navigator.clipboard.writeText(json); setMsg("Copied tune.json") } catch { setMsg("Downloaded tune.json") }
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob([json], { type: "application/json" }))
    a.download = "tune.json"
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const shown = tokens.filter((t) => !q || t.name.includes(q.toLowerCase()) || t.comment.toLowerCase().includes(q.toLowerCase()))
  const changed = Object.values(state.overrides).reduce((n, o) => n + Object.keys(o).length, 0)

  return (
    <>
      {state.notes.map((n, i) => {
        const el = document.querySelector(n.selector)
        const r = el?.getBoundingClientRect()
        return r ? <span key={n.id} title={n.text} className="tune-pin" style={{ left: r.left + 4, top: r.top + 4 }}>{i + 1}</span> : null
      })}
      {draft && <NoteBox x={draft.x} y={draft.y} onSave={addNote} onCancel={() => setDraft(null)} />}
      <div ref={host} role="dialog" aria-label="Adjust" className="tune-panel" data-theme={document.documentElement.dataset.theme}>
        <header className="flex items-center gap-2 border-b border-border p-3">
          <p className="label-caps flex-1 text-foreground">Adjust · {changed} changed</p>
          <button type="button" onClick={onClose} aria-label="Close" className="press grid size-11 place-items-center rounded-sm text-foreground"><X className="size-5" aria-hidden /></button>
        </header>
        <div className="flex gap-1 border-b border-border p-2" role="tablist">
          {(["tokens", "options", "notes"] as const).map((x) => (
            <button key={x} role="tab" aria-selected={tab === x} onClick={() => setTab(x)} className="state min-h-11 flex-1 rounded-sm text-foreground">{x === "tokens" ? "Tokens" : x === "options" ? "Options" : `Notes (${state.notes.length})`}</button>
          ))}
        </div>
        {tab === "tokens" ? (
          <div className="flex-1 overflow-y-auto p-3">
            <div className="mb-3 flex items-center gap-2">
              <span className="label-caps text-muted-foreground">System colours for</span>
              {(["autumn", "lantern"] as const).map((m) => (
                <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)} className="state min-h-11 rounded-sm px-3 text-foreground">{m === "autumn" ? "Light" : "Lantern"}</button>
              ))}
            </div>
            <input className="state field mb-3" placeholder="Find a token" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Find a token" />
            {GROUPS.map(([g]) => {
              const list = shown.filter((t) => t.group === g)
              if (!list.length) return null
              return (
                <details key={g} open={Boolean(q) || g === "Brand" || g === "System"} className="mb-2 border-b border-border pb-2">
                  <summary className="label-caps cursor-pointer py-2 text-foreground">{g}{g === "System" ? ` · ${mode === "autumn" ? "Light" : "Lantern"}` : ""}</summary>
                  {list.map((t) => <TokenRow key={t.name + scopeOf(t)} t={t} value={current(t)} host={host} onChange={(v) => set(t, v)} />)}
                </details>
              )
            })}
          </div>
        ) : tab === "options" ? (
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-3">
            <p className="text-sm">Prototype switches. The first choice in each is what ships; export keeps your picks.</p>
            {OPTIONS.map((o) => (
              <div key={o.key} role="group" aria-label={o.label} className="flex flex-col gap-2">
                <p className="label-caps text-foreground">{o.label}</p>
                <div className="flex gap-2">
                  {o.values.map(([v, label]) => (
                    <button key={v} type="button" aria-pressed={(state.options[o.key] ?? o.values[0][0]) === v}
                      onClick={() => update({ ...state, options: { ...state.options, [o.key]: v } })} className="state min-h-11 flex-1 rounded-sm text-foreground">{label}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
            <button type="button" aria-pressed={pinning} onClick={() => setPinning(!pinning)} className="state inline-flex min-h-11 items-center justify-center gap-2 rounded-sm text-foreground">
              <MapPin className="size-4" aria-hidden />{pinning ? "Click anything on the page…" : "Pin a note"}
            </button>
            <ol className="flex flex-col gap-2">
              {state.notes.map((n, i) => (
                <li key={n.id} className="flex gap-2 rounded-sm border border-border p-2 text-sm">
                  <span className="tune-pin !static">{i + 1}</span>
                  <span className="min-w-0 flex-1"><span className="block text-foreground">{n.text}</span><span className="block truncate text-muted-foreground">{n.path} · {n.viewport.w}×{n.viewport.h} · {n.theme}</span></span>
                  <button type="button" aria-label={`Delete note ${i + 1}`} onClick={() => update({ ...state, notes: state.notes.filter((x) => x.id !== n.id) })} className="press grid size-11 shrink-0 place-items-center rounded-sm"><X className="size-4" aria-hidden /></button>
                </li>
              ))}
            </ol>
          </div>
        )}
        <footer className="flex flex-wrap items-center gap-2 border-t border-border p-3">
          <button type="button" onClick={doExport} className="btn-primary inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg"><Download className="size-4" aria-hidden />Export</button>
          <button type="button" onClick={() => { if (confirm("Clear every change and note?")) update(empty()) }} className="state inline-flex min-h-11 items-center gap-2 rounded-sm px-3 text-foreground"><RotateCcw className="size-4" aria-hidden />Reset</button>
          {msg && <p role="status" className="w-full text-sm text-success">{msg}</p>}
        </footer>
      </div>
    </>
  )
}

function TokenRow({ t, value, host, onChange }: { t: Token; value?: string; host: React.RefObject<HTMLDivElement | null>; onChange: (v: string) => void }) {
  const v = value ?? t.value
  const colour = isColour(t.value)
  const px = isPx(t.value), ms = isMs(t.value)
  const num = px || ms ? parseFloat(v) : NaN
  const unit = px ? "px" : t.value.endsWith("ms") ? "ms" : "s"
  return (
    <div className={cn("flex items-center gap-2 py-1", value !== undefined && "tune-changed")}>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-label text-[12px] text-foreground" title={t.name}>{t.name.replace(/^--/, "")}</span>
        {t.comment && <span className="block truncate text-[12px] text-muted-foreground" title={t.comment}>{t.comment}</span>}
      </span>
      {colour ? (
        <input type="color" aria-label={t.name} value={host.current ? toHex(v, host.current) : "#000000"} onChange={(e) => onChange(e.target.value)} className="h-8 w-10 cursor-pointer rounded-sm border border-border bg-transparent" />
      ) : px || ms ? (
        <input type="number" aria-label={t.name} value={Number.isNaN(num) ? "" : num} step={px ? 1 : 10} onChange={(e) => onChange(e.target.value === "" ? "" : `${e.target.value}${unit}`)} className="state h-8 w-20 rounded-sm px-2 text-right font-label text-[12px] text-foreground" />
      ) : (
        <input type="text" aria-label={t.name} value={v} onChange={(e) => onChange(e.target.value)} className="state h-8 w-40 rounded-sm px-2 font-label text-[12px] text-foreground" />
      )}
      {value !== undefined && <button type="button" aria-label={`Reset ${t.name}`} onClick={() => onChange("")} className="press grid size-8 place-items-center rounded-sm text-muted-foreground"><RotateCcw className="size-3" aria-hidden /></button>}
    </div>
  )
}

function NoteBox({ x, y, onSave, onCancel }: { x: number; y: number; onSave: (t: string) => void; onCancel: () => void }) {
  const [text, setText] = useState("")
  return (
    <div className="tune-note" style={{ left: Math.min(x, innerWidth - 300), top: Math.min(y, innerHeight - 180) }}>
      <textarea autoFocus aria-label="Note" value={text} onChange={(e) => setText(e.target.value)} placeholder="What should change here?" className="state field h-24 py-2" />
      <div className="mt-2 flex gap-2">
        <button type="button" onClick={() => onSave(text)} className="btn-primary min-h-11 flex-1 rounded-lg">Pin note</button>
        <button type="button" onClick={onCancel} className="state min-h-11 rounded-sm px-3 text-foreground">Cancel</button>
      </div>
    </div>
  )
}
