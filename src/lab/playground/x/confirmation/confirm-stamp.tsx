import { useState } from "react"
import { Hanko } from "@/components/hanko"
import { Button } from "@/components/ui/button"
import { Stage } from "../../stage"

/** The confirmation's seal three ways (final run): 寿 ships; 京 and G·N to compare, each with what it says. */
const SEALS = [
  { glyph: "寿" as const, name: "寿 kotobuki", meaning: "Celebration: the mark people put on wedding gifts and envelopes in Japan. What ships." },
  { glyph: "京" as const, name: "京 kyō", meaning: "Kyoto, where it all started, and where the wedding is. The seal before the final run." },
  { glyph: "GN" as const, name: "G·N", meaning: "Their initials, from Nadia's wax seal on the envelope." },
]
export default function ConfirmStamp() {
  const [n, setN] = useState(0)
  return (
    <Stage hint="Three seals, same hand-cut style. Stamp again to see each land.">
      <ul className="grid gap-6 sm:grid-cols-3">
        {SEALS.map((s) => (
          <li key={s.glyph} className="flex flex-col items-center gap-3 text-center">
            <Hanko key={`${s.glyph}${n}`} stamp glyph={s.glyph} />
            <p className="font-medium text-foreground">{s.name}</p>
            <p className="max-w-[24ch] text-small">{s.meaning}</p>
          </li>
        ))}
      </ul>
      <Button variant="secondary" size="sm" onClick={() => setN(n + 1)}>Stamp again</Button>
    </Stage>
  )
}
