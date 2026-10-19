import { useState } from "react"
import { Button } from "@/components/ui/button"
import { InlineSubmit } from "@/components/inline-submit"
import { ApiError, resendLink } from "@/lib/api"
import { AskUs } from "@/components/ask-us"
import { pending } from "@/content/pending"
import { useHousehold } from "@/lib/household"
import { useLang } from "@/lib/lang"
import { useTheme } from "@/lib/theme"
import { sceneFor } from "@/lib/scenes"
import { Scene } from "@/components/letter/scene"
import { Letter, SignOff } from "@/components/letter/letter"

/** What people see without a working invite: no link, a link we don't know, or no connection. */
export function NoInvitePage({ reason }: { reason: "missing" | "unknown" | "error" | "paused" | "trouble" }) {
  const { t } = useLang()
  const { retry } = useHousehold()
  const { theme } = useTheme()
  const copy = reason === "paused" ? t.paused : reason === "trouble" ? t.trouble : reason === "error" ? t.offline : reason === "unknown" ? t.unknown : t.notFound
  return (
    <>
      <Scene source={sceneFor(theme)} />
      <main className="letter-wrap">
        <Letter id="letter" data-page="home">
          {/* The same frame as every page: the words scroll in here, and the card fits them */}
          <div className="letter-scroll">
          <div className="letter-body">
            <p className="label-caps text-muted-foreground">{t.home.label}</p>
            <h1 className="heading">{copy.title}</h1>
            <p>{copy.body}</p>
            {reason === "error" || reason === "paused" || reason === "trouble" ? <Button size="md" className="self-start" onClick={retry}>{reason === "paused" ? t.paused.retry : reason === "trouble" ? t.trouble.retry : t.offline.retry}</Button> : <ResendForm />}
          </div>
          <SignOff />
          </div>
        </Letter>
      </main>
    </>
  )
}

/** Email in, link out. The answer is the same whether or not the email is on the list. */
function ResendForm() {
  const { t, lang } = useLang()
  const [email, setEmail] = useState("")
  const [state, setState] = useState<"idle" | "sending" | "sent" | "bad" | "failed" | "paused">("idle")
  async function send(e?: React.FormEvent) {
    e?.preventDefault()
    if (state === "sending") return
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setState("bad")
    setState("sending")
    try {
      await resendLink(email)
      setState("sent")
    } catch (err) {
      // Only a real failure to reach us is an error; anything the back end says (held, busy, paused) gets the same
      // neutral line, so it never reveals who's invited or that mail is waiting
      setState(err instanceof ApiError && err.code === "bad_email" ? "bad" : err instanceof ApiError && err.code === "network" ? "failed" : "sent")
    }
  }
  if (state === "sent") return <p role="status" className="rounded-md bg-section-alt p-4">{t.notFound.sent}</p>
  return (
    <form onSubmit={send} noValidate>
      <InlineSubmit id="resend-email" type="email" inputMode="email" autoComplete="email" enterKeyHint="send" autoCapitalize="off" spellCheck={false} maxLength={120} value={email}
        label={t.notFound.emailLabel} helper={t.notFound.helper} submitLabel={t.notFound.send} busy={state === "sending"}
        error={state === "bad" ? t.notFound.badEmail : state === "failed" ? t.notFound.failed : state === "paused" ? t.paused.line : undefined}
        onChange={(e) => { setEmail(e.target.value); if (state !== "sending") setState("idle") }}
        onSubmit={() => void send()} />
      {/* Or ask them directly (no invite, so the sheet asks for a name and an email too) */}
      <AskUs><button type="button" className="btn-text mt-3 inline-flex min-h-11 items-center">{pending("ask.open", lang)}</button></AskUs>
    </form>
  )
}
