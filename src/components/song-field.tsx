import { useEffect, useId, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { searchSongs, type SongHit } from "@/lib/api"
import { cn } from "@/lib/utils"

/**
 * A song box with Spotify suggestions (when the back end has keys). Typing anything still works.
 * Keyboard: arrows move through suggestions, Enter picks, Escape closes.
 */
export function SongField({ label, value, onChange, placeholder, maxLength }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number
}) {
  const id = useId()
  const [hits, setHits] = useState<SongHit[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const typed = useRef(false)

  useEffect(() => {
    if (!typed.current) return
    const ctrl = new AbortController()
    const t = setTimeout(() => {
      searchSongs(value, ctrl.signal).then((r) => { setHits(r); setOpen(r.length > 0); setActive(-1) })
    }, 350)
    return () => { clearTimeout(t); ctrl.abort() }
  }, [value])

  const pick = (h: SongHit) => {
    typed.current = false
    onChange(`${h.title}, ${h.artist}`)
    setOpen(false)
  }

  return (
    <div className="relative">
      <Input
        role="combobox" aria-label={label} aria-autocomplete="list" aria-expanded={open} aria-controls={`${id}-list`}
        aria-activedescendant={open && active >= 0 ? `${id}-${active}` : undefined}
        value={value} placeholder={placeholder} maxLength={maxLength} autoComplete="off"
        onChange={(e) => { typed.current = true; onChange(e.target.value) }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (!open) return
          if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, hits.length - 1)) }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
          else if (e.key === "Enter" && active >= 0) { e.preventDefault(); pick(hits[active]) }
          else if (e.key === "Escape") setOpen(false)
        }}
      />
      {open && (
        <ul id={`${id}-list`} role="listbox" aria-label={`${label} suggestions`} className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-md border bg-card shadow-paper">
          {hits.map((h, i) => (
            <li key={h.url || i} id={`${id}-${i}`} role="option" aria-selected={i === active}
              onMouseDown={(e) => { e.preventDefault(); pick(h) }}
              className={cn("flex min-h-11 cursor-pointer flex-col justify-center px-3 py-2 text-sm", i === active && "bg-secondary")}>
              <span className="font-bold">{h.title}</span>
              <span className="text-xs text-muted-foreground">{h.artist}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
