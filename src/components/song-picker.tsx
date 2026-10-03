import { useEffect, useId, useRef, useState } from "react"
import { Loader2, Music2, Search, X } from "lucide-react"
import { searchSongs, type SongHit } from "@/lib/api"
import { cn } from "@/lib/utils"
import { InlineSubmit } from "@/components/inline-submit"

type Labels = {
  label: string; hint: string; placeholder: string; addTyped: string; justType: string; searching: string; noMatch: (q: string) => string; error: string
  remove: (s: string) => string; full: (n: number) => string; added: string
}

/** Bold the parts of `text` that match the words typed. */
function Mark({ text, q }: { text: string; q: string }) {
  const words = q.trim().split(/\s+/).filter((w) => w.length > 1).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  if (!words.length) return <>{text}</>
  const parts = text.split(new RegExp(`(${words.join("|")})`, "gi"))
  return <>{parts.map((p, i) => (i % 2 ? <b key={i} className="font-semibold">{p}</b> : p))}</>
}

/**
 * Song search as a WAI-ARIA combobox. States: idle, typing (<2 chars), loading (previous results
 * dimmed), results, no match (offer to add as typed), error (just type it), selected (chips, max 3).
 * Stale answers are ignored; results are cached per query for this visit.
 */
export function SongPicker({ songs, onChange, token, max = 3, maxLength = 200, t }: {
  songs: string[]; onChange: (s: string[]) => void; token: string; max?: number; maxLength?: number; t: Labels
}) {
  const id = useId()
  const [q, setQ] = useState("")
  const [hits, setHits] = useState<SongHit[]>([])
  const [status, setStatus] = useState<"idle" | "loading" | "results" | "none" | "error">("idle")
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [art, setArt] = useState<Record<string, string>>({})
  const cache = useRef(new Map<string, SongHit[]>())
  const seq = useRef(0)
  const input = useRef<HTMLInputElement>(null)
  const list = songs.filter(Boolean)
  const full = list.length >= max

  useEffect(() => {
    const term = q.trim()
    if (term.length < 2) { setStatus("idle"); setOpen(false); return }
    const hit = cache.current.get(term.toLowerCase())
    if (hit) { setHits(hit); setStatus(hit.length ? "results" : "none"); setOpen(true); setActive(-1); return }
    const n = ++seq.current
    const ctrl = new AbortController()
    const timer = setTimeout(() => {
      setStatus("loading"); setOpen(true)
      searchSongs(term, token, ctrl.signal).then((r) => {
        if (n !== seq.current) return // a newer search has started
        if (r === null) { setStatus("error"); return }
        cache.current.set(term.toLowerCase(), r)
        setHits(r); setStatus(r.length ? "results" : "none"); setActive(-1)
      })
    }, 300)
    return () => { clearTimeout(timer); ctrl.abort() }
  }, [q, token])

  const options: { key: string; label: string; hit?: SongHit }[] =
    status === "results" || (status === "loading" && hits.length)
      ? hits.map((h, i) => ({ key: `${i}`, label: `${h.title}, ${h.artist}`, hit: h }))
      : status === "none" || status === "error" ? [{ key: "typed", label: q.trim() }] : []

  function add(label: string, hit?: SongHit) {
    const v = label.trim().slice(0, maxLength)
    if (!v || full || list.includes(v)) return
    if (hit?.artwork) setArt((a) => ({ ...a, [v]: hit.artwork! }))
    onChange([...list, v])
    setQ(""); setHits([]); setOpen(false); setStatus("idle")
    requestAnimationFrame(() => input.current?.focus())
  }

  return (
    <div className="flex flex-col gap-3">
      {list.length > 0 && (
        <ul aria-label={t.added} className="flex flex-col gap-2">
          {list.map((s) => (
            <li key={s} className="flex min-h-14 items-center gap-3 rounded-md border bg-card py-1 pr-1 pl-2">
              {art[s] ? <img src={art[s]} alt="" className="size-10 rounded-md object-cover" /> : <span aria-hidden className="grid size-10 place-items-center rounded-md bg-muted text-muted-foreground"><Music2 className="size-4" /></span>}
              <span className="min-w-0 flex-1 truncate text-foreground">{s}</span>
              <button type="button" onClick={() => onChange(list.filter((x) => x !== s))} aria-label={t.remove(s)}
                className="press grid size-11 shrink-0 place-items-center rounded-sm text-muted-foreground outline-2 outline-offset-2 outline-transparent hover:text-foreground focus-visible:outline-ring">
                <X className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
      {full ? (
        <p className="text-success">{t.full(list.length)}</p>
      ) : (
        <div className="relative">
          <InlineSubmit ref={input} id={`${id}-in`} label={t.label} helper={t.hint} submitLabel={t.addTyped}
            leading={<Search className="size-4" />} onSubmit={() => q.trim() && add(q)}
            fallback={q.trim().length > 1 ? { label: t.justType, onClick: () => add(q) } : undefined}
            trailing={status === "loading" ? <Loader2 aria-hidden className="absolute top-1/2 right-16 size-4 -translate-y-1/2 animate-spin text-muted-foreground" /> : undefined}
            role="combobox" aria-autocomplete="list" aria-expanded={open && options.length > 0}
            aria-controls={`${id}-list`} aria-busy={status === "loading"}
            aria-activedescendant={open && active >= 0 ? `${id}-o${active}` : undefined}
            value={q} maxLength={maxLength} autoComplete="off" placeholder={t.placeholder}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => q.trim().length > 1 && setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, options.length - 1)) }
              else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
              else if (e.key === "Enter") {
                e.preventDefault()
                const o = active >= 0 ? options[active] : undefined
                if (o) add(o.label, o.hit); else if (q.trim()) add(q)
              } else if (e.key === "Escape") setOpen(false)
            }} />
          <p aria-live="polite" className="sr-only">{status === "loading" ? t.searching : status === "results" ? `${hits.length} results` : status === "none" ? t.noMatch(q.trim()) : ""}</p>
          {open && options.length > 0 && (
            <ul id={`${id}-list`} role="listbox" aria-label={t.label}
              className={cn("absolute inset-x-0 top-[calc(56px+var(--input-height)+var(--space-3))] z-20 max-h-96 overflow-y-auto rounded-md border bg-card p-1 shadow-paper", status === "loading" && "opacity-60")}>
              {options.map((o, i) => (
                <li key={o.key} id={`${id}-o${i}`} role="option" aria-selected={i === active}
                  onMouseDown={(e) => { e.preventDefault(); add(o.label, o.hit) }}
                  className={cn("flex min-h-14 cursor-pointer items-center gap-3 rounded-sm px-2 py-1 text-foreground hover:bg-secondary", i === active && "bg-secondary")}>
                  {o.hit ? (
                    <>
                      {o.hit.artwork ? <img src={o.hit.artwork} alt="" className="size-10 shrink-0 rounded-md object-cover" /> : <span aria-hidden className="size-10 shrink-0 rounded-md bg-muted" />}
                      <span className="min-w-0">
                        <span className="block truncate"><Mark text={o.hit.title} q={q} /></span>
                        <span className="block truncate text-sm text-muted-foreground"><Mark text={o.hit.artist} q={q} /></span>
                      </span>
                    </>
                  ) : (
                    <span className="px-2">{status === "error" ? t.error : t.noMatch(o.label)}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
