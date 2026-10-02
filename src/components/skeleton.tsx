/** First-visit placeholder in the shape of the greeting and RSVP card. Never a blank page. */
export function InviteSkeleton({ label }: { label: string }) {
  const bar = "washi rounded-md bg-muted"
  return (
    <div className="skeleton-wait min-h-dvh">
      <div className="mx-auto flex max-w-[60rem] items-center justify-between px-4 py-3 md:px-8 md:py-4">
        <span className="font-display text-xl">N&amp;G</span>
      </div>
      <main className="mx-auto max-w-[60rem] px-4 md:px-8" role="status" aria-live="polite">
        <span className="sr-only">{label}</span>
        <div aria-hidden className="max-w-xl space-y-6 py-6 md:py-12">
          <div className={`${bar} h-3 w-56`} />
          <div className={`${bar} h-12 w-64 md:h-16`} />
          <div className={`${bar} h-4 w-72`} />
          <div className="space-y-2">
            <div className={`${bar} h-5 w-full`} />
            <div className={`${bar} h-5 w-11/12`} />
            <div className={`${bar} h-5 w-2/3`} />
          </div>
          <div className="space-y-3 rounded-xl border bg-card p-6 shadow-paper">
            <div className={`${bar} h-3 w-24`} />
            <div className={`${bar} h-7 w-40`} />
            <div className={`${bar} h-4 w-52`} />
            <div className={`${bar} h-11 w-full md:w-56`} />
          </div>
        </div>
      </main>
    </div>
  )
}
