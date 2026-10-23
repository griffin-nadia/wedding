/**
 * What the site keeps on a guest's device is versioned (run 19), so old saved data can never crash the site. On every
 * load, before anything else reads it (main.tsx imports this first): migrations from the stored version run, then each
 * value is checked against the shape this version reads, and one that doesn't fit (corrupt, or left by an older
 * version) is removed, so its reader starts fresh. A format change bumps VERSION and adds its step to MIGRATIONS.
 * Kept free of imports so tests run it under plain Node.
 */
export const VERSION = 1
export const VERSION_KEY = "ng-store"

type Obj = Record<string, unknown>
const obj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v)
const str = (v: unknown) => typeof v === "string"
const json = (ok: (v: unknown) => boolean) => (s: string) => { try { return ok(JSON.parse(s)) } catch { return false } }
const guests = (v: unknown) => Array.isArray(v) && v.every((g) => obj(g) && str(g.id) && str(g.firstName))

/** The shape each saved value must have, by key. Keys not listed are left alone. */
const RULES: [RegExp, (s: string) => boolean][] = [
  [/^ng-theme$/, (s) => s === "autumn" || s === "lantern"],
  [/^ng-lang$/, (s) => s === "en" || s === "ja"],
  [/^ng-household$/, json((h) => obj(h) && str(h.token) && str(h.displayName) && guests(h.guests) && Array.isArray(h.songs))],
  [/^ng-draft-/, json((d) => obj(d) && typeof d.at === "number" && obj(d.form) && guests(d.form.guests) && Array.isArray(d.form.songs))],
  // A city since the final run; a place's name before that (still read as that place)
  [/^ng-flying:/, (s) => !s.startsWith("{") || json((c) => obj(c) && str(c.id) && str(c.name))(s)],
  [/^ng-tune$/, json((t) => obj(t) && (t.overrides === undefined || (obj(t.overrides) && Object.values(t.overrides).every(obj))) && (t.notes === undefined || Array.isArray(t.notes)))],
  [/^ng-(song-art|fly-)/, json(obj)],
  // Run 26: a household's omikuji draws, append only: [{ draw, no }]
  [/^ng-draws-/, json((v) => Array.isArray(v) && v.every((d) => obj(d) && Number.isInteger(d.draw) && Number.isInteger(d.no)))],
  [/^ng-content$/, json((c) => obj(c) && Array.isArray(c.story) && c.story.every((ch) => obj(ch) && Array.isArray(ch.body)) && str(c.mode))],
]

/** Steps from one version to the next: MIGRATIONS[2] would turn version 1's data into version 2's. */
const MIGRATIONS: Record<number, (s: Storage) => void> = {}

export function checkStorage(where: { localStorage: Storage; sessionStorage: Storage }) {
  for (const name of ["localStorage", "sessionStorage"] as const) {
    try {
      const s = where[name]
      const was = Number(s.getItem(VERSION_KEY)) || 0
      for (let v = was + 1; v <= VERSION; v++) MIGRATIONS[v]?.(s)
      const keys = Array.from({ length: s.length }, (_, i) => s.key(i)).filter((k): k is string => Boolean(k?.startsWith("ng-")))
      for (const k of keys) {
        const ok = RULES.find(([re]) => re.test(k))?.[1]
        const v = s.getItem(k)
        if (ok && v !== null && !ok(v)) s.removeItem(k)
      }
      if (was !== VERSION) s.setItem(VERSION_KEY, String(VERSION))
    } catch { /* storage blocked (private mode): every reader already falls back */ }
  }
}

if (typeof window !== "undefined") checkStorage(window)
