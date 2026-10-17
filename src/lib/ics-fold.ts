/** iCalendar lines are at most 75 octets: longer ones carry on after a line break and a space (RFC 5545, 3.1) */
export function fold(line: string) {
  const bytes = new TextEncoder().encode(line)
  if (bytes.length <= 75) return line
  const out: string[] = []
  let cur = "", n = 0
  for (const ch of line) {
    const len = new TextEncoder().encode(ch).length
    if (n + len > (out.length ? 74 : 75)) { out.push(cur); cur = ""; n = 0 }
    cur += ch; n += len
  }
  return [...out, cur].join("\r\n ")
}
