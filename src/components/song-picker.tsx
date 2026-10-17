import { useEffect, useRef, useState } from "react"
import { Check, Music2, PenLine, Search, X } from "lucide-react"
import { searchSongs, type SongHit } from "@/lib/api"
import { rankSongs, splitVersion } from "@/lib/song-rank"
import { nextFrame } from "@/lib/frame"
import { useLang } from "@/lib/lang"
import { describedBy } from "@/components/ui/field"
import { cn } from "@/lib/utils"

type Status = "idle" | "loading" | "results" | "empty" | "error"
/** A saved "Title, Artist" back into its parts (artists have commas too): the first comma splits it */
const parts = (s: string) => { const i = s.indexOf(", "); return i > 0 ? [s.slice(0, i), s.slice(i + 2)] : [s, ""] }

// Artwork for chosen songs, kept on this device (the reply only stores "Title, Artist"), so it's still there after
// a reload. A song from another device is looked up once, quietly.
const ART_KEY = "ng-song-art"
const readArt = (): Record<string, string> => { try { return JSON.parse(localStorage.getItem(ART_KEY) ?? "{}") } catch { return {} } }
const keepArt = (song: string, url: string) => { try { localStorage.setItem(ART_KEY, JSON.stringify({ ...readArt(), [song]: url })) } catch { /* private mode: this visit only */ } }

/**
 * Song search, mobile first (18f). It searches as you type (300 ms after the last key, from two letters) and on the
 * keyboard's Search key or the search button, which also puts the keyboard away so the list shows in full: rows of
 * artwork, title and artist, with "Use what I typed" always last. Picking one closes the list, empties the field and
 * adds the song as a row (artwork, title, artist, remove) under it, ready for the next. Up to two. While a new search
 * loads the old rows stay, so nothing jumps.
 */
