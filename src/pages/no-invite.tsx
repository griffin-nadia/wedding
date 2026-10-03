import { useState } from "react"
import { Button } from "@/components/ui/button"
import { InlineSubmit } from "@/components/inline-submit"
import { ApiError, resendLink } from "@/lib/api"
import { useHousehold } from "@/lib/household"
import { useLang } from "@/lib/lang"
import { useTheme } from "@/lib/theme"
import { sceneFor } from "@/lib/scenes"
import { Scene } from "@/components/letter/scene"
import { Letter, SignOff } from "@/components/letter/letter"

/** What people see without a working invite: no link, a link we don't know, or no connection. */
export function NoInvitePage({ reason }: { reason: "missing" | "unknown" | "error" }) {
  const { t } = useLang()
  const { retry } = useHousehold()
  const { theme } = useTheme()
  const copy = reason === "error" ? t.offline : reason === "unknown" ? t.unknown : t.notFound
  return (
    <>
      <Scene source={sceneFor("home", theme)} />
      <main className="letter-wrap">
        <Letter id="letter">
          <div className="letter-body">
            <p className="label-caps text-muted-foreground">{t.home.label}</p>
            <h1 className="heading">{copy.title}</h1>
            <p>{copy.body}</p>
            {reason === "error" ? <Button size="lg" className="self-start" onClick={retry}>{t.offline.retry}</Button> : <ResendForm />}
          </div>
          <SignOff />
        </Letter>
      </main>
    </>
  )
}

/** Email in, link out. The answer is the same whether or not the email is on the list. */
function ResendForm() {
  const { t } = useLang()
  const [email, setEmail] = useState("")
  const [state, setState] = useState<"idle" | "sending" | "sent" | "bad" | "failed">("idle")
  async function send(e?: React.FormEvent) {
    e?.preventDefault()
    if (state === "sending") return
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setState("bad")
    setState("sending")
    try {
      await resendLink(email)
      setState("sent")
    } catch (err) {
      setState(err instanceof ApiError && err.code === "bad_email" ? "bad" : "failed")
    }
  }
  if (state === "sent") return <p role="status" className="rounded-md bg-section-alt p-4">{t.notFound.sent}</p>
  return (
    <form onSubmit={send} noValidate>
      <InlineSubmit id="resend-email" type="email" inputMode="email" autoComplete="email" maxLength={120} value={email}
        label={t.notFound.emailLabel} helper={t.notFound.helper} submitLabel={t.notFound.send} busy={state === "sending"}
        error={state === "bad" ? t.notFound.badEmail : state === "failed" ? t.notFound.failed : undefined}
        onChange={(e) => { setEmail(e.target.value); if (state !== "sending") setState("idle") }}
        onSubmit={() => void send()} fallback={{ label: t.notFound.message, onClick: () => { window.location.href = "mailto:griffinandnadia@gmail.com" } }} />
    </form>
  )
}
