import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { googleCalendarUrl, icsHref } from "@/lib/calendar"
import { useLang } from "@/lib/lang"

/** Two plain choices, same look everywhere: Google, or a file for Apple and Outlook. Run 27: compact (the reply's done
 *  screen) puts the label and the two choices on one quiet row of links, so the screen stays short */
export function AddToCalendar({ compact = false }: { compact?: boolean }) {
  const { t } = useLang()
  // A quiet line of feedback after a tap (v3 R): the tab or the download happens off-page, so say so for 3 s
  const [note, setNote] = useState<"opened" | "saved" | null>(null)
  useEffect(() => { if (!note) return; const id = setTimeout(() => setNote(null), 3000); return () => clearTimeout(id) }, [note])
  if (compact) return (
    <div role="group" aria-labelledby="add-cal" className="flex flex-wrap items-center gap-x-4 gap-y-1">
      <p id="add-cal" className="text-small text-muted-foreground">{t.day.addToCalendar}</p>
      <a className="btn-text inline-flex min-h-11 items-center" href={googleCalendarUrl} target="_blank" rel="noreferrer" onClick={() => setNote("opened")}>{t.day.googleCalendar}</a>
      <a className="btn-text inline-flex min-h-11 items-center" href={icsHref()} download="nadia-griffin-wedding.ics" onClick={() => setNote("saved")}>{t.day.appleCalendar}</a>
      <p role="status" aria-live="polite" className={note ? "cal-note is-on w-full text-small text-success" : "cal-note w-full text-small text-success"}>{note === "opened" ? t.day.calendarOpened : note === "saved" ? t.day.calendarSaved : ""}</p>
    </div>
  )
  return (
    <div role="group" aria-labelledby="add-cal" className="flex flex-col gap-3">
      <p id="add-cal" className="label-caps text-muted-foreground">{t.day.addToCalendar}</p>
      <div className="grid gap-3 sm:flex sm:flex-wrap">
        <Button asChild variant="secondary" size="md"><a href={googleCalendarUrl} target="_blank" rel="noreferrer" onClick={() => setNote("opened")}>{t.day.googleCalendar}</a></Button>
        <Button asChild variant="secondary" size="md"><a href={icsHref()} download="nadia-griffin-wedding.ics" onClick={() => setNote("saved")}>{t.day.appleCalendar}</a></Button>
      </div>
      <p role="status" aria-live="polite" className={note ? "cal-note is-on text-small text-success" : "cal-note text-small text-success"}>{note === "opened" ? t.day.calendarOpened : note === "saved" ? t.day.calendarSaved : ""}</p>
    </div>
  )
}
