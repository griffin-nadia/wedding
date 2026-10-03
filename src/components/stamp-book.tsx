import { useEffect, useState } from "react"
import { Dialog } from "radix-ui"
import { BookMarked, X } from "lucide-react"
import { useLocation } from "react-router-dom"
import { BrandSeal } from "@/components/brand-seal"
import { Hanko } from "@/components/hanko"
import { useHousehold } from "@/lib/household"
import { useLang } from "@/lib/lang"
import { pageOf } from "@/lib/scenes"
import { saveStamps } from "@/lib/api"
import { cn } from "@/lib/utils"

/** The five stops of the walk (concept B): the inn (Home), the garden gate (The day), the station (Travel), the shrine (FAQs), the lane (Our story). */
export const STOPS = ["home", "day", "travel", "qa", "story"] as const
const TINT: Record<string, string> = { home: "var(--brand-sabi)", day: "var(--brand-koke)", travel: "var(--brand-kabocha)", qa: "var(--brand-doro)", story: "var(--brand-hachimitsu)" }
const key = (token: string) => `ng-stamps-${token}`
const read = (token: string): string[] => { try { return JSON.parse(localStorage.getItem(key(token)) || "[]") } catch { return [] } }

/**
 * Stamp book (concept B hook, behind the lab switch): a stamp per stop visited plus the hanko for
 * replying, kept on the device and in the household's Stamps column. Nothing is timed, gated or scored.
 */
export function StampBook() {
  const { t } = useLang()
  const { household } = useHousehold()
  const { pathname } = useLocation()
  const token = household?.token ?? ""
  const [stamps, setStamps] = useState<string[]>(() => (token ? read(token) : []))
  useEffect(() => {
    if (!token) return
    const stop = pageOf(pathname)
    const now = read(token)
    if ((STOPS as readonly string[]).includes(stop) && !now.includes(stop)) {
      const next = [...now, stop]
      try { localStorage.setItem(key(token), JSON.stringify(next)) } catch { /* private mode */ }
      setStamps(next)
      void saveStamps(token, next)
    } else setStamps(now)
  }, [pathname, token])
  const replied = Boolean(household?.respondedAt)
  return (
    <Dialog.Root>
      <Dialog.Trigger className="utility-btn press stamp-trigger" aria-label={t.stamps.open}><BookMarked className="size-5" aria-hidden /></Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="rsvp-overlay" />
        <Dialog.Content className="letter paper rsvp-letter" aria-describedby={undefined} onPointerDownOutside={(e) => e.preventDefault()}>
          <Dialog.Close className="rsvp-close press" aria-label={t.rsvp.close}><X className="size-5" aria-hidden /></Dialog.Close>
          <div className="rsvp-head flex flex-col gap-2">
            <Dialog.Title className="heading">{t.stamps.title}</Dialog.Title>
            <p className="text-sm">{t.stamps.help}</p>
          </div>
          <div className="rsvp-body">
            <ul className="grid grid-cols-3 gap-4">
              {STOPS.map((s) => {
                const got = stamps.includes(s)
                return (
                  <li key={s} className={cn("stamp-slot", got && "is-got")}>
                    <span style={{ ["--stamp" as string]: TINT[s] }} className="stamp-ink">{got ? <BrandSeal className="size-14" /> : null}</span>
                    <span className="text-sm">{t.stamps.stops[s]}</span>
                  </li>
                )
              })}
              <li className={cn("stamp-slot", replied && "is-got")}>
                <span className="stamp-ink">{replied ? <Hanko size="sm" /> : null}</span>
                <span className="text-sm">{t.stamps.reply}</span>
              </li>
            </ul>
            {stamps.length === STOPS.length && replied && <p className="hand mt-6">{t.stamps.full}</p>}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
