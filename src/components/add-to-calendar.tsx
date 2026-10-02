import { CalendarPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { googleCalendarUrl, icsHref } from "@/lib/calendar"
import { useLang } from "@/lib/lang"

/** Two plain choices, same look on Home and The day: Google, or a file for Apple and Outlook. */
export function AddToCalendar() {
  const { t } = useLang()
  return (
    <div role="group" aria-labelledby="add-cal" className="space-y-2">
      <p id="add-cal" className="flex items-center gap-2 text-sm font-bold"><CalendarPlus className="size-4 text-primary" aria-hidden />{t.day.addToCalendar}</p>
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline" size="lg"><a href={googleCalendarUrl} target="_blank" rel="noreferrer">{t.day.googleCalendar}</a></Button>
        <Button asChild variant="outline" size="lg"><a href={icsHref()} download="nadia-griffin-wedding.ics">{t.day.appleCalendar}</a></Button>
      </div>
    </div>
  )
}
