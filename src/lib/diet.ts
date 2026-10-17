/**
 * Dietary needs, saved as words: "Vegetarian, Nut allergy, Other: kiwi" (or in Japanese, 「ベジタリアン, その他: キウイ」).
 * The last option is always Other; what they type under it is kept after a colon. Older answers ("Allergy: Peanuts /
 * Sesame") map onto the options, and anything unknown becomes Other with its words kept. The back end keeps 200
 * characters, so the Other words stop at OTHER_MAX.
 */
export type Diet = { picked: string[]; other: string }
export const OTHER_MAX = 80
const OTHER_WORDS = /^(other|その他)\s*[:：]?\s*/i

export function parseDiet(v: string, options: readonly string[]): Diet {
  const otherLabel = options[options.length - 1]
  const picked: string[] = [], other: string[] = []
  const add = (x: string) => { if (!picked.includes(x)) picked.push(x) }
  for (const part of (v || "").split(",").map((x) => x.trim()).filter((x) => x && x !== "None")) {
    const known = options.find((o) => o.toLowerCase() === part.toLowerCase())
    if (known) add(known)
    else if (OTHER_WORDS.test(part)) { add(otherLabel); other.push(part.replace(OTHER_WORDS, "")) }
    else if (/^allergy/i.test(part)) {
      for (const item of part.slice(part.indexOf(":") + 1).split("/").map((x) => x.trim()).filter(Boolean)) {
        const match = /nut|peanut/i.test(item) ? 6 : /shellfish/i.test(item) ? 7 : /egg/i.test(item) ? 8 : -1
        if (match >= 0 && options[match]) add(options[match])
        else { add(otherLabel); other.push(item) }
      }
    } else { add(otherLabel); other.push(part) }
  }
  return { picked, other: other.filter(Boolean).join(" ").slice(0, OTHER_MAX) }
}

export function dietString(d: Diet, options: readonly string[]) {
  const otherLabel = options[options.length - 1]
  const words = d.other.replace(/[,，、]/g, " ").replace(/\s+/g, " ").trim().slice(0, OTHER_MAX)
  const out = d.picked.map((x) => (x === otherLabel && words ? `${otherLabel}: ${words}` : x))
  return out.length ? out.join(", ") : "None"
}
