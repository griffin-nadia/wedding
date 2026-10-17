import { useState } from "react"
import { Hanko } from "@/components/hanko"

/**
 * Experiment: the hanko on "RSVP sent". The reply card says Sent, and the 京 seal stamps onto it (the site's
 * hanko-stamp: the one bounce on the site). Tap Send again to replay. Still under reduced motion.
 */
export default function HankoSent() {
  const [n, setN] = useState(0)
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-5 rounded-(--radius-section) bg-section-alt p-5">
        {n > 0 && <Hanko key={n} stamp />}
        <div className="flex flex-col gap-1"><p className="heading">{n ? "Sent, thank you" : "Ready to send"}</p><p className="text-small text-muted-foreground">Your reply goes only to Griffin and Nadia.</p></div>
      </div>
      <button type="button" className="btn-primary h-(--button-height) self-start rounded-(--button-radius) px-(--button-pad) font-label font-medium" onClick={() => setN(n + 1)}>Send</button>
    </div>
  )
}
