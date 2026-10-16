import { useId, useState } from "react"
import { PLACEHOLDERS, useShowPlaceholders, type PlaceholderId } from "@/lib/placeholders"
import { cn } from "@/lib/utils"

/**
 * Crew only: a small amber "Placeholder" pill in the corner of something that isn't final. Hover, focus or tap
 * shows one line: what's coming and from who (a toggletip). Escape or tapping it again hides the line.
 * The parent needs position: relative. Renders nothing for guests, or once `done`.
 */
export function PlaceholderTag({ id, done, className }: { id: PlaceholderId; done?: boolean; className?: string }) {
  const show = useShowPlaceholders()
  const [open, setOpen] = useState(false)
  const lineId = useId()
  const p = PLACEHOLDERS[id]
  if (!show || done || p.done) return null
  return (
    <span className={cn("placeholder-tag", open && "is-open", className)} onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
      <button type="button" className="placeholder-tag-pill" aria-expanded={open} aria-describedby={lineId}
        onClick={() => setOpen((v) => !v)} onBlur={() => setOpen(false)} onKeyDown={(e) => { if (e.key === "Escape") setOpen(false) }}>
        Placeholder
      </button>
      <span id={lineId} role="tooltip" className="placeholder-tag-line">{p.coming}</span>
    </span>
  )
}
