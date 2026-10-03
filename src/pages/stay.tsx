import { useLang } from "@/lib/lang"

/** Where to stay: three areas with what's good and what to keep in mind, and one map link. */
export function StayPage() {
  const { t } = useLang()
  return (
    <>
      <header className="flex flex-col gap-4">
        <h1 className="heading">{t.stay.title}</h1>
        <p>{t.stay.intro}</p>
      </header>
      <ul className="flex flex-col divide-y divide-border border-y">
        {t.day.stay.map((a) => (
          <li key={a.label} className="flex flex-col gap-2 py-4">
            <h2 className="font-sans text-base font-semibold text-foreground">{a.label}</h2>
            <p><span className="label-caps mr-2 text-success">{t.day.stayGood}</span>{a.good}</p>
            <p><span className="label-caps mr-2 text-muted-foreground">{t.day.stayWatch}</span>{a.watch}</p>
          </li>
        ))}
      </ul>
      <a href={t.stay.mapHref} target="_blank" rel="noreferrer" className="btn-text inline-flex min-h-11 items-center self-start">{t.stay.mapLink}</a>
    </>
  )
}
