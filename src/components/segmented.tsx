import { useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * One tab / segmented control for the whole site and its tools (The day tabs, /kit modes, /lab pages,
 * the tuning panel's tabs and options). Same look as the nav: a sage marker slides to the chosen item
 * in 200 ms. role="tablist" (with panels) or "radiogroup" (a choice); arrow keys move and choose.
 * A choice shows the selected state in full (v3 R): secondary fill, 2px primary line and a tick, in a
 * slot every item reserves so nothing shifts when the tick appears.
 */
export function Segmented<T extends string>({ items, value, onChange, label, role = "radiogroup", size = "md", className, idPrefix, id, invalid, describedBy }: {
  items: { value: T; label: ReactNode }[]; value: T | ""; onChange: (v: T) => void; label: string
  role?: "tablist" | "radiogroup"; size?: "sm" | "md"; className?: string; idPrefix?: string; id?: string; invalid?: boolean; describedBy?: string
}) {
  const list = useRef<HTMLDivElement>(null)
  const [mark, setMark] = useState<{ x: number; w: number } | null>(null)
  useLayoutEffect(() => {
    const place = () => {
      const b = list.current?.querySelector<HTMLElement>('[data-on="true"]')
      setMark(b ? { x: b.offsetLeft, w: b.offsetWidth } : null)
    }
    place()
    const ro = new ResizeObserver(place); if (list.current) ro.observe(list.current)
    return () => ro.disconnect()
  }, [value, items.length])
  const move = (e: KeyboardEvent, i: number) => {
    const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0
    if (!d) return
    e.preventDefault()
    const n = items[(i + d + items.length) % items.length]
    onChange(n.value)
    requestAnimationFrame(() => list.current?.querySelector<HTMLElement>(`[data-value="${n.value}"]`)?.focus())
  }
  const tab = role === "tablist"
  return (
    <div ref={list} id={id} tabIndex={id ? -1 : undefined} role={role} aria-label={label} aria-invalid={invalid || undefined} aria-describedby={describedBy}
      className={cn("segmented", size === "sm" && "segmented-sm", className)}>
      {mark && <span aria-hidden className="segmented-mark" style={{ transform: `translateX(${mark.x}px)`, width: mark.w }} />}
      {items.map((it, i) => {
        const on = it.value === value
        const reachable = on || (!value && i === 0)
        return (
          <button key={it.value} type="button" role={tab ? "tab" : "radio"} data-value={it.value} data-on={on}
            id={idPrefix ? `${idPrefix}-tab-${it.value}` : undefined} aria-controls={tab && idPrefix ? `${idPrefix}-panel-${it.value}` : undefined}
            {...(tab ? { "aria-selected": on } : { "aria-checked": on })} tabIndex={reachable ? 0 : -1}
            onClick={() => onChange(it.value)} onKeyDown={(e) => move(e, i)} className="segmented-item">
            {!tab && <Check aria-hidden className={cn("segmented-tick size-5", !on && "invisible")} />}
            {it.label}
          </button>
        )
      })}
    </div>
  )
}
