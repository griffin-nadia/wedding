import { useState } from "react"
import { Hanko } from "@/components/hanko"
import { Button } from "@/components/ui/button"
import { Stage } from "../../stage"
import { useTake } from "../../params"

/** The confirmation's seal three ways (final run): 寿 ships; 京 and G·N to compare, each with what it says. */
const SEALS = [
  { take: "kotobuki", glyph: "寿" as const, name: "寿 kotobuki", meaning: "Celebration: the mark people put on wedding gifts and envelopes in Japan. What ships." },
  { take: "kyo", glyph: "京" as const, name: "京 kyō", meaning: "Kyoto, where it all started, and where the wedding is. The seal before the final run." },
  { take: "gn", glyph: "GN" as const, name: "G·N", meaning: "Their initials, from Nadia's wax seal on the envelope." },
]
/** The take (Options, or ?take=) lands at the confirmation's size; the other two sit small beside it to compare */
export default function ConfirmStamp() {
  const take = useTake("kotobuki")
  const [n, setN] = useState(0)
  const s = SEALS.find((x) => x.take === take) ?? SEALS[0]
  return (
    <Stage hint="The seal as it lands after a reply. Options switches the mark.">
      <div className="flex flex-col items-center gap-3 text-center">
        <Hanko key={`${s.glyph}${n}`} stamp glyph={s.glyph} />
        <p className="font-medium text-foreground">{s.name}</p>
        <p className="max-w-[30ch] text-small">{s.meaning}</p>
      </div>
      <Button variant="secondary" size="sm" onClick={() => setN(n + 1)}>Stamp again</Button>
      <ul className="flex gap-6" aria-label="The other marks">
        {SEALS.filter((x) => x !== s).map((x) => (
          <li key={x.glyph} className="flex flex-col items-center gap-1 text-small"><Hanko size="sm" glyph={x.glyph} />{x.name}</li>
        ))}
      </ul>
    </Stage>
  )
}
