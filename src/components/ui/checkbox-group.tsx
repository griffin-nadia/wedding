import type { ReactNode } from "react"
import { Check } from "lucide-react"

/**
 * Chip (Open UI: toggle button): many-of-many with no consequence. The chip shape, a 44px tap area; selected = fill,
 * accent line and a tick (never colour alone).
 */
export function Chip({ on, onClick, invalid = false, children }: { on: boolean; onClick: () => void; invalid?: boolean; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={on} aria-invalid={invalid && !on ? true : undefined} onClick={onClick} className="state chip">
      {on && <Check className="chip-tick size-5 text-primary" aria-hidden />}
      {children}
    </button>
  )
}

/**
 * Checkbox group as tap chips: a labelled group, any number on, no keyboard needed on a phone. Each chip is a
 * toggle button, so screen readers hear "pressed" for the ones that are on.
 */
export function CheckboxGroup<T extends string>({ label, labelId, options, value, onChange, className }: {
  label: ReactNode; labelId: string; options: { value: T; label: ReactNode }[]; value: T[]; onChange: (v: T[]) => void; className?: string
}) {
  const toggle = (v: T) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v])
  return (
    <div role="group" aria-labelledby={labelId} className={className}>
      <p id={labelId} className="form-label label-caps text-foreground">{label}</p>
      <div className="mt-1 flex flex-wrap gap-2">
        {options.map((o) => <Chip key={o.value} on={value.includes(o.value)} onClick={() => toggle(o.value)}>{o.label}</Chip>)}
      </div>
    </div>
  )
}
