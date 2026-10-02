import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ApiError, resendLink } from "@/lib/api"
import { useHousehold } from "@/lib/household"
import { useLang } from "@/lib/lang"

/** What people see without a working invite: no link, a link we don't know, or no connection. */
export function NoInvitePage({ reason }: { reason: "missing" | "unknown" | "error" }) {
  const { t } = useLang()
  const { retry } = useHousehold()
  const copy = reason === "error" ? t.offline : reason === "unknown" ? t.unknown : t.notFound
  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-18 text-center">
      <p className="eyebrow">{t.meta.eyebrow}</p>
      <h1 className="title">{copy.title}</h1>
      <p className="text-body">{copy.body}</p>
      {reason === "error" ? <Button size="lg" onClick={retry}>{t.offline.retry}</Button> : <ResendForm />}
    </div>
  )
}

/** Email in, link out. The answer is the same whether or not the email is on the list. */
function ResendForm() {
  const { t } = useLang()
  const [email, setEmail] = useState("")
  const [state, setState] = useState<"idle" | "sending" | "sent" | "bad" | "failed">("idle")
  async function send(e: React.FormEvent) {
    e.preventDefault()
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
  if (state === "sent") return <p role="status" className="hand rounded-[1.25rem] bg-card p-4 text-left text-body shadow-paper ring-1 ring-border">{t.notFound.sent}</p>
  return (
    <form onSubmit={send} noValidate className="space-y-3 rounded-[1.25rem] bg-card p-4 text-left shadow-paper ring-1 ring-border">
      <Label htmlFor="resend-email">{t.notFound.emailLabel}</Label>
      <Input id="resend-email" type="email" inputMode="email" autoComplete="email" value={email} maxLength={120}
        aria-invalid={state === "bad"} aria-describedby={state === "bad" || state === "failed" ? "resend-error" : undefined}
        onChange={(e) => { setEmail(e.target.value); if (state !== "sending") setState("idle") }} />
      {(state === "bad" || state === "failed") && (
        <p id="resend-error" role="alert" className="text-sm text-destructive">{state === "bad" ? t.notFound.badEmail : t.notFound.failed}</p>
      )}
      <Button type="submit" size="lg" className="w-full" disabled={state === "sending"} aria-busy={state === "sending"}>
        {state === "sending" ? t.notFound.sending : t.notFound.send}
      </Button>
    </form>
  )
}
