import { useEffect, useId, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { searchSongs, type SongHit } from "@/lib/api"
import { cn } from "@/lib/utils"

/**
 * A song box with search suggestions (with artwork) from our back end. Typing anything still works.
 * Keyboard: arrows move through suggestions, Enter picks, Escape closes.
 */
export function SongField({ label, value, onChange, placeholder, maxLength, token }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number; token: string
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
      searchSongs(value, token, ctrl.signal).then((r) => { setHits(r); setOpen(r.length > 0); setActive(-1) })
    }, 300)
    return () => { clearTimeout(t); ctrl.abort() }
  }, [value, token])

  const pick = (h: SongHit) => {
    typed.current = false
    onChange(`${h.title} · ${h.artist}`)
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
        <ul id={`${id}-list`} role="listbox" aria-label={`${label} suggestions`} className="absolute inset-x-0 top-full z-20 mt-2 max-h-80 overflow-y-auto rounded-xl border bg-popover p-1 text-popover-foreground shadow-paper">
          {hits.map((h, i) => (
            <li key={h.url || i} id={`${id}-${i}`} role="option" aria-selected={i === active}
              onMouseDown={(e) => { e.preventDefault(); pick(h) }}
              className={cn("flex min-h-13 cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-secondary", i === active && "bg-secondary")}>
              {h.artwork
                ? <img src={h.artwork} alt="" className="size-11 shrink-0 rounded-md object-cover" />
                : <span aria-hidden className="size-11 shrink-0 rounded-md bg-muted" />}
              <span className="min-w-0">
                <span className="block truncate font-semibold">{h.title}</span>
                <span className="block truncate text-xs text-muted-foreground">{h.artist}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
