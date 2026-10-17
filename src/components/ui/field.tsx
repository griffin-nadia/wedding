import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * One spacing scale for every input family: label (Label token), 4px, the field, 8px, helper (14px).
 * An error replaces the helper. The control should point aria-describedby at `${id}-help` or `${id}-err`.
 */
/** Field (Open UI: field): label always visible, the control, then help or an inline error. */
export function FormField({ id, label, help, error, children, className }: { id: string; label: ReactNode; help?: ReactNode; error?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("form-field", className)}>
      <label htmlFor={id} className="form-label label-caps text-foreground">{label}</label>
      {children}
      {error ? <p id={`${id}-err`} role="alert" className="form-help text-destructive">{error}</p>
        : help ? <p id={`${id}-help`} className="form-help text-muted-foreground">{help}</p> : null}
    </div>
  )
}
export const describedBy = (id: string, help?: unknown, error?: unknown) => (error ? `${id}-err` : help ? `${id}-help` : undefined)

/** Error under a field: 14px, danger, announced. Renders nothing when there's no message. */
export function FieldError({ id, children, className }: { id: string; children?: ReactNode; className?: string }) {
  if (!children) return null
  return <p id={id} role="alert" className={cn("text-small text-destructive", className)}>{children}</p>
}
