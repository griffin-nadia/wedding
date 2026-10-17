import { AccordionContent, AccordionItem, AccordionTrigger, Disclosure } from "@/components/ui/accordion"
import { useLang } from "@/lib/lang"
import { PageHeader } from "@/components/ui/page-header"
import { useContent } from "@/lib/content"

/** FAQs: one numbered accordion (numbers help guests point to a question when they message). Answers are body.
 * Who to contact on the day appears once Griffin and Nadia fill contact_day in the Content tab. */
export function FaqsPage() {
  const { t } = useLang()
  const { contactDay } = useContent()
  return (
    <>
      <PageHeader title={t.qa.title} />
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
      <p className="text-small">{t.qa.contact}</p>
      {contactDay && <p className="text-small">{t.qa.onTheDay} {contactDay}</p>}
    </>
  )
}
