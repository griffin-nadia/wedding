import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react"
import { ArrowRight, Loader2 } from "lucide-react"
import { FieldError } from "@/components/blocks"
import { cn } from "@/lib/utils"

/**
 * Inline-submit input: label above (Label token), helper, the field with an arrow button inside its
 * right edge, error under in 14px danger, one quiet fallback link. Same states as every input.
 */
export const InlineSubmit = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & {
  label: string; helper?: string; submitLabel: string; onSubmit: () => void; busy?: boolean
  fallback?: { label: string; onClick: () => void }; error?: string; leading?: ReactNode; trailing?: ReactNode
}>(function InlineSubmit({ label, helper, submitLabel, onSubmit, busy, fallback, error, leading, trailing, id, className, ...input }, ref) {
  const hintId = `${id}-hint`, errId = `${id}-err`
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="label-caps text-foreground">{label}</label>
      {helper && <p id={hintId} className="text-sm text-muted-foreground">{helper}</p>}
      <div className="relative">
        {leading && <span aria-hidden className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground">{leading}</span>}
        <input ref={ref} id={id} aria-invalid={Boolean(error) || undefined} aria-describedby={[helper && hintId, error && errId].filter(Boolean).join(" ") || undefined}
          className={cn("state field pr-16", leading ? "pl-11" : "")}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.defaultPrevented) { e.preventDefault(); onSubmit() } }} {...input} />
        {trailing}
        <button type="button" onClick={onSubmit} disabled={busy} aria-label={submitLabel} aria-busy={busy}
          className="btn-primary absolute top-1/2 right-1 grid size-11 -translate-y-1/2 place-items-center rounded-sm">
          {busy ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <ArrowRight className="size-5" aria-hidden />}
        </button>
      </div>
      <FieldError id={errId}>{error}</FieldError>
      {fallback && <button type="button" onClick={fallback.onClick} className="btn-text min-h-11 self-start">{fallback.label}</button>}
    </div>
  )
})