export function SongPicker({ songs, onChange, token, max = 2, maxLength = 200 }: { songs: string[]; onChange: (s: string[]) => void; token: string; max?: number; maxLength?: number }) {
  const { t } = useLang()
  const [q, setQ] = useState("")
  const [hits, setHits] = useState<SongHit[]>([])
  const [status, setStatus] = useState<Status>("idle")
  const [art, setArt] = useState(readArt)
  const cache = useRef(new Map<string, SongHit[]>())
  const seq = useRef(0)
  const input = useRef<HTMLInputElement>(null)
  const results = useRef<HTMLDivElement>(null)
  const list = songs.filter(Boolean)
  const full = list.length >= max
  const id = "song-search"

  async function search(term: string, fromKey: boolean) {
    term = term.trim()
    if (term.length < 2) { if (fromKey) input.current?.focus(); else setStatus("idle"); return }
    if (fromKey) input.current?.blur() // the keyboard goes, so the whole list is on screen
    const n = ++seq.current
    let r = cache.current.get(term.toLowerCase()) ?? null
    if (!r) {
      setStatus((s) => (s === "results" ? s : "loading"))
      r = await searchSongs(term, token)
      if (n !== seq.current) return // a newer search has started
      if (r === null) { setStatus("error"); setHits([]); return }
      cache.current.set(term.toLowerCase(), r)
    }
    setHits(r); setStatus(r.length ? "results" : "empty")
    if (fromKey) nextFrame(() => results.current?.focus({ preventScroll: true }))
  }
  // As you type
  useEffect(() => {
    if (q.trim().length < 2) { seq.current++; setStatus("idle"); return }
    const timer = setTimeout(() => void search(q, false), 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])
  // Saved songs from another device: their artwork, looked up once
  useEffect(() => {
    for (const s of list) if (!(s in art)) {
      const [title, artist] = parts(s)
      void searchSongs(`${title} ${artist}`, token).then((r) => {
        const hit = r?.find((h) => h.title.toLowerCase() === title.toLowerCase()) ?? r?.[0]
        const url = hit?.artwork ?? ""
        keepArt(s, url); setArt((a) => ({ ...a, [s]: url }))
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songs.join("|")])

  function add(label: string, hit?: SongHit) {
    const v = label.trim().slice(0, maxLength)
    if (!v || full || list.includes(v)) return
    const url = hit?.artwork ?? ""
    keepArt(v, url); setArt((a) => ({ ...a, [v]: url }))
    onChange([...list, v])
    // The list closes and the field empties, ready for the next one
    seq.current++; setQ(""); setHits([]); setStatus("idle")
  }
  const remove = (s: string) => onChange(list.filter((x) => x !== s))

  const groups = status === "results" ? rankSongs(q.trim(), hits).slice(0, 6) : []
  const typed = q.trim()
  return (
    <div className="song-picker flex flex-col gap-3">
      {full ? <p className="text-success">{t.rsvp.songsFull(list.length)}</p> : (
        <div className="form-field">
          <label htmlFor={id} className="form-label label-caps text-foreground">{t.rsvp.songPlaceholder}</label>
          {/* A search form of its own: Enter is the keyboard's Search key */}
          <form role="search" className="relative" onSubmit={(e) => { e.preventDefault(); void search(q, true) }}>
            <input ref={input} id={id} type="search" value={q} maxLength={maxLength} enterKeyHint="search" autoComplete="off" autoCorrect="off" spellCheck={false}
              aria-describedby={describedBy(id, t.rsvp.songHint)} aria-controls={status !== "idle" ? `${id}-results` : undefined} /* only once the results are there to point at */
              onChange={(e) => setQ(e.target.value)} className="state field song-search-input pr-14" />
            <button type="submit" aria-label={t.rsvp.searchSong} className="btn-primary absolute top-1/2 right-1.5 grid size-10 -translate-y-1/2 place-items-center rounded-sm">
              <Search className="size-5" aria-hidden />
            </button>
          </form>
          <p id={`${id}-help`} className="form-help text-muted-foreground">{t.rsvp.songHint}</p>
        </div>
      )}

      {!full && status !== "idle" && (
        <div ref={results} id={`${id}-results`} tabIndex={-1} className="song-results outline-none" aria-busy={status === "loading"}>
          <p role="status" className={cn("text-small text-muted-foreground", status === "results" && "sr-only")}>
            {status === "loading" ? t.rsvp.searching : status === "results" ? t.rsvp.songResults(groups.length) : status === "empty" ? t.rsvp.noMatch(typed) : t.rsvp.searchError}
          </p>
          <ul className="flex flex-col gap-1">
            {groups.map((g) => {
              const v = `${g.main.title}, ${g.main.artist}`.slice(0, maxLength), on = list.includes(v)
              const { base, tag } = splitVersion(g.main.title)
              return (
                <li key={g.key}>
                  <button type="button" aria-pressed={on} onClick={() => (on ? remove(v) : add(v, g.main))} className="song-row">
                    {g.main.artwork ? <img src={g.main.artwork} alt="" className="song-art" /> : <span aria-hidden className="song-art grid place-items-center"><Music2 className="size-5" /></span>}
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block break-words font-medium text-foreground">{base}</span>
                      <span className="block break-words text-small text-muted-foreground">{[tag, g.main.artist].filter(Boolean).join(", ")}</span>
                    </span>
                    <Check aria-hidden className={cn("song-row-tick size-5 shrink-0", !on && "invisible")} />
                  </button>
                </li>
              )
            })}
            {typed && status !== "loading" && !list.includes(typed) && (
              <li>
                <button type="button" onClick={() => add(typed)} className="song-row">
                  <span aria-hidden className="song-art grid place-items-center"><PenLine className="size-5" /></span>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="block font-medium text-foreground">{t.rsvp.useTyped}</span>
                    <span className="block break-words text-small text-muted-foreground">{typed}</span>
                  </span>
                </button>
              </li>
            )}
          </ul>
        </div>
      )}

      {list.length > 0 && (
        <ul aria-label={t.rsvp.songsAdded} className="flex flex-col gap-2">
          {list.map((s) => {
            const [title, artist] = parts(s), artwork = art[s]
            return (
              <li key={s} className="song-card">
                {/* While the artwork is still being looked up, the square waits empty (no note icon unless there's none) */}
                {artwork ? <img src={artwork} alt="" className="song-art" /> : <span aria-hidden className="song-art grid place-items-center">{artwork === "" && <Music2 className="size-5" />}</span>}
                <span className="min-w-0 flex-1">
                  <span className="block break-words font-medium text-foreground">{title}</span>
                  {artist && <span className="block break-words text-small text-muted-foreground">{artist}</span>}
                </span>
                <button type="button" onClick={() => remove(s)} aria-label={t.rsvp.removeSong(s)} className="remove-btn press">
                  <X className="size-5" aria-hidden />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
