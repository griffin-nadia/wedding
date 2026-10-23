import type { ReactNode } from "react"
import { Pencil } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLang } from "@/lib/lang"

/** Step progress: three thin bars with real values. */
export function StepProgress({ step, of, label }: { step: number; of: number; label: string }) {
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={1} aria-valuemax={of} aria-valuenow={step} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${of}, 1fr)` }}>
      {Array.from({ length: of }, (_, i) => <span key={i} className={cn("h-1 rounded-full transition-colors duration-(--duration-base)", i < step ? "bg-primary" : "bg-border")} />)}
    </div>
  )
}

/** A review row with an Edit link back to its step. */
export function ReviewRow({ label, children, edit, editLabel, block = false }: { label: string; children: ReactNode; edit: () => void; editLabel: string; block?: boolean }) {
  const editText = useLang().t.rsvp.editShort
  return (
    // dl > div > dt + dd only (the Edit button lives inside the dd)
    // Run 25: a grid, so every row's Edit sits in one column on the right (the message's too) and answers get the room
    <div className="review-row" data-block={block || undefined}>
      <dt className="font-medium text-foreground">{label}</dt>
      <dd className="min-w-0">
        <span className={cn("break-words", block && "whitespace-pre-line")}>{children}</span>
        <button type="button" onClick={edit} aria-label={editLabel}
          className="btn-text -mt-2 inline-flex min-h-11 shrink-0 items-center gap-1 px-2">
          <Pencil className="size-5" aria-hidden />{editText}
        </button>
      </dd>
    </div>
  )
}



// Skeleton lives in its own file so Home doesn't pull Radix in with the RSVP blocks
export { Skeleton } from "@/components/skeleton"
