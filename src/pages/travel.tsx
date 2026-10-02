import { Card, CardContent } from "@/components/ui/card"
import { useLang } from "@/lib/lang"

export function TravelPage() {
  const { t } = useLang()
  return (
    <div className="max-w-2xl space-y-6 py-6 md:py-16">
      <header className="space-y-2">
        <h1 className="text-4xl md:text-6xl">{t.travel.title}</h1>
        <p className="text-body">{t.travel.lead}</p>
      </header>
      <div className="space-y-3">
        {t.travel.items.map((item) => (
          <Card key={item.title}>
            <CardContent className="space-y-2">
              <h2 className="font-sans text-base font-bold">{item.title}</h2>
              <p className="text-sm text-body">{item.body}</p>
              {"links" in item && item.links && (
                <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  {item.links.map((l) => (
                    <li key={l.href}><a className="text-primary underline underline-offset-4" href={l.href} target="_blank" rel="noreferrer">{l.label}</a></li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
