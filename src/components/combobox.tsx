import { useEffect, useId, useState, type ReactNode } from "react"
import { X } from "lucide-react"
import { FormField, describedBy } from "@/components/form-field"
import { cn } from "@/lib/utils"

export type Option = { key: string; label: string; sub?: string; img?: string | null }
export type ComboStatus = "idle" | "loading" | "results" | "empty" | "error"

/**
 * One combobox for the whole site (dietary needs, songs): the text field's states exactly, picked items
 * as removable tags inside the field (multi), results straight under the field in 44px rows.
 * In-between states: loading shows skeleton rows after 150 ms and keeps the last results visible;
 * empty and error rows say what to do ("just type it"). WAI-ARIA combobox with listbox.
 */
export function Combobox({ id: given, label, help, error, tags = [], onRemoveTag, query, onQuery, options, onPick, status, emptyText, errorText,
  placeholder, action, maxLength = 200, removeLabel = (s) => `Remove ${s}`, openOnFocus = false, forceOpen = false, className }: {
  id?: string; label: string; help?: ReactNode; error?: string
  tags?: Option[]; onRemoveTag?: (o: Option) => void
  query: string; onQuery: (q: string) => void
  options: Option[]; onPick: (o: Option) => void
  status: ComboStatus; emptyText?: string; errorText?: string
  placeholder?: string; action?: ReactNode; maxLength?: number; removeLabel?: (s: string) => string; openOnFocus?: boolean; forceOpen?: boolean; className?: string
}) {
  const auto = useId()
  const id = given ?? `cb-${auto}`
  const [open, setOpen] = useState(forceOpen)
  const [active, setActive] = useState(-1)
  // Skeleton rows only once loading has lasted 150 ms; the last results stay on screen meanwhile
  const [slow, setSlow] = useState(forceOpen && status === "loading")
  useEffect(() => {
    if (status !== "loading") { setSlow(false); return }
    if (forceOpen) { setSlow(true); return }
    const t = setTimeout(() => setSlow(true), 150)
    return () => clearTimeout(t)
  }, [status])
  useEffect(() => { setActive(-1) }, [options])

  const showList = open && (options.length > 0 || status === "empty" || status === "error" || (status === "loading" && slow))
  const pick = (o: Option) => { onPick(o); setActive(-1) }

  return (
    <FormField id={id} label={label} help={help} error={error} className={className}>
      <div className="relative">
        <div className={cn("state combo-field", action && "pr-14")} aria-invalid={Boolean(error) || undefined} onClick={() => document.getElementById(id)?.focus()}>
          {tags.map((t) => (
            <span key={t.key} className="combo-tag">
              {t.label}
              {onRemoveTag && (
                <button type="button" aria-label={removeLabel(t.label)} onClick={(e) => { e.stopPropagation(); onRemoveTag(t) }} className="combo-tag-x press">
                  <X className="size-3.5" aria-hidden />
                </button>
              )}
            </span>
          ))}
          <input id={id} role="combobox" aria-autocomplete="list" aria-expanded={showList} aria-controls={`${id}-list`}
            aria-activedescendant={showList && active >= 0 ? `${id}-o${active}` : undefined} aria-describedby={describedBy(id, help, error)}
            aria-busy={status === "loading"} aria-invalid={Boolean(error) || undefined}
            value={query} maxLength={maxLength} autoComplete="off" placeholder={tags.length ? "" : placeholder}
            onChange={(e) => { onQuery(e.target.value); setOpen(true) }}
            onFocus={() => (openOnFocus || query.trim().length > 1) && setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(forceOpen), 150)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, options.length - 1)) }
              else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
              else if (e.key === "Enter") { const o = active >= 0 ? options[active] : undefined; if (o) { e.preventDefault(); pick(o) } }
              // Escape closes the list only; the sheet around it stays open
              else if (e.key === "Escape" && showList) setOpen(false)
              else if (e.key === "Backspace" && !query && tags.length && onRemoveTag) onRemoveTag(tags[tags.length - 1])
            }}
            className="combo-input" />
        </div>
        {action}
        {!showList && <ul id={`${id}-list`} role="listbox" aria-label={label} hidden />}
        {showList && (
          <div className="combo-list">
            {(
              <ul id={`${id}-list`} role="listbox" aria-label={label} hidden={!options.length}>
                {options.map((o, i) => (
                  <li key={o.key} id={`${id}-o${i}`} role="option" aria-selected={i === active}
                    onMouseDown={(e) => { e.preventDefault(); pick(o) }} className="combo-option">
                    {o.img !== undefined && (o.img ? <img src={o.img} alt="" className="size-8 shrink-0 rounded-sm object-cover" /> : <span aria-hidden className="size-8 shrink-0 rounded-sm bg-muted" />)}
                    <span className="min-w-0">
                      <span className="block truncate">{o.label}</span>
                      {o.sub && <span className="block truncate text-xs text-muted-foreground">{o.sub}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {status === "loading" && slow && !options.length && <div aria-hidden>{[0, 1, 2].map((k) => <div key={k} className="combo-option"><span className="skeleton-wait washi block h-4 w-2/3 rounded-sm bg-muted" /></div>)}</div>}
            {status === "empty" && <p className="combo-note">{emptyText}</p>}
            {status === "error" && <p className="combo-note">{errorText}</p>}
          </div>
        )}
        <p aria-live="polite" className="sr-only">{status === "loading" ? "Searching" : status === "results" ? `${options.length} results` : status === "empty" ? emptyText : ""}</p>
      </div>
    </FormField>
  )
}
