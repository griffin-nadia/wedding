import { useLang } from "@/lib/lang"

/**
 * A small drawn map (ours, not a map embed): Kyoto Station to Gion-Shijo to the venue, the Kamo
 * river and the eastern hills. Stylised, not to scale. Lines in moss and ink, the venue as the hanko.
 */
export function VenueMap() {
  const { t } = useLang()
  return (
    <figure className="flex flex-col gap-2">
      <svg viewBox="0 0 320 200" role="img" aria-label={t.day.mapAlt} className="w-full rounded-md border bg-section-alt">
        {/* eastern hills */}
        <path d="M200 40 C 230 20, 260 30, 280 18 S 320 24, 320 24 L320 0 L200 0 Z" fill="var(--sys-moss)" opacity="0.25" />
        {/* Kamo river */}
        <path d="M150 0 C 145 50, 160 90, 150 130 S 140 180, 146 200" fill="none" stroke="var(--sys-moss)" strokeWidth="6" strokeLinecap="round" opacity="0.5" />
        {/* the way: station, north to Shijo, east to the venue */}
        <path d="M70 172 L70 120 L118 104 L210 104 L240 84" fill="none" stroke="var(--sys-ink-soft)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="58" y="172" width="24" height="12" rx="2" fill="var(--sys-ink)" />
        <text x="70" y="196" textAnchor="middle" className="fill-foreground font-label text-[11px]">{t.day.mapStation}</text>
        <text x="120" y="96" textAnchor="middle" className="fill-foreground font-label text-[11px]">{t.day.mapGion}</text>
        <circle cx="240" cy="84" r="11" fill="var(--sys-accent)" />
        <text x="240" y="88" textAnchor="middle" className="fill-[var(--sys-accent-ink)] font-display text-[11px]">N&amp;G</text>
        <text x="256" y="112" className="fill-foreground font-label text-[11px]">{t.day.mapVenue}</text>
      </svg>
    </figure>
  )
}
