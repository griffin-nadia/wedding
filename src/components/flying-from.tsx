import { useState } from "react"
import { Chip } from "@/components/blocks"
import { FLYING, setFlying, type Flying } from "@/lib/api"
import { useLang } from "@/lib/lang"

/** Optional: where a household is flying from (a short list). Only ever shown as counts. */
export function FlyingFrom({ token }: { token: string }) {
  const { t } = useLang()
  const [picked, setPicked] = useState<Flying | null>(null)
  const [saved, setSaved] = useState(false)
  return (
    <div role="group" aria-labelledby="flying" className="flex flex-col gap-3">
      <p id="flying" className="font-medium text-foreground">{t.flying.title} <span className="font-normal text-body">{t.flying.hint}</span></p>
      <div className="flex flex-wrap gap-2">
        {FLYING.map((c) => (
          <Chip key={c} on={picked === c} onClick={() => { setPicked(c); setSaved(false); setFlying(token, c).then(() => setSaved(true)).catch(() => setPicked(null)) }}>{c}</Chip>
        ))}
      </div>
      {saved && <p role="status" className="text-success">{t.flying.thanks}</p>}
    </div>
  )
}
