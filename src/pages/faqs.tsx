import { Disclosure } from "@/components/disclosure"
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useLang } from "@/lib/lang"

/** FAQs: one numbered accordion (numbers help guests point to a question when they message). Answers are body. */
export function FaqsPage() {
  const { t } = useLang()
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
    </>
  )
}
