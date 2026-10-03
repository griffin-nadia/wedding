/**
 * Tuning overrides, kept in this browser only (localStorage) and written to a <style> tag.
 * Scopes: "all" (brand, component tokens, scales) and per mode ("autumn", "lantern") for system tokens.
 * Selectors are doubled so they beat tokens.css (including its 768px block and themed /kit panels).
 */
export type Scope = "all" | "autumn" | "lantern"
export type Note = { id: string; selector: string; text: string; viewport: { w: number; h: number }; path: string; theme: string; at: string }
export type TuneState = { overrides: Record<Scope, Record<string, string>>; notes: Note[]; options: Record<string, string> }

/** Prototype switches to try with Nadia and Griffin. The first value is what ships. */
export const OPTIONS: { key: string; label: string; values: [string, string][] }[] = [
  { key: "preset", label: "Theme", values: [["letter", "Letter"], ["storybook", "Storybook"], ["crisp", "Crisp"]] },
  { key: "density", label: "Density", values: [["auto", "Theme"], ["compact", "Compact"], ["comfortable", "Comfortable"], ["roomy", "Roomy"]] },
  { key: "round", label: "Roundness", values: [["auto", "Theme"], ["sharp", "Sharp"], ["soft", "Soft"], ["round", "Round"]] },
  { key: "scene", label: "Scene", values: [["auto", "Paper"], ["photo", "Photo"], ["plate", "Painted"], ["walk", "Walk (December)"]] },
  { key: "gl", label: "Paper shader", values: [["on", "On"], ["off", "CSS only"]] },
  { key: "texture", label: "Paper texture on the letter", values: [["on", "On"], ["off", "Off"]] },
  { key: "nav", label: "Nav from 768", values: [["bar", "Top bar"], ["dock", "Dock at the bottom"]] },
  { key: "peek", label: "Envelope peek on hover", values: [["on", "On"], ["off", "Off"]] },
  { key: "arrival", label: "Arrival", values: [["envelope", "Envelope"], ["noren", "Noren curtain"]] },
  { key: "daytabs", label: "The day", values: [["off", "No tabs"], ["on", "Tabs"]] },
  { key: "story", label: "Our story", values: [["map", "Map"], ["list", "List"]] },
]

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
  for (const o of OPTIONS) {
    const v = s.options[o.key]
    if (v && v !== o.values[0][0]) document.documentElement.setAttribute(`data-opt-${o.key}`, v)
    else document.documentElement.removeAttribute(`data-opt-${o.key}`)
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
