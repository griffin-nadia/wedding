import type { ReactNode } from "react"
import { Check, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"

/** Selectable chip with a visible tick (dietary, allergens, flying from). Same states as every input. */
export function Chip({ on, onClick, invalid = false, children }: { on: boolean; onClick: () => void; invalid?: boolean; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={on} aria-invalid={invalid && !on ? true : undefined} onClick={onClick}
      className={cn("state inline-flex min-h-11 items-center gap-2 rounded-sm text-foreground", on ? "pr-4 pl-3" : "px-4")}>
      {on && <Check className="chip-tick size-4 text-primary" strokeWidth={3} aria-hidden />}
      {children}
    </button>
  )
}

/** The seal that fills a chosen choice card. */
export function Seal({ on }: { on: boolean }) {
  return (
    <span aria-hidden className={cn("grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors", on ? "seal border-primary bg-primary text-primary-foreground" : "border-muted-foreground/60")}>
      {on && <Check className="size-4" strokeWidth={3} />}
    </span>
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
          <Pencil className="size-4" aria-hidden />Edit
        </button>
      </dd>
    </div>
  )
}

/** Short labelled block with at most one action (Veley / Ross style). */
export function InfoBlock({ label, children, action, media, as: H = "h2" }: { label: string; children: ReactNode; action?: { label: string; href: string }; media?: ReactNode; as?: "h2" | "h3" | "h4" }) {
  return (
    <section className="flex flex-col gap-2 rounded-md border bg-card p-4">
      {media}
      <H className="label-caps text-muted-foreground">{label}</H>
      <div>{children}</div>
      {action && <a href={action.href} target="_blank" rel="noreferrer" className="btn-text inline-flex min-h-11 items-center self-start">{action.label}</a>}
    </section>
  )
}

/** One row of the day's timeline: icon on the line, time in the display face. */
export function TimelineRow({ icon, time, title, where, local }: { icon: ReactNode; time: string; title: string; where: string; local?: string | null }) {
  return (
    <li className="relative">
      <span aria-hidden className="absolute top-0 -left-12 grid size-10 place-items-center rounded-full border bg-card text-primary">{icon}</span>
      <p className="font-semibold text-foreground">{time} · {title}</p>
      <p>{where}</p>
      {local && <p className="text-sm text-muted-foreground">{local}</p>}
    </li>
  )
}

/** Washi skeleton: appears after 300ms, breathes slowly, no shimmer. */
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cn("skeleton-wait washi block rounded-sm bg-muted", className)} />
}
