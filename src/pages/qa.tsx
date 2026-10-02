import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useLang } from "@/lib/lang"

export function QaPage() {
  const { t } = useLang()
  return (
    <div className="max-w-2xl space-y-6 py-6 md:py-16">
      <h1 className="text-4xl md:text-6xl">{t.qa.title}</h1>
      <Accordion type="single" collapsible className="rounded-lg border bg-card px-5">
        {t.qa.items.map((item, i) => (
          <AccordionItem key={item.q} value={`q${i}`}>
            <AccordionTrigger className="text-base font-bold">{item.q}</AccordionTrigger>
            <AccordionContent className="font-display text-base text-body">{item.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <p className="text-sm text-muted-foreground">{t.qa.contact}</p>
    </div>
  )
}
