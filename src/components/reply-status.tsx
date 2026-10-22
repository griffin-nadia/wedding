import { Check, Clock, Lock } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * A reply's status as a line, not a tag (run 21): a small icon and words in the status ink, with the next action
 * beside it when there is one. Open UI / ARIA: a status (role="status"), so a change is announced politely.
 * tone: success (replied), pending (not yet), closed (after the changes lock). No words, no line: just the action, in
 * the same place, so an action that holds state (the reply sheet) isn't remounted when the status appears.
 */
export function ReplyStatus({ tone, children, action, className }: { tone: "success" | "pending" | "closed"; children?: React.ReactNode; action?: React.ReactNode; className?: string }) {
  const Icon = tone === "success" ? Check : tone === "pending" ? Clock : Lock
  return (
    <div className={cn("reply-status", className)} data-tone={tone}>
      {children ? <p role="status" className="reply-status-line"><Icon aria-hidden className="size-4.5" strokeWidth={2.25} />{children}</p> : null}
      {action}
    </div>
  )
}
