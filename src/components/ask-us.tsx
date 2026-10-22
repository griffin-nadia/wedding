import { useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import { Sheet, SheetBody, SheetContent, SheetHead, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { FormField } from "@/components/ui/field"
import { ApiError, askUs, sendFeedback } from "@/lib/api"
import { matchFaqs } from "@/lib/faq-match"
import { useHousehold } from "@/lib/household"
import { useLang } from "@/lib/lang"
import { pending } from "@/content/pending"

const ASK_MAX = 500, FEEDBACK_MAX = 1000
const ADDRESS = "griffinandnadia@gmail.com"

/**
 * Ask us (final run): everywhere the site used to say "email Griffin & Nadia". One sheet with one question (500
 * characters at most). As they type, up to three of the site's own FAQs that look like it show under "Is this it?";
 * tapping one opens it in the FAQs, and sending is still one tap away. From an invite the household is known;
 * without one (can't find your invite) a name and an email come too. A hidden field catches bots. If the back end
 * can't be reached, the email address is the way instead (and it's still the help line on the day).
 * feedback (run 21, review links only): the same sheet as Feedback, up to 1,000 characters, no FAQ matches, sent with
 * the page, theme, screen size and language it was left on.
 */
export function AskUs({ children, feedback = false }: { children: ReactNode; feedback?: boolean }) {
  const { t, lang } = useLang()
  const { household } = useHousehold()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [question, setQuestion] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [website, setWebsite] = useState("")
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed" | "busy" | "bad">("idle")
  const MAX = feedback ? FEEDBACK_MAX : ASK_MAX
  const matches = feedback ? [] : matchFaqs(t.qa.items, question)
  const anonymous = !household
  const send = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (state === "sending" || !question.trim()) return
    if (anonymous && (!name.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()))) return setState("bad")
    setState("sending")
    try {
      if (feedback && household) await sendFeedback({ token: household.token, note: question.trim(), page: location.pathname.replace(import.meta.env.BASE_URL, "/"), theme: document.documentElement.getAttribute("data-theme") ?? "", viewport: `${innerWidth}x${innerHeight}`, lang })
      else await askUs({ question: question.trim(), website, ...(household ? { token: household.token } : { name: name.trim(), email: email.trim() }) })
      setState("sent")
    } catch (err) {
      setState(err instanceof ApiError && err.code === "busy" ? "busy" : err instanceof ApiError && err.code === "bad_email" ? "bad" : "failed")
    }
  }
  const openFaq = (i: number) => { setOpen(false); navigate(`/faqs#q${i}`) }
  return (
    <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (o && state === "sent") { setQuestion(""); setState("idle") } }}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent aria-describedby={undefined} className="sheet-fit">
        <SheetHead><SheetTitle className="heading outline-none">{feedback ? t.preview.feedbackTitle : pending("ask.title", lang)}</SheetTitle></SheetHead>
        <SheetBody>
          {state === "sent" ? <p role="status" className="rounded-md bg-section-alt p-4">{feedback ? t.preview.feedbackSent : pending("ask.sent", lang)}</p> : (
            <form onSubmit={send} noValidate className="flex flex-col gap-(--form-group-gap)">
              <FormField id="ask-q" label={feedback ? t.preview.feedbackLabel : pending("ask.label", lang)} help={`${feedback ? t.preview.feedbackHelp : pending("ask.help", lang)} ${question.length}/${MAX}`}>
                <Textarea id="ask-q" rows={3} maxLength={MAX} value={question} autoCapitalize="sentences" aria-describedby="ask-q-help" data-filled={Boolean(question.trim())} onChange={(e) => { setQuestion(e.target.value); if (state !== "sending") setState("idle") }} />
              </FormField>
              {matches.length > 0 && (
                <section aria-labelledby="ask-match" className="flex flex-col gap-2">
                  <h3 id="ask-match" className="label-caps text-muted-foreground">{pending("ask.isThis", lang)}</h3>
                  <ul className="flex flex-col gap-1">
                    {matches.map((i) => <li key={i}><button type="button" className="ask-match" onClick={() => openFaq(i)}>{t.qa.items[i].q}</button></li>)}
                  </ul>
                </section>
              )}
              {anonymous && <>
                <FormField id="ask-name" label={pending("ask.name", lang)}><Input id="ask-name" value={name} maxLength={60} autoComplete="name" onChange={(e) => setName(e.target.value)} /></FormField>
                <FormField id="ask-email" label={pending("ask.email", lang)} help={pending("ask.emailHelp", lang)}><Input id="ask-email" type="email" inputMode="email" autoComplete="email" autoCapitalize="off" spellCheck={false} maxLength={120} value={email} aria-describedby="ask-email-help" onChange={(e) => setEmail(e.target.value)} /></FormField>
              </>}
              {/* Only a bot fills this in (it's off screen and out of the tab order) */}
              <label className="ask-pot" aria-hidden>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} /></label>
              {state === "bad" && <p role="alert" className="text-small text-destructive">{t.notFound.badEmail}</p>}
              {state === "busy" && <p role="alert" className="text-small text-destructive">{pending("ask.busy", lang)}</p>}
              {state === "failed" && <p role="alert" className="text-small text-destructive">{pending("ask.failed", lang)} <a href={`mailto:${ADDRESS}`} className="btn-text">{ADDRESS}</a></p>}
              <Button type="submit" size="md" className="self-start" disabled={state === "sending" || !question.trim()}>{state === "sending" ? t.notFound.sending : pending("ask.send", lang)}</Button>
            </form>
          )}
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}
