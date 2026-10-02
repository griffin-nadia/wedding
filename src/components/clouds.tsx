/** Soft clouds behind the hero for the optional painted Kyoto look (hidden unless data-look="painted"). */
export function Clouds() {
  return (
    <div aria-hidden className="clouds pointer-events-none absolute inset-0 -z-0 overflow-hidden">
      <svg viewBox="0 0 600 200" className="cloud absolute top-6 -left-20 w-[34rem] opacity-60">
        <path d="M40 140c-30 0-40-40-10-50 0-30 40-45 70-25 15-35 75-40 100-5 30-20 80-5 80 30 35 0 45 50 5 50z" fill="var(--card)" />
      </svg>
      <svg viewBox="0 0 600 200" className="cloud cloud-2 absolute top-28 -right-24 w-[28rem] opacity-50">
        <path d="M60 150c-35 0-45-45-8-55 5-30 50-40 72-18 22-30 80-28 95 8 35-10 70 10 62 45 30 5 30 40-5 40z" fill="var(--card)" />
      </svg>
    </div>
  )
}
