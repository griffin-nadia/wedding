import { useEffect, useState } from "react"
import { Combobox } from "@/components/combobox"
import { JourneyMini } from "@/components/journey-mini"
import { FLYING, getFlying, setFlying, type Flying } from "@/lib/api"
import { keepFlying, readFlying } from "@/lib/journey"
import { useLang } from "@/lib/lang"

/**
 * After the fortune, on "You're all set": one optional card. Where are you flying from? A combobox: type to filter
 * the nine places (or open it and pick), and their gold line draws on the small map over everyone else's faint ones. The sheet only ever gets a count per city, never
 * who; the city stays on this device so Home can show their line. Still under reduced motion: the line is drawn.
 */
export function JourneyEnd({ token }: { token: string }) {
  const { t } = useLang()
  const [city, setCity] = useState<Flying | null>(() => readFlying(token))
  const [counts, setCounts] = useState<Partial<Record<Flying, number>> | null>(null)
  useEffect(() => { void getFlying().then((f) => setCounts(f?.counts ?? null)) }, [])
  const pick = (c: Flying) => {
    if (c === city) return
    setCity(c)
    keepFlying(token, c)
    void setFlying(token, c).catch(() => {})
  }
  const label = (c: Flying) => t.flying.cities[c] ?? c
  const name = city ? label(city) : null
  const [q, setQ] = useState(name ?? "")
  // Everything while the field shows the chosen place (or nothing); otherwise the places containing what's typed
  const term = q.trim().toLowerCase()
  const starts = (c: Flying) => (label(c).toLowerCase().startsWith(term) ? 0 : 1) // the ones starting with it first
  const options = FLYING.filter((c) => !term || q === name || label(c).toLowerCase().includes(term))
    .sort((a, b) => (q === name ? 0 : starts(a) - starts(b))).map((c) => ({ key: c, label: label(c), selected: c === city }))
  const choose = (c: Flying) => { pick(c); setQ(label(c)); document.getElementById("fly-from")?.blur() }
  return (
    <section aria-label={t.flying.endTitle} className="journey-end">
      <Combobox id="fly-from" label={t.flying.endTitle} help={t.flying.hint} placeholder={t.flying.placeholder} query={q} onQuery={setQ} openOnFocus
        options={options} onPick={(o) => choose(o.key as Flying)} onSubmit={() => options[0] && choose(options[0].key as Flying)}
        status={options.length ? "results" : "empty"} emptyText={t.flying.noMatch} enterKeyHint="done" />
      <JourneyMini you={city} counts={counts} label={t.journey.map(name, city ?? undefined)} className="journey-end-map" />
      {name && <p role="status" className="text-small text-muted-foreground">{t.flying.yours(city!, name)}</p>}
    </section>
  )
}
