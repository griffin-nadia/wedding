import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { useLang } from "@/lib/lang"
import { Stage } from "../../stage"

/**
 * Experiment: "Ask us" at the end of FAQs. Type a question; the box finds the closest FAQs by plain word matching
 * (no AI, nothing leaves the page) and shows their answers. Nothing close: a short message form to Griffin and
 * Nadia instead. In the lab nothing is sent: the form shows what would go.
 */
const css = `
.x-ask { display: flex; flex-direction: column; gap: var(--space-4); width: min(100%, 560px); padding: var(--space-6); border-radius: var(--letter-radius); background: var(--letter-bg); color: var(--ink-soft); box-shadow: var(--elevation-paper); }
.x-ask h2 { margin: 0; font-family: var(--font-display); font-size: var(--type-heading-size); color: var(--ink); }
.x-ask-hit { display: flex; flex-direction: column; gap: var(--space-1); padding: var(--space-3) var(--space-4); border-radius: var(--radius-control); background: color-mix(in oklab, var(--surface-raised) 60%, transparent); }
.x-ask-hit b { color: var(--ink); font-weight: 500; }
.x-ask-note { font-size: var(--type-small-size); color: var(--ink-muted); }
`
// Words that say nothing about the question
const STOP = new Set("a an and are at be can do does for how i if in is it me my of on or should the to we what when where who why will with you your".split(" "))
const words = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w)).map((w) => w.replace(/(ing|es|s)$/, ""))

export default function FaqsAskUs() {
  const { t } = useLang()
  const [q, setQ] = useState("")
  const [message, setMessage] = useState("")
  const [shown, setShown] = useState(false)
  // Each FAQ scored by the question's words found in it (its question counts double)
  const hits = useMemo(() => {
    const want = words(q)
    if (!want.length) return []
    return t.qa.items
      .map((it) => { const qw = words(it.q), aw = words(it.a); return { it, score: want.reduce((n, w) => n + (qw.includes(w) ? 2 : 0) + (aw.includes(w) ? 1 : 0), 0) } })
      .filter((h) => h.score >= 2).sort((a, b) => b.score - a.score).slice(0, 3)
  }, [q, t])
  return (
    <Stage photo hint="Try: what shoes should I wear · visa · can my partner come · how do I get from Osaka">
      <style>{css}</style>
      <section className="x-ask" aria-labelledby="x-ask-title">
        <h2 id="x-ask-title">Ask us</h2>
        <label className="flex flex-col gap-2"><span className="text-small">Your question</span>
          <input className="state field" value={q} onChange={(e) => { setQ(e.target.value); setShown(false) }} placeholder="Type a question" /></label>
        <div aria-live="polite" className="flex flex-col gap-3">
          {hits.map(({ it }) => <div key={it.q} className="x-ask-hit"><b>{it.q}</b><span>{it.a}</span></div>)}
          {q.trim().length > 3 && !hits.length && (
            <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); setShown(true) }}>
              <p>Nothing in the FAQs yet. Send it to Griffin and Nadia?</p>
              <textarea className="state field min-h-24" value={message || q} onChange={(e) => setMessage(e.target.value)} aria-label="Your message" />
              <Button type="submit" size="md" className="self-start">Send to Griffin &amp; Nadia</Button>
              {shown && <p className="x-ask-note" role="status">Lab: nothing sent. On the site this would email griffinandnadia@gmail.com with your household's name and this message, through the same queue as replies.</p>}
            </form>
          )}
        </div>
        <p className="x-ask-note">Matches by the words in the FAQs only. No AI, and nothing you type leaves this page until you send.</p>
      </section>
    </Stage>
  )
}
