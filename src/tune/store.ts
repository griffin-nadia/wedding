/**
 * Tuning overrides, kept in this browser only (localStorage) and written to a <style> tag.
 * Scopes: "all" (brand, component tokens, scales) and per mode ("autumn", "lantern") for system tokens.
 * Selectors are doubled so they beat tokens.css (including its 768px block and themed /kit panels).
 */
export type Scope = "all" | "autumn" | "lantern"
export type Note = { id: string; selector: string; text: string; viewport: { w: number; h: number }; path: string; theme: string; at: string }
export type TuneState = { overrides: Record<Scope, Record<string, string>>; notes: Note[]; options: Record<string, string> }

/** Each lab option's shipped value (the first choice). The labels and notes live in options.ts, loaded with the panel only. */
export const OPTION_DEFAULTS: Record<string, string> = {
  arrival: "envelope", peek: "on", story: "a", mapmode: "trail", flying: "off", storysample: "off", scene: "auto", gl: "on",
  stamps: "off", texture: "on", preset: "letter", density: "auto", round: "auto", nav: "bar", navigation: "pages",
}

const KEY = "ng-tune"
export const empty = (): TuneState => ({ overrides: { all: {}, autumn: {}, lantern: {} }, notes: [], options: {} })

export function load(): TuneState {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "null")
    return v && v.overrides ? { ...empty(), ...v, overrides: { ...empty().overrides, ...v.overrides }, options: v.options ?? {} } : empty()
  } catch {
    return empty()
  }
}
export function save(s: TuneState) {
  try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* private mode */ }
  apply(s)
  window.dispatchEvent(new Event("ng-tune"))
}

export function apply(s: TuneState) {
  for (const [key, first] of Object.entries(OPTION_DEFAULTS)) {
    const v = s.options[key]
    if (v && v !== first) document.documentElement.setAttribute(`data-opt-${key}`, v)
    else document.documentElement.removeAttribute(`data-opt-${key}`)
  }
  let el = document.getElementById("tune-overrides") as HTMLStyleElement | null
  const decl = (o: Record<string, string>) => Object.entries(o).map(([k, v]) => `${k}: ${v};`).join(" ")
  const css = [
    Object.keys(s.overrides.all).length ? `:root:root, [data-theme][data-theme] { ${decl(s.overrides.all)} }` : "",
    Object.keys(s.overrides.autumn).length ? `[data-theme="autumn"][data-theme] { ${decl(s.overrides.autumn)} }` : "",
    Object.keys(s.overrides.lantern).length ? `[data-theme="lantern"][data-theme] { ${decl(s.overrides.lantern)} }` : "",
  ].join("\n")
  if (!css.trim()) { el?.remove(); return }
  if (!el) {
    el = document.createElement("style")
    el.id = "tune-overrides"
    document.head.appendChild(el)
  }
  el.textContent = css
}

export function exportJson(s: TuneState) {
  return JSON.stringify({ version: 1, exported: new Date().toISOString(), overrides: s.overrides, options: s.options, notes: s.notes }, null, 2)
}
