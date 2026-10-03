import { Button } from "@/components/ui/button"
import { googleCalendarUrl, icsHref } from "@/lib/calendar"
import { useLang } from "@/lib/lang"

/** Two plain choices, same look everywhere: Google, or a file for Apple and Outlook. */
export function AddToCalendar() {
  const { t } = useLang()
  return (
    <div role="group" aria-labelledby="add-cal" className="flex flex-col gap-3">
      <p id="add-cal" className="label-caps text-muted-foreground">{t.day.addToCalendar}</p>
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline" size="lg"><a href={googleCalendarUrl} target="_blank" rel="noreferrer">{t.day.googleCalendar}</a></Button>
        <Button asChild variant="outline" size="lg"><a href={icsHref()} download="nadia-griffin-wedding.ics">{t.day.appleCalendar}</a></Button>
      </div>
    </div>
  )
}
