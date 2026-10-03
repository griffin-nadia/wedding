import { useEffect, useRef, useState } from "react"
import { ArrowRight, Music2, Search, X } from "lucide-react"
import { searchSongs, type SongHit } from "@/lib/api"
import { Combobox, type ComboStatus } from "@/components/combobox"

type Labels = {
  label: string; hint: string; placeholder: string; addTyped: string; justType: string; searching: string; noMatch: (q: string) => string; error: string
  remove: (s: string) => string; full: (n: number) => string; added: string
}

/**
 * Song search on the shared combobox. Results come back as the guest types (stale answers ignored,
 * cached per visit); "just type it" is always there. Picked songs sit under the field as cards (max 3).
 */
export function SongPicker({ songs, onChange, token, max = 3, maxLength = 200, t }: {
  songs: string[]; onChange: (s: string[]) => void; token: string; max?: number; maxLength?: number; t: Labels
}) {
  const [q, setQ] = useState("")
  const [hits, setHits] = useState<SongHit[]>([])
  const [status, setStatus] = useState<ComboStatus>("idle")
  const [art, setArt] = useState<Record<string, string>>({})
  const cache = useRef(new Map<string, SongHit[]>())
  const seq = useRef(0)
  const list = songs.filter(Boolean)
  const full = list.length >= max

  useEffect(() => {
    const term = q.trim()
    if (term.length < 2) { setStatus("idle"); setHits([]); return }
    const hit = cache.current.get(term.toLowerCase())
    if (hit) { setHits(hit); setStatus(hit.length ? "results" : "empty"); return }
    const n = ++seq.current
    const ctrl = new AbortController()
    const timer = setTimeout(() => {
      setStatus("loading") // last results stay on screen while this loads
      searchSongs(term, token, ctrl.signal).then((r) => {
        if (n !== seq.current) return // a newer search has started
        if (r === null) { setStatus("error"); return }
        cache.current.set(term.toLowerCase(), r)
        setHits(r); setStatus(r.length ? "results" : "empty")
      })
    }, 250)
    return () => { clearTimeout(timer); ctrl.abort() }
  }, [q, token])

  function add(label: string, hit?: SongHit) {
    const v = label.trim().slice(0, maxLength)
    if (!v || full || list.includes(v)) return
    if (hit?.artwork) setArt((a) => ({ ...a, [v]: hit.artwork! }))
    onChange([...list, v])
    setQ(""); setHits([]); setStatus("idle")
  }

  return (
    <div className="flex flex-col gap-3">
      {full ? (
        <p className="text-success">{t.full(list.length)}</p>
      ) : (
        <>
          <Combobox label={t.label} help={t.hint} placeholder={t.placeholder} query={q} onQuery={setQ} maxLength={maxLength}
            options={hits.map((h, i) => ({ key: `${i}`, label: h.title, sub: h.artist, img: h.artwork ?? null }))}
            onPick={(o) => { const h = hits[Number(o.key)]; add(`${h.title}, ${h.artist}`, h) }}
            status={status} emptyText={t.noMatch(q.trim())} errorText={t.error}
            action={
              <button type="button" onClick={() => q.trim() && add(q)} aria-label={t.addTyped}
                className="btn-primary absolute top-1/2 right-1.5 grid size-10 -translate-y-1/2 place-items-center rounded-sm">
                {q.trim() ? <ArrowRight className="size-5" aria-hidden /> : <Search className="size-5" aria-hidden />}
              </button>
            } />
          {q.trim().length > 1 && <button type="button" onClick={() => add(q)} className="btn-text min-h-11 self-start">{t.justType}</button>}
        </>
      )}
      {list.length > 0 && (
        <ul aria-label={t.added} className="flex flex-col gap-2">
          {list.map((s) => (
            <li key={s} className="flex min-h-14 items-center gap-3 rounded-md border bg-card py-1 pr-1 pl-2">
              {art[s] ? <img src={art[s]} alt="" className="size-10 rounded-sm object-cover" /> : <span aria-hidden className="grid size-10 place-items-center rounded-sm bg-muted text-muted-foreground"><Music2 className="size-4" /></span>}
              <span className="min-w-0 flex-1 truncate font-label text-(length:--type-ui-size) text-foreground">{s}</span>
              <button type="button" onClick={() => onChange(list.filter((x) => x !== s))} aria-label={t.remove(s)}
                className="press grid size-11 shrink-0 place-items-center rounded-sm text-muted-foreground outline-2 outline-offset-2 outline-transparent hover:text-foreground focus-visible:outline-ring">
                <X className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
