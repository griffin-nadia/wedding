import { Disclosure } from "@/components/disclosure"
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useLang } from "@/lib/lang"
import { useContent } from "@/lib/content"
import { useOption } from "@/lib/options"
import { ART } from "@/lib/art"

/** FAQs: one numbered accordion (numbers help guests point to a question when they message). Answers are body.
 * Who to contact on the day appears once Nadia and Griffin fill contact_day in the Content tab. */
export function FaqsPage() {
  const { t } = useLang()
  const music = useOption("music") !== "off" // Options → Music toggle: the track's credit line
  const { contactDay } = useContent()
  return (
    <>
      <h1 className="heading">{t.qa.title}</h1>
      <Disclosure label={t.qa.title}>
        {t.qa.items.map((item, i) => (
          <AccordionItem key={item.q} value={`q${i}`}>
            <AccordionTrigger>
              <span className="flex items-baseline gap-4">
                <span aria-hidden className="numerals w-6 shrink-0 text-primary">{String(i + 1).padStart(2, "0")}</span>
                <span><span className="sr-only">{i + 1}. </span>{item.q}</span>
              </span>
            </AccordionTrigger>
            <AccordionContent><p className="pl-10">{item.a}</p></AccordionContent>
          </AccordionItem>
        ))}
      </Disclosure>
      <p className="text-sm">{t.qa.contact}</p>
      {contactDay && <p className="text-sm">{t.qa.onTheDay} {contactDay}</p>}
      {music && <p className="text-sm text-muted-foreground">{t.music.credit(ART.music.title, ART.music.artist, ART.music.year)}</p>}
    </>
  )
}
