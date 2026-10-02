import { en, type Content } from "./en"
import { ja } from "./ja"

export type Lang = "en" | "ja"

export function getContent(lang: Lang): Content {
  return lang === "ja" ? { ...en, ...ja } : en
}
