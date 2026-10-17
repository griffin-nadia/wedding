import { useRef, useState } from "react"
import { Check, Music2, PenLine, Search, X } from "lucide-react"
import { searchSongs, type SongHit } from "@/lib/api"
import { rankSongs, splitVersion } from "@/lib/song-rank"
import { nextFrame } from "@/lib/frame"
import { useLang } from "@/lib/lang"
import { describedBy } from "@/components/ui/field"
import { cn } from "@/lib/utils"

type Status = "idle" | "loading" | "results" | "empty" | "error"
const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
/** A saved "Title, Artist" back into its parts, for a song from an earlier visit (artists have commas too, so the
 * ones picked this visit keep theirs): the first comma splits it */
const parts = (s: string) => { const i = s.indexOf(", "); return i > 0 ? [s.slice(0, i), s.slice(i + 2)] : [s, ""] }

/**
 * Song search, mobile first. Focusing the field scrolls it to the top of the sheet, so there's room under it. It
 * searches only on the keyboard's Search key or the search button (never on every keystroke), straight from the
 * browser to iTunes (the script only if that fails), then puts the keyboard away so the results show in full: clear
 * rows of artwork, title and artist, the chosen ones ticked. "Use what I typed" is always the last row. Chosen songs
 * (up to three) sit under the field as small cards with Change (back into the search) and remove.
 */
export function SongPicker({ songs, onChange, token, max = 3, maxLength = 200 }: { songs: string[]; onChange: (s: string[]) => void; token: string; max?: number; maxLength?: number }) {
  const { t } = useLang()
  const [q, setQ] = useState("")
  const [hits, setHits] = useState<SongHit[]>([])
  const [status, setStatus] = useState<Status>("idle")
  const [picked, setPicked] = useState<Record<string, SongHit>>({}) // songs chosen from results this visit, by saved text
  const cache = useRef(new Map<string, SongHit[]>())
  const seq = useRef(0)
  const wrap = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const results = useRef<HTMLDivElement>(null)
  const list = songs.filter(Boolean)
  const full = list.length >= max
  const id = "song-search"

  // The field to the top of the sheet's scrolling body, now and again once the keyboard has finished rising
  const toTop = () => {
    const el = wrap.current, body = el?.closest<HTMLElement>(".sheet-body")
    if (!el || !body) return
    body.scrollBy({ top: el.getBoundingClientRect().top - body.getBoundingClientRect().top - 8, behavior: still() ? "instant" : "smooth" })
  }

  async function search() {
    const term = q.trim()
    if (term.length < 2) return input.current?.focus()
    input.current?.blur() // the keyboard goes, so the whole list is on screen
    const n = ++seq.current
    let r = cache.current.get(term.toLowerCase()) ?? null
    if (!r) {
      setStatus("loading")
      r = await searchSongs(term, token)
      if (n !== seq.current) return // a newer search has started
      if (r === null) { setStatus("error"); setHits([]); return }
      cache.current.set(term.toLowerCase(), r)
    }
    setHits(r); setStatus(r.length ? "results" : "empty")
    nextFrame(() => results.current?.focus({ preventScroll: true }))
  }

  function add(label: string, hit?: SongHit) {
    const v = label.trim().slice(0, maxLength)
    if (!v || full || list.includes(v)) return
    if (hit) setPicked((m) => ({ ...m, [v]: hit }))
    onChange([...list, v])
  }
  const remove = (s: string) => onChange(list.filter((x) => x !== s))
  // Change: the song goes back into the search field, ready to look again
  const titleOf = (s: string) => (picked[s] ? [picked[s].title, picked[s].artist] : parts(s))
  const change = (s: string) => { remove(s); setQ(titleOf(s)[0]); setStatus("idle"); setHits([]); nextFrame(() => input.current?.focus()) }

  const groups = status === "results" ? rankSongs(q.trim(), hits).slice(0, 6) : []
  const typed = q.trim()
  return (
    <div ref={wrap} className="song-picker flex flex-col gap-3">
      {full ? <p className="text-success">{t.rsvp.songsFull(list.length)}</p> : (
        <div className="form-field">
          <label htmlFor={id} className="form-label label-caps text-foreground">{t.rsvp.song}</label>
          {/* A search form of its own: Enter is the keyboard's Search key */}
          <form role="search" className="relative" onSubmit={(e) => { e.preventDefault(); void search() }}>
            <input ref={input} id={id} type="search" value={q} maxLength={maxLength} placeholder={t.rsvp.songPlaceholder} enterKeyHint="search" autoComplete="off" autoCorrect="off" spellCheck={false}
              aria-describedby={describedBy(id, t.rsvp.songHint)} aria-controls={`${id}-results`}
              onFocus={() => { toTop(); window.setTimeout(toTop, 350) }} onChange={(e) => setQ(e.target.value)}
              className="state field song-search-input pr-14" />
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
            const [title, artist] = titleOf(s), artwork = picked[s]?.artwork
            return (
              <li key={s} className="song-card">
                {artwork ? <img src={artwork} alt="" className="song-art" /> : <span aria-hidden className="song-art grid place-items-center"><Music2 className="size-5" /></span>}
                <span className="min-w-0 flex-1">
                  <span className="block break-words font-medium text-foreground">{title}</span>
                  {artist && <span className="block break-words text-small text-muted-foreground">{artist}</span>}
                </span>
                <button type="button" onClick={() => change(s)} className="btn-text min-h-11 px-1 text-small">{t.rsvp.changeSong}<span className="sr-only"> {s}</span></button>
                <button type="button" onClick={() => remove(s)} aria-label={t.rsvp.removeSong(s)}
                  className="press grid size-11 shrink-0 place-items-center rounded-sm text-muted-foreground outline-2 outline-offset-2 outline-transparent hover:text-foreground focus-visible:outline-ring">
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
