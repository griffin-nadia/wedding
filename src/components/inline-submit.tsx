import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react"
import { ArrowRight, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Inline-submit input (Game Night "Add a game"): helper text above, a large rounded field with a
 * 2px accent border on focus and an arrow button inside the right edge, one quiet fallback link below.
 */
export const InlineSubmit = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & {
  label: string; helper?: string; submitLabel: string; onSubmit: () => void; busy?: boolean
  fallback?: { label: string; onClick: () => void }; error?: string; leading?: ReactNode; trailing?: ReactNode
}>(function InlineSubmit({ label, helper, submitLabel, onSubmit, busy, fallback, error, leading, trailing, id, className, ...input }, ref) {
  const hintId = `${id}-hint`, errId = `${id}-err`
  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={id} className="block text-sm font-medium">{label}</label>
      {helper && <p id={hintId} className="text-xs text-muted-foreground">{helper}</p>}
      <div className="relative">
        {leading && <span aria-hidden className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground">{leading}</span>}
        <input ref={ref} id={id} aria-invalid={Boolean(error)} aria-describedby={[helper && hintId, error && errId].filter(Boolean).join(" ") || undefined}
          className={cn("h-14 w-full rounded-2xl border-2 border-input bg-card pr-16 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-primary aria-invalid:border-destructive", leading ? "pl-11" : "pl-4")}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.defaultPrevented) { e.preventDefault(); onSubmit() } }} {...input} />
        {trailing}
        <button type="button" onClick={onSubmit} disabled={busy} aria-label={submitLabel} aria-busy={busy}
          className="press absolute top-1/2 right-2 grid size-11 -translate-y-1/2 place-items-center rounded-xl bg-primary text-primary-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none disabled:opacity-70">
          {busy ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <ArrowRight className="size-5" aria-hidden />}
        </button>
      </div>
      {error && <p id={errId} role="alert" className="text-sm text-destructive">{error}</p>}
      {fallback && <button type="button" onClick={fallback.onClick} className="min-h-11 text-sm text-link underline underline-offset-4">{fallback.label}</button>}
    </div>
  )
})
