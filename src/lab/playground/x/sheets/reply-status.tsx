import { Check } from "lucide-react"
import { Pill } from "@/components/pill"
import { ReplyStatus } from "@/components/reply-status"
import { useLang } from "@/lib/lang"
import { useTake } from "../../params"

/**
 * Home after a reply, three ways (run 21, section 3), each with the change-by line under it:
 * - line: what ships. "Replied, thank you" with a check in the success ink, Change my reply beside it.
 * - tag: as it was. A green "Replied" tag, then Change my reply.
 * - stacked: the status line on its own, the action on the next line as a button.
 * Under each, the other two states the same component carries: not yet (pending) and closed after 30 April.
 */
export default function ReplyStatusLab() {
  const take = useTake("line")
  const { t } = useLang()
  const change = <button type="button" className="btn-text min-h-11">{t.home.changeReply}</button>
  return (
    <>
      <h1 className="heading">{t.home.yourReply}</h1>
      {take === "line" && <ReplyStatus tone="success" action={change}>{t.home.pills.replied}</ReplyStatus>}
      {take === "tag" && <div className="flex flex-wrap items-center gap-x-4 gap-y-2"><Pill tone="good">{t.home.pills.replied.split(",")[0]}</Pill>{change}</div>}
      {take === "stacked" && <div className="flex flex-col items-start gap-1"><p role="status" className="reply-status-line"><Check aria-hidden className="size-4.5" />{t.home.pills.replied}</p>{change}</div>}
      <p className="text-small text-muted-foreground">{t.home.changeBy}</p>
      <hr className="border-(--line-hairline)" />
      <p className="label-caps">The other states</p>
      <ReplyStatus tone="pending">{t.home.todo.toDo}</ReplyStatus>
      <ReplyStatus tone="closed">{t.home.rsvpClosed}</ReplyStatus>
    </>
  )
}
