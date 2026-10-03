import { useEffect, useState } from "react"
import { useLang } from "@/lib/lang"
import { useHousehold } from "@/lib/household"
import { Qr } from "@/components/qr"

/** From 1360 only, where it fits beside the letter (never on phones): a small "Open on your phone" card at the bottom right of the scene. */
export function PhoneQr() {
  const { t } = useLang()
  const { household } = useHousehold()
  const [wide, setWide] = useState(() => window.matchMedia("(min-width: 1360px)").matches)
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1360px)")
    const on = () => setWide(mq.matches)
    mq.addEventListener("change", on)
    return () => mq.removeEventListener("change", on)
  }, [])
  if (!wide || !household) return null
  const url = `${location.origin}${import.meta.env.BASE_URL}?h=${household.token}`
  return (
    <aside aria-label={t.letter.phoneTitle} className="phone-qr">
      <Qr value={url} label={t.letter.phoneTitle} className="size-24 shrink-0 text-foreground" />
      <div className="flex flex-col gap-1">
        <p className="label-caps text-foreground">{t.letter.phoneTitle}</p>
        <p className="text-sm">{t.letter.phoneBody}</p>
      </div>
    </aside>
  )
}
