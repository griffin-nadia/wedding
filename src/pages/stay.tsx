import { useLang } from "@/lib/lang"

/** Where to stay: three areas with what's good and what to keep in mind, and one map link. */
export function StayPage() {
  const { t } = useLang()
  return (
    <>
      <h1 className="heading">{t.stay.title}</h1>
      <p>{t.day.stayIntro}</p>
    </>
  )
}
