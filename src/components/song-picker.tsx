import { useEffect, useRef, useState } from "react"
import { Music2, X } from "lucide-react"
import { searchSongs, type SongHit } from "@/lib/api"
import { rankSongs, splitVersion } from "@/lib/song-rank"
import { Combobox, type Option } from "@/components/combobox"
import { useLang } from "@/lib/lang"

type Status = "idle" | "loading" | "results" | "empty" | "error"
/** A saved "Title, Artist" back into its parts (artists have commas too): the first comma splits it */
const TYPED = "\u0000typed" // the "Use what I typed" row
const parts = (s: string) => { const i = s.indexOf(", "); return i > 0 ? [s.slice(0, i), s.slice(i + 2)] : [s, ""] }

// Artwork for chosen songs, kept on this device (the reply only stores "Title, Artist"), so it's still there after
// a reload. A song from another device is looked up once, quietly.
const ART_KEY = "ng-song-art"
const readArt = (): Record<string, string> => { try { return JSON.parse(localStorage.getItem(ART_KEY) ?? "{}") } catch { return {} } }
const keepArt = (song: string, url: string) => { try { localStorage.setItem(ART_KEY, JSON.stringify({ ...readArt(), [song]: url })) } catch { /* private mode: this visit only */ } }

/**
 * Song search (run 26 review: the same combobox as flying from, so both fields work the same way). It searches as you
 * type (300 ms after the last key, from two letters), and the results are a listbox under the field, in the page so
 * the sheet grows to show them: artwork, title and artist, with "Use what I typed" always last. Arrow keys move,
 * Enter picks the highlighted row (or, with none, the top match for what's typed), Escape closes the list. Picking one
 * empties the field and adds the song as a row (artwork, title, artist, remove) under it, ready for the next. Up to
 * two. While a new search loads the old rows stay, so nothing jumps.
 */
export function SongPicker({ songs, onChange, token, max = 2, maxLength = 200 }: { songs: string[]; onChange: (s: string[]) => void; token: string; max?: number; maxLength?: number }) {
  const { t } = useLang()
  const [q, setQ] = useState("")
  const [hits, setHits] = useState<SongHit[]>([])
  const [hitsFor, setHitsFor] = useState("") // what was typed for those hits
  const [status, setStatus] = useState<Status>("idle")
  const [art, setArt] = useState(readArt)
  const cache = useRef(new Map<string, SongHit[]>())
  const seq = useRef(0)
  const list = songs.filter(Boolean)
  const full = list.length >= max

  async function search(term: string) {
    term = term.trim()
    if (term.length < 2) { setStatus("idle"); return }
    const n = ++seq.current, key = term.toLowerCase()
    let r = cache.current.get(key) ?? null
    if (!r) {
      setStatus((s) => (s === "results" ? s : "loading"))
      r = await searchSongs(term, token)
      if (n !== seq.current) return // a newer search has started
      if (r === null) { setStatus("error"); setHits([]); return }
      cache.current.set(key, r)
    }
    setHits(r); setHitsFor(key); setStatus(r.length ? "results" : "empty")
  }
  // As you type
  useEffect(() => {
    if (q.trim().length < 2) { seq.current++; setStatus("idle"); return }
    const timer = setTimeout(() => void search(q), 300)
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
    seq.current++; setQ(""); setHits([]); setHitsFor(""); setStatus("idle")
  }
  const remove = (s: string) => onChange(list.filter((x) => x !== s))

  const typed = q.trim()
  const searching = typed.length >= 2
  const groups = searching && status === "results" ? rankSongs(typed, hits).slice(0, 6) : []
  const options: Option[] = groups.map((g) => {
    const { base, tag } = splitVersion(g.main.title)
    return { key: `${g.main.title}, ${g.main.artist}`.slice(0, maxLength), label: base, sub: [tag, g.main.artist].filter(Boolean).join(", "), img: g.main.artwork ?? null }
  })
  if (searching && status !== "loading" && !list.includes(typed)) options.push({ key: TYPED, label: t.rsvp.useTyped, sub: typed, kind: "more" })
  const pick = (o: Option) => {
    if (o.key === TYPED) return add(typed)
    add(o.key, groups.find((g) => `${g.main.title}, ${g.main.artist}`.slice(0, maxLength) === o.key)?.main)
  }
  // Same as flying from: Enter with no row highlighted picks the top match, but only from the answer to what's typed
  const fresh = hitsFor === typed.toLowerCase()
  return (
    <div className="song-picker flex flex-col gap-3">
      {full ? <p className="text-success">{t.rsvp.songsFull(list.length)}</p> : (
        <Combobox id="song-search" label={t.rsvp.songPlaceholder} help={t.rsvp.songHint} query={q} onQuery={setQ}
          options={searching ? options : []} onPick={pick} status={searching ? status : "idle"}
          emptyText={t.rsvp.noMatch(typed)} errorText={t.rsvp.searchError} enterKeyHint="search" maxLength={maxLength}
          onSubmit={() => { if (fresh && options[0]) pick(options[0]); else void search(q) }} />
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
