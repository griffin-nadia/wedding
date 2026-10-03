import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useLang } from "@/lib/lang"

/** Q&A: one accordion. Answers are body text, always. */
export function QaPage() {
  const { t } = useLang()
  return (
    <>
      <h1 className="heading">{t.qa.title}</h1>
      <Accordion type="single" collapsible>
        {t.qa.items.map((item, i) => (
          <AccordionItem key={item.q} value={`q${i}`}>
            <AccordionTrigger>{item.q}</AccordionTrigger>
            <AccordionContent><p>{item.a}</p></AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <p className="hand">{t.qa.contact}</p>
    </>
  )
}
