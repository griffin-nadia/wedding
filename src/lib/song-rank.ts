import type { SongHit } from "@/lib/api"

// Words that mark another version of the same song (v3 Q3)
const VERSION = /\b(remix|mix|live|cinematic|acoustic|remaster(ed)?|version|edit|radio|extended|instrumental|demo|mono|stereo|karaoke|orchestral|piano|sped up|slowed|reprise|unplugged|session|re-?recorded)\b/i
const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim()

/** "September (Live at the Forum) - 2019 Remaster" → { base: "September", tag: "Live at the Forum, 2019 Remaster" } */
export function splitVersion(title: string) {
  const tags: string[] = []
  let base = title.replace(/\s*[([]([^)\]]*)[)\]]/g, (m, inner: string) => (VERSION.test(inner) ? (tags.push(inner.trim()), "") : m))
  base = base.replace(/\s+-\s+(.*)$/, (m, rest: string) => (VERSION.test(rest) ? (tags.push(rest.trim()), "") : m))
  return { base: base.trim() || title, tag: tags.join(", ") }
}

export type SongGroup = { key: string; main: SongHit; versions: SongHit[] }

/**
 * Ranks and groups iTunes hits for the query: title starting with it first, then title containing it,
 * then artist, keeping iTunes' order within each band. Versions of one song by one artist (remix, live,
 * cinematic…) fold into one group; the plain version leads it when there is one. The same recording
 * listed again (compilations) is dropped.
 */
export function rankSongs(q: string, hits: SongHit[]): SongGroup[] {
  const nq = norm(q)
  const band = (h: SongHit) => {
    const t = norm(splitVersion(h.title).base), a = norm(h.artist)
    return t.startsWith(nq) ? 0 : t.includes(nq) ? 1 : a.startsWith(nq) || a.includes(nq) ? 2 : 3
  }
  const ranked = hits.map((h, i) => ({ h, i, b: band(h) })).sort((x, y) => x.b - y.b || x.i - y.i).map((x) => x.h)
  const groups = new Map<string, SongGroup>()
  for (const h of ranked) {
    const { base, tag } = splitVersion(h.title)
    const key = `${norm(base)}|${norm(h.artist.split(/,|&| feat\.? | ft\.? /i)[0])}`
    const g = groups.get(key)
    if (!g) groups.set(key, { key, main: h, versions: [h] })
    else if (g.versions.some((v) => norm(v.title) === norm(h.title) && norm(v.artist) === norm(h.artist))) continue // the same recording on another album
    else {
      g.versions.push(h)
      if (!tag && splitVersion(g.main.title).tag) g.main = h // the plain version leads
    }
  }
  return [...groups.values()]
}
