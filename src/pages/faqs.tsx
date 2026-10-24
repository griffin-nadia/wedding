import { AccordionContent, AccordionItem, AccordionTrigger, Disclosure } from "@/components/ui/accordion"
import { useLang } from "@/lib/lang"
import { PageHeader } from "@/components/ui/page-header"
import { pending } from "@/content/pending"
import { useContent } from "@/lib/content"
import { useEffect, useState, type ReactNode } from "react"
import { Link, useLocation } from "react-router-dom"
import { AskUs } from "@/components/ask-us"
import { getQuestions, type Asked } from "@/lib/api"
import { ART } from "@/lib/art"
import { config } from "@/lib/config"

/** FAQs: one numbered accordion (numbers help guests point to a question when they message). Answers are body.
 * Who to contact on the day appears once Griffin and Nadia fill contact_day in the Content tab. */
export function FaqsPage() {
  const { t, lang } = useLang()
  const { contactDay } = useContent()
  // A link to one question (#q3, from Ask us's "Is this it?") opens it
  const { hash } = useLocation()
  const [open, setOpen] = useState(() => (/^#q\d+$/.test(location.hash) ? location.hash.slice(1) : ""))
  useEffect(() => { if (/^#q\d+$/.test(hash)) { setOpen(hash.slice(1)); requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView({ block: "start" })) } }, [hash])
  const [asked, setAsked] = useState<Asked[]>([])
  useEffect(() => { void getQuestions().then(setAsked) }, [])
  return (
    <>
      <PageHeader title={t.qa.title} lettering="faqs" />
      <Disclosure label={t.qa.title} value={open} onValueChange={setOpen}>
        {t.qa.items.map((item, i) => (
          <AccordionItem key={item.q} value={`q${i}`} id={`q${i}`}>
            <AccordionTrigger>
              <span className="flex items-baseline gap-4">
                <span aria-hidden className="numerals w-6 shrink-0 text-primary">{String(i + 1).padStart(2, "0")}</span>
                <span><span className="sr-only">{i + 1}. </span>{item.q}</span>
              </span>
            </AccordionTrigger>
            <AccordionContent><p className="pl-10">{withLinks(item.a)}</p></AccordionContent>
          </AccordionItem>
        ))}
      </Disclosure>
      {/* Questions Griffin and Nadia have answered for someone and published (Ask us, the Questions tab) */}
      {asked.length > 0 && <section aria-labelledby="you-asked" className="flex flex-col gap-3">
        <h2 id="you-asked" className="font-display text-heading text-foreground">{pending("ask.youAsked", lang)}</h2>
        <Disclosure label={pending("ask.youAsked", lang)}>
          {asked.map((x, i) => (
            <AccordionItem key={x.q} value={`a${i}`}>
              <AccordionTrigger>{x.q}</AccordionTrigger>
              <AccordionContent><p className="whitespace-pre-line">{lang === "ja" && x.a_ja ? x.a_ja : x.a}</p></AccordionContent>
            </AccordionItem>
          ))}
        </Disclosure>
      </section>}
      <div className="flex flex-col gap-1">
        <p>{t.qa.contact}</p>
        <AskUs><button type="button" className="btn-text inline-flex min-h-11 items-center self-start">{pending("ask.button", lang)}</button></AskUs>
      </div>
      <p className="text-small">{contactDay ? `${t.qa.onTheDay} ${contactDay}` : pending("faqs.contactDay", lang)}</p>
    </>
  )
}

/** Links in the answers. In "Who made this site?" the song's title links to the track (config.links.music, run 26),
 *  and Jehan's name, quietly, to his LinkedIn (run 26c: the same link as the laptop's credit seal). Run 27: a mention of
 *  another part of the site goes there ("Travel"), and "Ask us" opens Ask us. */
function withLinks(a: string) {
  const music = a.includes(ART.music.title)
  const links: [string, (name: string) => ReactNode][] = [
    ...(music ? [
      [ART.music.title, (n: string) => config.links.music && <a key={n} href={config.links.music} target="_blank" rel="noreferrer" className="btn-text">{n}</a>],
      [/ジェハン/.test(a) ? "ジェハン" : "Jehan", (n: string) => config.links.jehan && <a key={n} href={config.links.jehan} target="_blank" rel="noreferrer" className="credit-link">{n}</a>],
    ] as [string, (n: string) => ReactNode][] : []),
    ...(["Travel", "アクセス"].map((n) => [n, () => <Link key={n} to="/travel" className="btn-text">{n}</Link>]) as [string, () => ReactNode][]),
    ...(["Ask us", "質問する"].map((n) => [n, () => <AskUs key={n}><button type="button" className="btn-text">{n}</button></AskUs>]) as [string, () => ReactNode][]),
  ]
  const parts: ReactNode[] = []
  let rest = a
  for (const [name, make] of links.map((l) => [a.indexOf(l[0]), l] as const).filter(([at]) => at >= 0).sort(([x], [y]) => x - y).map(([, l]) => l)) {
    const at = rest.indexOf(name), node = at < 0 ? null : make(name)
    if (!node) continue
    parts.push(rest.slice(0, at), node)
    rest = rest.slice(at + name.length)
  }
  return parts.length ? <>{parts}{rest}</> : a
}
