import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { googleCalendarUrl, icsHref } from "@/lib/calendar"
import { useLang } from "@/lib/lang"

/** Two plain choices, same look everywhere: Google, or a file for Apple and Outlook. */
export function AddToCalendar() {
  const { t } = useLang()
  // A quiet line of feedback after a tap (v3 R): the tab or the download happens off-page, so say so for 3 s
  const [note, setNote] = useState<"opened" | "saved" | null>(null)
  useEffect(() => { if (!note) return; const id = setTimeout(() => setNote(null), 3000); return () => clearTimeout(id) }, [note])
  return (
    <div role="group" aria-labelledby="add-cal" className="flex flex-col gap-3">
      <p id="add-cal" className="label-caps text-muted-foreground">{t.day.addToCalendar}</p>
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline" size="lg"><a href={googleCalendarUrl} target="_blank" rel="noreferrer" onClick={() => setNote("opened")}>{t.day.googleCalendar}</a></Button>
        <Button asChild variant="outline" size="lg"><a href={icsHref()} download="nadia-griffin-wedding.ics" onClick={() => setNote("saved")}>{t.day.appleCalendar}</a></Button>
      </div>
      <p role="status" aria-live="polite" className={note ? "cal-note is-on text-sm text-success" : "cal-note text-sm text-success"}>{note === "opened" ? t.day.calendarOpened : note === "saved" ? t.day.calendarSaved : ""}</p>
    </div>
  )
}
