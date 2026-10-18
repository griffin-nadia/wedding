/**
 * "Is this it?" (final run, Ask us): up to three FAQs that look like what the guest is typing, found on this device
 * from the site's own FAQ text, in English or Japanese. Words count by how well they match a question or its answer:
 * the same word, a word starting with it, or a near miss (one letter off in a longer word). Japanese has no spaces,
 * so it's matched by shared pairs of characters instead. Words like "the" and "can" don't count.
 */
const STOP = new Set("a an and are as at be by can could do does for from get go going have how i if in is it its me my of on or our should so that the there this to us we what when where which who will with would you your".split(" "))
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
const words = (s: string) => norm(s).split(/[^\p{L}\p{N}]+/u).filter((w) => w.length >= 3 && !STOP.has(w))
const CJK = /[぀-ヿ㐀-鿿]/
const pairs = (s: string) => { const t = s.replace(/[^぀-ヿ㐀-鿿\p{L}\p{N}]/gu, ""), out = new Set<string>(); for (let i = 0; i < t.length - 1; i++) out.add(t.slice(i, i + 2)); return out }

function near(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 1) return false
  let i = 0, j = 0, d = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue }
    if (++d > 1) return false
    if (a.length > b.length) i++; else if (b.length > a.length) j++; else { i++; j++ }
  }
  return d + (a.length - i) + (b.length - j) <= 1
}

export function matchFaqs(items: { q: string; a: string }[], typed: string, limit = 3): number[] {
  const text = typed.trim()
  if (text.length < 3) return []
  const scored = items.map((item, i) => {
    let s = 0
    if (CJK.test(text)) {
      const want = pairs(text), have = pairs(item.q + item.a)
      for (const p of want) if (have.has(p)) s += 1
      s = want.size ? (s / want.size) * 3 : 0
    } else {
      const inQ = words(item.q), inA = words(item.a)
      for (const w of words(text)) {
        const score = (ws: string[], weight: number) => Math.max(0, ...ws.map((x) => (x === w ? 2 : x.startsWith(w) || w.startsWith(x) && x.length >= 4 ? 1.5 : w.length >= 5 && near(w, x) ? 1 : 0) * weight))
        s += Math.max(score(inQ, 1.5), score(inA, 1))
      }
    }
    return { i, s }
  })
  return scored.filter((x) => x.s >= 1.5).sort((a, b) => b.s - a.s).slice(0, limit).map((x) => x.i)
}
