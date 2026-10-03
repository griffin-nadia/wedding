import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react"
import { ArrowRight, Loader2 } from "lucide-react"
import { FormField, describedBy } from "@/components/form-field"
import { cn } from "@/lib/utils"

/**
 * Inline submit, and the base of every combobox: label above, the field with a 40px button centred in
 * its right edge, helper under (an error replaces it), one quiet fallback link. `popup` opens straight
 * under the field (combobox results).
 */
export const InlineSubmit = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & {
  label: string; helper?: string; submitLabel: string; onSubmit: () => void; busy?: boolean
  fallback?: { label: string; onClick: () => void }; error?: string; leading?: ReactNode; trailing?: ReactNode; popup?: ReactNode
}>(function InlineSubmit({ label, helper, submitLabel, onSubmit, busy, fallback, error, leading, trailing, popup, id = "inline", className, ...input }, ref) {
  return (
    <div className={cn("flex flex-col", className)}>
      <FormField id={id} label={label} help={helper} error={error}>
        <div className="relative">
          {leading && <span aria-hidden className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground">{leading}</span>}
          <input ref={ref} id={id} aria-invalid={Boolean(error) || undefined} aria-describedby={describedBy(id, helper, error)}
            className={cn("state field pr-14", leading && "pl-11")}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.defaultPrevented) { e.preventDefault(); onSubmit() } }} {...input} />
          {trailing}
          <button type="button" onClick={onSubmit} disabled={busy} aria-label={submitLabel} aria-busy={busy}
            className="btn-primary absolute top-1/2 right-1.5 grid size-10 -translate-y-1/2 place-items-center rounded-sm">
            {busy ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <ArrowRight className="size-5" aria-hidden />}
          </button>
          {popup}
        </div>
      </FormField>
      {fallback && <button type="button" onClick={fallback.onClick} className="btn-text mt-2 min-h-11 self-start">{fallback.label}</button>}
    </div>
  )
})
