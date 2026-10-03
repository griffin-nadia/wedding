import type { ReactNode } from "react"
import { Check, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"

/** Chip: many-of-many with no consequence (flying from, tags). 36 tall (44 tap area), Inter 14, 4px radius; selected = fill + 2px accent + tick. */
export function Chip({ on, onClick, invalid = false, children }: { on: boolean; onClick: () => void; invalid?: boolean; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={on} aria-invalid={invalid && !on ? true : undefined} onClick={onClick} className="state chip">
      {on && <Check className="chip-tick size-5 text-primary" aria-hidden />}
      {children}
    </button>
  )
}



/** Error under a field: 14px, danger, announced. Renders nothing when there's no message. */
export function FieldError({ id, children, className }: { id: string; children?: ReactNode; className?: string }) {
  if (!children) return null
  return <p id={id} role="alert" className={cn("text-xs text-destructive", className)}>{children}</p>
}

/** Step progress: three thin bars with real values. */
export function StepProgress({ step, of, label }: { step: number; of: number; label: string }) {
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={1} aria-valuemax={of} aria-valuenow={step} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${of}, 1fr)` }}>
      {Array.from({ length: of }, (_, i) => <span key={i} className={cn("h-1 rounded-full transition-colors duration-(--duration-settle)", i < step ? "bg-primary" : "bg-border")} />)}
    </div>
  )
}

/** A review row with an Edit link back to its step. */
export function ReviewRow({ label, children, edit, editLabel, block = false }: { label: string; children: ReactNode; edit: () => void; editLabel: string; block?: boolean }) {
  return (
    // dl > div > dt + dd only (the Edit button lives inside the dd)
    <div className={cn("flex gap-3 px-4 py-3", block ? "flex-col" : "items-start justify-between")}>
      <dt className="font-semibold text-foreground">{label}</dt>
      <dd className={cn("flex min-w-0 gap-2", block ? "flex-col" : "flex-1 items-start justify-end text-right")}>
        <span className={cn(block && "whitespace-pre-line break-words")}>{children}</span>
        <button type="button" onClick={edit} aria-label={editLabel}
          className={cn("btn-text inline-flex min-h-11 shrink-0 items-center gap-1 self-start px-2", block ? "-ml-2" : "-mt-2")}>
          <Pencil className="size-5" aria-hidden />Edit
        </button>
      </dd>
    </div>
  )
}



// Skeleton lives in its own file so Home doesn't pull Radix in with the RSVP blocks
export { Skeleton } from "@/components/skeleton"
