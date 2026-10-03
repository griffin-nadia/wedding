import { useEffect, useRef, useState } from "react"
import { ArrowRight, Music2, Search, X } from "lucide-react"
import { searchSongs, type SongHit } from "@/lib/api"
import { rankSongs, splitVersion } from "@/lib/song-rank"
import { Combobox, type ComboStatus } from "@/components/combobox"

type Labels = {
  label: string; hint: string; placeholder: string; addTyped: string; justType: string; searching: string; noMatch: (q: string) => string; error: string
  remove: (s: string) => string; full: (n: number) => string; added: string; versions: (n: number) => string; hideVersions: string
}

/**
 * Song search on the shared combobox, straight from the browser to iTunes (the script only if that fails).
 * Nothing before two characters; the last results stay on screen until new ones arrive (stale answers
 * ignored, cached per visit). Ranked title-first (v3 Q3); versions of one song fold into one row with an
 * "N versions" row under it that opens them. "Just type it" is always there. Picked songs sit under the
 * field as cards (max 3).
 */
export function SongPicker({ songs, onChange, token, max = 3, maxLength = 200, t }: {
  songs: string[]; onChange: (s: string[]) => void; token: string; max?: number; maxLength?: number; t: Labels
}) {
  const [q, setQ] = useState("")
  const [hits, setHits] = useState<SongHit[]>([])
  const [status, setStatus] = useState<ComboStatus>("idle")
  const [shown, setShown] = useState("") // the query the visible results belong to
  const [open, setOpen] = useState<string | null>(null) // the group whose versions are showing
  const [art, setArt] = useState<Record<string, string>>({})
  const cache = useRef(new Map<string, SongHit[]>())
  const seq = useRef(0)
  const list = songs.filter(Boolean)
  const full = list.length >= max

  useEffect(() => {
    const term = q.trim()
    if (term.length < 2) { setStatus("idle"); setHits([]); setShown(""); return }
    const hit = cache.current.get(term.toLowerCase())
    if (hit) { setHits(hit); setShown(term); setStatus(hit.length ? "results" : "empty"); return }
    const n = ++seq.current
    const ctrl = new AbortController()
    const timer = setTimeout(() => {
      setStatus("loading") // last results stay on screen while this loads
      searchSongs(term, token, ctrl.signal).then((r) => {
        if (n !== seq.current) return // a newer search has started
        if (r === null) { setStatus("error"); return }
        cache.current.set(term.toLowerCase(), r)
        setHits(r); setShown(term); setOpen(null); setStatus(r.length ? "results" : "empty")
      })
    }, 250)
    return () => { clearTimeout(timer); ctrl.abort() }
  }, [q, token])

  // Ranked groups, at most six rows before any versions are opened
  const groups = shown ? rankSongs(shown, hits).slice(0, 6) : []
  const byKey = new Map<string, SongHit>()
  const options = groups.flatMap((g) => {
    byKey.set(g.key, g.main)
    const row = { key: g.key, label: splitVersion(g.main.title).base, sub: [splitVersion(g.main.title).tag, g.main.artist].filter(Boolean).join(", "), img: g.main.artwork ?? null }
    if (g.versions.length < 2) return [row]
    const more = { key: `more:${g.key}`, label: open === g.key ? t.hideVersions : t.versions(g.versions.length), sub: undefined, img: undefined, kind: "more" as const }
    const kids = open === g.key ? g.versions.filter((v) => v !== g.main).map((v, i) => {
      byKey.set(`${g.key}#${i}`, v)
      return { key: `${g.key}#${i}`, label: splitVersion(v.title).tag || v.title, sub: v.artist, img: v.artwork ?? null, kind: "version" as const }
    }) : []
    return [row, more, ...kids]
  })

  function add(label: string, hit?: SongHit) {
    const v = label.trim().slice(0, maxLength)
    if (!v || full || list.includes(v)) return
    if (hit?.artwork) setArt((a) => ({ ...a, [v]: hit.artwork! }))
    onChange([...list, v])
    setQ(""); setHits([]); setStatus("idle")
  }

  return (
    <div className="song-picker flex flex-col gap-3">
      {full ? (
        <p className="text-success">{t.full(list.length)}</p>
      ) : (
        <>
          <Combobox label={t.label} help={t.hint} placeholder={t.placeholder} query={q} onQuery={setQ} maxLength={maxLength}
            options={options}
            onPick={(o) => {
              if (o.key.startsWith("more:")) { const k = o.key.slice(5); setOpen((v) => (v === k ? null : k)); return }
              const h = byKey.get(o.key); if (h) add(`${h.title}, ${h.artist}`, h)
            }}
            status={status} emptyText={t.noMatch(q.trim())} errorText={t.error}
            action={
              <button type="button" onClick={() => q.trim() && add(q)} aria-label={t.addTyped}
                className="btn-primary absolute top-1/2 right-1.5 grid size-10 -translate-y-1/2 place-items-center rounded-sm">
                {q.trim() ? <ArrowRight className="size-5" aria-hidden /> : <Search className="size-5" aria-hidden />}
              </button>
            } />
          {/* Always there (v3 R): with nothing typed yet it takes you to the field */}
          <button type="button" onClick={() => (q.trim() ? add(q) : document.querySelector<HTMLInputElement>(".song-picker input")?.focus())} className="btn-text min-h-11 self-start">{t.justType}</button>
        </>
      )}
      {list.length > 0 && (
        <ul aria-label={t.added} className="flex flex-col gap-2">
          {list.map((s) => (
            <li key={s} className="flex min-h-14 items-center gap-3 rounded-md border bg-card py-1 pr-1 pl-2">
              {art[s] ? <img src={art[s]} alt="" className="size-10 rounded-sm object-cover" /> : <span aria-hidden className="grid size-10 place-items-center rounded-sm bg-muted text-muted-foreground"><Music2 className="size-5" /></span>}
              <span className="min-w-0 flex-1 break-words font-label text-(length:--type-ui-size) text-foreground">{s}</span>
              <button type="button" onClick={() => onChange(list.filter((x) => x !== s))} aria-label={t.remove(s)}
                className="press grid size-11 shrink-0 place-items-center rounded-sm text-muted-foreground outline-2 outline-offset-2 outline-transparent hover:text-foreground focus-visible:outline-ring">
                <X className="size-5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
