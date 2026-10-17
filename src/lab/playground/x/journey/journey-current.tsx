import { GuestMap } from "@/components/journey-mini"
import { Letter } from "@/components/letter/letter"
import { useLang } from "@/lib/lang"

/**
 * The journey map as the site has it today: GuestMap (JourneyMini, the legend and See as a list) on a letter.
 * The household's own line comes from Brisbane as an example. No guest counts: those are real data, so none are made up.
 */
const css = `
.x-journey-current { min-height: 100svh; display: grid; place-items: center; padding: 24px 16px; background: var(--surface-alt); }
.x-journey-current .x-journey-current-letter { min-height: 0; height: auto; position: relative; width: 100%; max-width: 620px; display: flex; flex-direction: column; gap: 16px; }
`
export default function JourneyCurrent() {
  const { t } = useLang()
  return (
    <div className="x-journey-current">
      <style>{css}</style>
      <Letter className="x-journey-current-letter">
        <h1 className="heading">{t.journey.title}</h1>
        <GuestMap you="Brisbane" flying={null} label={t.journey.map(t.journey.brisbane, "Brisbane")} />
      </Letter>
    </div>
  )
}
