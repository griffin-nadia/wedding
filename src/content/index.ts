import { en, type Content } from "./en"

export type Lang = "en" | "ja"

/** Key by key, so a section that's only partly translated keeps English for the rest. */
function merge<T>(base: T, over: unknown): T {
  if (!over || typeof over !== "object" || Array.isArray(base) !== Array.isArray(over)) return (over ?? base) as T
  if (Array.isArray(base)) return base.map((b, i) => merge(b, (over as unknown[])[i])) as T
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) }
  for (const [k, v] of Object.entries(over as Record<string, unknown>)) out[k] = typeof v === "function" || typeof v !== "object" || v === null ? v : merge(out[k], v)
  return out as T
}

// The Japanese draft loads only when someone switches to it, so English pages carry none of it
let jaMerged: Content | null = null
export async function loadJapanese() { if (!jaMerged) { const { ja } = await import("./ja"); jaMerged = merge(en, ja) } }
export function getContent(lang: Lang): Content {
  return lang === "ja" && jaMerged ? jaMerged : en
}
