import type { ReactNode } from "react"
import { Check, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"

/** Selectable chip with a visible tick (dietary, flying from). Not colour alone. */
export function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick}
      className={cn("press inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none", on ? "border-primary bg-secondary font-semibold text-foreground" : "bg-card")}>
      {on ? <Check className="size-4 text-primary" strokeWidth={3} aria-hidden /> : <span aria-hidden className="size-4" />}
      {children}
    </button>
  )
}

/** The seal that fills a chosen choice card. */
export function Seal({ on }: { on: boolean }) {
  return (
    <span aria-hidden className={cn("grid size-7 shrink-0 place-items-center rounded-full border-2 transition-colors", on ? "seal border-primary bg-primary text-primary-foreground" : "border-muted-foreground/50")}>
      {on && <Check className="size-4" strokeWidth={3} />}
    </span>
  )
}

/** Step label, title and a progress bar with real values. */
export function StepProgress({ step, of, label }: { step: number; of: number; label: string }) {
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={1} aria-valuemax={of} aria-valuenow={step} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${of}, 1fr)` }}>
      {Array.from({ length: of }, (_, i) => <span key={i} className={cn("h-1.5 rounded-full transition-colors", i < step ? "bg-primary" : "bg-border")} />)}
    </div>
  )
}

/** A review row with an Edit link back to its step. */
export function ReviewRow({ label, children, edit, editLabel, block = false }: { label: string; children: ReactNode; edit: () => void; editLabel: string; block?: boolean }) {
  return (
    // dl > div > dt + dd only (the Edit button lives inside the dd)
    <div className={cn("flex gap-3 px-4 py-3 text-sm", block ? "flex-col" : "items-start justify-between")}>
      <dt className="font-semibold">{label}</dt>
      <dd className={cn("flex min-w-0 gap-2 text-body", block ? "flex-col" : "flex-1 items-start justify-end text-right")}>
        <span className={cn(block && "whitespace-pre-line break-words")}>{children}</span>
        <button type="button" onClick={edit} aria-label={editLabel}
          className={cn("inline-flex min-h-11 shrink-0 items-center gap-1 self-start rounded-full px-3 text-link underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none", block ? "-ml-3" : "-mt-3")}>
          <Pencil className="size-3.5" aria-hidden />Edit
        </button>
      </dd>
    </div>
  )
}

/** Short labelled block with at most one action (Veley / Ross style). */
export function InfoBlock({ label, children, action, media, as: H = "h2" }: { label: string; children: ReactNode; action?: { label: string; href: string }; media?: ReactNode; as?: "h2" | "h3" | "h4" }) {
  return (
    <section className="space-y-2 rounded-[1.25rem] bg-card p-5 shadow-paper ring-1 ring-border">
      {media}
      <H className="label-caps text-eyebrow">{label}</H>
      <div className="text-body">{children}</div>
      {action && <a href={action.href} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-link underline underline-offset-4">{action.label}</a>}
    </section>
  )
}

/** One row of the day's timeline: icon on the line, time in the display face. */
export function TimelineRow({ icon, time, title, where, local }: { icon: ReactNode; time: string; title: string; where: string; local?: string | null }) {
  return (
    <li className="relative">
      <span aria-hidden className="absolute top-0 -left-12 grid size-10 place-items-center rounded-full bg-card text-primary shadow-paper ring-1 ring-border">{icon}</span>
      <p className="numerals text-3xl leading-none">{time}</p>
      <p className="mt-1 text-lg font-semibold">{title}</p>
      <p className="text-sm text-body">{where}</p>
      {local && <p className="text-xs text-muted-foreground">{local}</p>}
    </li>
  )
}

/** Washi skeleton: appears after 300ms, breathes slowly, no shimmer. */
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cn("skeleton-wait washi block rounded-md bg-muted", className)} />
}
