import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * One spacing scale for every input family: label (Label token), 4px, the field, 8px, helper (14px).
 * An error replaces the helper. The control should point aria-describedby at `${id}-help` or `${id}-err`.
 */
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
