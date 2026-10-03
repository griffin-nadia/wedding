import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { ArrowRight, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Chip, FieldError, ReviewRow, Seal, Skeleton, StepProgress } from "@/components/blocks"
import { Pill } from "@/components/pill"
import { Hanko } from "@/components/hanko"
import { CountdownTile } from "@/components/countdown"
import { FortuneCard } from "@/components/fortune-card"
import { DriverCard } from "@/components/driver-card"
import { SoundToggle } from "@/components/sound-toggle"
import { InlineSubmit } from "@/components/inline-submit"
import { SongPicker } from "@/components/song-picker"
import { toast } from "@/components/toast"
import { COUPLE } from "@/content/en"
import { useLang } from "@/lib/lang"
import { SCENES } from "@/lib/scenes"
import { tuneEnabled, TuneLauncher } from "@/tune/launcher"
import { cn } from "@/lib/utils"

/**
 * The design system, as a small hidden site (/kit, not linked anywhere): foundations and every
 * component on its own page, in Light and Lantern side by side, every state shown at once.
 * "Adjust" opens the tuning panel (dev, or VITE_TUNE builds) so changes show here and on the site.
 */
type Page = { id: string; name: string; render: () => ReactNode; purpose: string; tokens?: string }
type Group = { group: string; pages: Page[] }

const STATES = ["default", "hover", "focus", "pressed", "selected", "disabled", "error"] as const

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[96px_1fr] items-center gap-4 border-b border-border py-3 last:border-b-0">
      <span className="label-caps text-muted-foreground">{label}</span>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  )
}

const force = (s: string) => (s === "hover" || s === "focus" || s === "pressed" ? { "data-force": s } : {})

const GROUPS: Group[] = [
  {
    group: "Foundations",
    pages: [
      { id: "overview", name: "Overview", purpose: "Scene behind, letter in front. One surface, three type sizes, one state system, paper motion.", render: () => <Overview /> },
      { id: "colour", name: "Colour", purpose: "Brand tokens are Nadia's palette. System tokens say what each colour is for, per mode. Components only use system tokens.", render: () => <Colour /> },
      { id: "type", name: "Type", purpose: "Display (names, numerals), heading and body are separate scales. Content from the sheet is always body.", render: () => <Type /> },
      { id: "space", name: "Space and radius", purpose: "4px grid, 8px vertical rhythm. Radius 4 chips and inputs, 8 cards, 12 buttons, 24 the letter.", render: () => <Space /> },
      { id: "motion", name: "Motion and delight", purpose: "Paper rises and settles. One signature moment per screen, always with a still version.", render: () => <Motion /> },
    ],
  },
  {
    group: "Inputs",
    pages: [
      { id: "button", name: "Button", tokens: "--button-*", purpose: "One primary per screen. Outline for second actions, text for quiet ones.", render: () => (
        <>
          {STATES.filter((s) => s !== "selected" && s !== "error").map((s) => (
            <Row key={s} label={s}>
              <Button size="lg" disabled={s === "disabled"} {...force(s)}>RSVP by 15 Feb</Button>
              <Button size="lg" variant="outline" disabled={s === "disabled"} {...force(s)}>Back</Button>
              <button type="button" className="btn-text min-h-11" disabled={s === "disabled"} {...force(s)}>Change my reply</button>
            </Row>
          ))}
          <Row label="loading"><Button size="lg" aria-busy>Sending…</Button></Row>
        </>
      ) },
      { id: "field", name: "Text field", tokens: "--input-*", purpose: "Label above, 52 tall on phones and 48 from 768, 4px radius, moss tick when filled, caret in the accent.", render: () => (
        <>
          {(["default", "hover", "focus", "filled", "disabled", "error"] as const).map((s) => (
            <Row key={s} label={s}>
              <div className="flex w-full max-w-sm flex-col gap-2">
                <label className="label-caps text-foreground" htmlFor={`f-${s}`}>Bringing someone? Their name</label>
                <Input id={`f-${s}`} defaultValue={s === "filled" || s === "error" ? "Robin" : ""} placeholder={s === "default" ? "" : undefined} data-filled={s === "filled"}
                  disabled={s === "disabled"} aria-invalid={s === "error" || undefined} {...force(s)} />
                <FieldError id={`f-${s}-err`}>{s === "error" ? "Pick or type what Sam is allergic to." : undefined}</FieldError>
              </div>
            </Row>
          ))}
          <Row label="textarea"><Textarea className="max-w-sm" placeholder="Anything else? (optional)" /></Row>
        </>
      ) },
      { id: "choice", name: "Choice card", tokens: "--input-selected-*", purpose: "Coming or can't make it. Shares focus and selected with every input; the seal fills when chosen.", render: () => (
        <>
          {(["default", "hover", "focus", "pressed", "selected", "error"] as const).map((s) => (
            <Row key={s} label={s}>
              <div className="grid w-full max-w-sm grid-cols-2 gap-3">
                <span data-selected={s === "selected"} aria-invalid={s === "error" || undefined} {...force(s)} className="state flex min-h-16 items-center gap-3 rounded-md px-3 leading-tight text-foreground"><Seal on={s === "selected"} />Coming</span>
                <span aria-invalid={s === "error" || undefined} className="state flex min-h-16 items-center gap-3 rounded-md px-3 leading-tight text-foreground"><Seal on={false} />Can't make it</span>
              </div>
            </Row>
          ))}
        </>
      ) },
      { id: "chip", name: "Chip", tokens: "--input-*", purpose: "Dietary needs, allergens, flying from. A tick, never colour alone.", render: () => <ChipDemo /> },
      { id: "checkbox", name: "Checkbox", purpose: "Photos consent and the travel checklist.", render: () => (
        <>
          <Row label="off"><Checkbox aria-label="off" /></Row>
          <Row label="on"><Checkbox aria-label="on" defaultChecked /></Row>
          <Row label="disabled"><Checkbox aria-label="disabled" disabled /></Row>
          <Row label="in a card"><label className="state flex max-w-sm cursor-pointer items-start gap-3 rounded-md p-4"><Checkbox className="mt-1" defaultChecked />Happy for photos with you in them to be shared with other guests</label></Row>
        </>
      ) },
      { id: "combobox", name: "Song search", tokens: "--input-*", purpose: "A combobox with the text field's states exactly. Results: card, line, 8px radius, active row on the fill.", render: () => <SongDemo /> },
      { id: "inline", name: "Inline submit", purpose: "Can't find your invite: email in, link out.", render: () => (
        <>
          <Row label="default"><InlineSubmit id="k-in" className="w-full max-w-sm" label="Your email" helper="The one your invite went to." submitLabel="Send my link" onSubmit={() => {}} /></Row>
          <Row label="busy"><InlineSubmit id="k-in2" className="w-full max-w-sm" label="Your email" submitLabel="Send my link" busy defaultValue="sam@example.com" onSubmit={() => {}} /></Row>
          <Row label="error"><InlineSubmit id="k-in3" className="w-full max-w-sm" label="Your email" submitLabel="Send my link" error="That doesn't look like an email address." defaultValue="sam@" onSubmit={() => {}} /></Row>
        </>
      ) },
    ],
  },
  {
    group: "Content",
    pages: [
      { id: "accordion", name: "Accordion", purpose: "Getting there and Q&A. Opens in 300 ms; answers are body.", render: () => (
        <Accordion type="single" collapsible defaultValue="a" className="max-w-md">
          <AccordionItem value="a"><AccordionTrigger>Flying in</AccordionTrigger><AccordionContent><p>Osaka (Kansai, KIX) is the easiest way in.</p></AccordionContent></AccordionItem>
          <AccordionItem value="b"><AccordionTrigger>Walking in</AccordionTrigger><AccordionContent><p>10 minutes from Gion-Shijo.</p></AccordionContent></AccordionItem>
        </Accordion>
      ) },
      { id: "steps", name: "Step progress and review", purpose: "Where you are in the RSVP, and the check before sending.", render: () => (
        <div className="flex max-w-md flex-col gap-6">
          {[1, 2, 3].map((n) => <StepProgress key={n} step={n} of={3} label={`Step ${n} of 3`} />)}
          <dl className="divide-y divide-border rounded-md border bg-card">
            <ReviewRow label="Sam" edit={() => {}} editLabel="Edit Sam">Coming · Vegetarian</ReviewRow>
            <ReviewRow label="Message" edit={() => {}} editLabel="Edit message" block>See you there!</ReviewRow>
          </dl>
        </div>
      ) },
      { id: "pill", name: "Status pill", purpose: "The only other round thing besides the seal.", render: () => (
        <div className="flex flex-wrap gap-3"><Pill tone="good">Replied</Pill><Pill tone="warn">Not yet</Pill><Pill>Changes lock 30 Apr</Pill><Pill tone="accent">New</Pill></div>
      ) },
      { id: "hanko", name: "Hanko", purpose: "The success stamp, the one thing that lands with a little weight (420 ms).", render: () => <HankoDemo /> },
      { id: "countdown", name: "Countdown tile", tokens: "--countdown-*", purpose: "Numerals 32, label under. The seconds tile sits on the fill.", render: () => (
        <div className="grid max-w-sm grid-cols-4 gap-2"><CountdownTile value={12} unit="months" /><CountdownTile value={3} unit="days" /><CountdownTile value={14} unit="hrs" /><CountdownTile value={42} unit="secs" ticking /></div>
      ) },
      { id: "fortune", name: "Fortune card", purpose: "After a yes: one fortune per household, the same on every device.", render: () => <div className="flex max-w-md flex-col gap-4"><FortuneCard token="kit-closed" /><FortuneCard token="kit-open" /></div> },
      { id: "driver", name: "Driver card", purpose: "Sage paper, the second surface. Full screen for the taxi driver.", render: () => <div className="max-w-md"><DriverCard /></div> },
      { id: "sound", name: "Sound toggle", purpose: "Tiny, at the end of the letter. Off by default, remembered on the device.", render: () => <SoundToggle /> },
      { id: "toast", name: "Toast", purpose: "One line, bottom of the screen, 2.4 s.", render: () => <Button variant="outline" onClick={() => toast("Address copied")}><Copy aria-hidden />Show a toast</Button> },
      { id: "skeleton", name: "Skeleton", purpose: "Washi breathing; only appears after 300 ms so fast loads never flash it.", render: () => <div className="flex max-w-xs flex-col gap-3"><Skeleton className="h-7 w-40" /><Skeleton className="h-13 w-full rounded-lg" /></div> },
    ],
  },
  {
    group: "Surfaces",
    pages: [
      { id: "letter", name: "Letter and scene", tokens: "--letter-*, --scene-*", purpose: "The only UI surface. 620 wide on desktop, forest edge (honey in Lantern), paper blur within 24px.", render: () => <LetterDemo /> },
      { id: "envelope", name: "Envelope", purpose: "Arrival, first visit only. Flap 300 ms, letter rises 600 ms.", render: () => <EnvelopeDemo /> },
    ],
  },
]
const ALL = GROUPS.flatMap((g) => g.pages)

function ChipDemo() {
  const [on, setOn] = useState(["Vegetarian"])
  const t = (x: string) => setOn((o) => (o.includes(x) ? o.filter((y) => y !== x) : [...o, x]))
  return (
    <>
      <Row label="live">{["Vegetarian", "Vegan", "Gluten free", "Allergy"].map((x) => <Chip key={x} on={on.includes(x)} onClick={() => t(x)}>{x}</Chip>)}</Row>
      {(["hover", "focus", "pressed"] as const).map((s) => (
        <Row key={s} label={s}><span {...force(s)} className="state inline-flex min-h-11 items-center rounded-sm px-4 text-foreground">Peanuts</span></Row>
      ))}
    </>
  )
}

function SongDemo() {
  const [songs, setSongs] = useState(["September · Earth, Wind & Fire"])
  return (
    <div className="max-w-md">
      <SongPicker songs={songs} onChange={setSongs} token="kit" t={{ label: "A song for the dance floor?", hint: "Search by song or artist, or just type it", placeholder: "Search for a song", addTyped: "Add this song", justType: "Not on there? Just type it", searching: "Searching…", noMatch: (q) => `No match. Add "${q}" as typed`, error: "Search isn't working right now. Add what you typed", remove: (s) => `Remove ${s}`, full: (n) => `${n} songs added.`, added: "Your songs" }} />
    </div>
  )
}

function HankoDemo() {
  const [n, setN] = useState(0)
  return <div className="flex items-center gap-6"><Hanko key={n} stamp /><Button variant="outline" onClick={() => setN(n + 1)}>Stamp again</Button></div>
}

function LetterDemo() {
  return (
    <div className="relative h-80 overflow-hidden rounded-md">
      <img src={`${import.meta.env.BASE_URL}scenes/kyoto-view-900.webp`} alt="" className="absolute inset-0 size-full object-cover" style={{ filter: "var(--scene-filter)" }} />
      <div className="letter absolute top-8 left-6 w-64 !gap-3 !p-6">
        <p className="label-caps text-muted-foreground">Fri 15 Oct 2027 · Kyoto</p>
        <p className="font-display text-[40px] leading-none text-foreground">{COUPLE.first} <span className="text-primary">&amp;</span></p>
        <span className="moss-rule" />
        <p>Dear Sam and Alex,</p>
      </div>
    </div>
  )
}

function EnvelopeDemo() {
  const [n, setN] = useState(0)
  const [opening, setOpening] = useState(false)
  return (
    <div className="flex flex-col items-start gap-6">
      <div key={n} className={cn("relative grid h-72 w-full max-w-md place-items-center", opening && "is-opening")}>
        <span className="envelope" aria-hidden>
          <span className="envelope-back" /><span className="envelope-paper" /><span className="envelope-front" /><span className="envelope-flap" />
          <span className="envelope-seal">{COUPLE.first[0]}&amp;{COUPLE.second[0]}</span>
        </span>
      </div>
      <Button variant="outline" onClick={() => { if (opening) { setOpening(false); setN(n + 1) } else setOpening(true) }}>{opening ? "Seal it again" : "Open"}<ArrowRight aria-hidden /></Button>
    </div>
  )
}

/** Reads a custom property's resolved colour inside a themed panel. */
function useVar(ref: React.RefObject<HTMLElement | null>, name: string, dep: unknown) {
  const [v, setV] = useState("")
  useLayoutEffect(() => {
    if (!ref.current) return
    const probe = document.createElement("span")
    probe.style.color = `var(${name})`
    ref.current.appendChild(probe)
    setV(getComputedStyle(probe).color)
    probe.remove()
  }, [ref, name, dep])
  return v
}
const hex = (rgb: string) => {
  const m = rgb.match(/\d+(\.\d+)?/g)
  return m ? "#" + m.slice(0, 3).map((x) => Math.round(+x).toString(16).padStart(2, "0")).join("") : rgb
}
const lum = (rgb: string) => {
  const m = (rgb.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map((x) => +x / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]
}
const ratio = (a: string, b: string) => { const x = lum(a), y = lum(b); return ((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(1) }

function Swatch({ name, role, on }: { name: string; role?: string; on?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const tick = useTune()
  const c = useVar(ref, name, tick)
  const bg = useVar(ref, on || "--sys-surface", tick)
  return (
    <div ref={ref} className="flex items-center gap-3 py-2">
      <span className="size-10 shrink-0 rounded-sm border" style={{ background: `var(${name})` }} />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-foreground">{name.replace(/^--/, "")}</span>
        <span className="block text-sm text-muted-foreground">{hex(c)}{role ? ` · ${role}` : ""}{on ? ` · ${ratio(c, bg)}:1` : ""}</span>
      </span>
    </div>
  )
}

const BRAND = ["kinari", "shiro-kinari", "wara", "kogecha", "kuri", "nikkei", "sabi", "doro", "uguisu-cha", "koke", "kabocha", "hachimitsu", "mitsu", "sage-paper", "forest", "yoru", "yoru-raised", "yoru-fill", "yoru-line", "kare", "sage"]
const SYS: [string, string, boolean][] = [
  ["surface", "the letter", false], ["surface-raised", "inputs, cards", false], ["surface-alt", "second surface", false], ["fill", "pressed, selected", false],
  ["ink", "names, headings", true], ["ink-soft", "body", true], ["ink-muted", "hints, labels", true], ["accent", "primary, &, seal", false],
  ["link", "links", true], ["line", "lines", false], ["line-strong", "hover line", false], ["focus", "focus ring", false], ["success", "coming", true], ["moss", "rule, tick", false], ["danger", "errors", true], ["edge", "letter edge", false],
]
function Colour() {
  return (
    <>
      <h3 className="label-caps text-muted-foreground">Brand · Nadia's palette</h3>
      <div className="grid gap-x-6 sm:grid-cols-2">{BRAND.map((b) => <Swatch key={b} name={`--brand-${b}`} />)}</div>
      <h3 className="label-caps mt-6 text-muted-foreground">System · this mode (text pairs show contrast on the letter)</h3>
      <div className="grid gap-x-6 sm:grid-cols-2">{SYS.map(([s, role, text]) => <Swatch key={s} name={`--sys-${s}`} role={role} on={text ? "--sys-surface" : undefined} />)}</div>
    </>
  )
}

function Type() {
  const rows: [string, string, ReactNode][] = [
    ["Display · names", "--type-display-names-*", <p className="names">{COUPLE.first} <span className="text-primary">&amp;</span></p>],
    ["Heading", "--type-heading-*", <p className="heading">Getting there</p>],
    ["Body", "--type-body-*", <p>We're getting married in Kyoto, where it all started, and we'd love you to be there.</p>],
    ["Note", "--type-note-*", <p className="hand">With love, N &amp; G</p>],
    ["Label", "--type-label-*", <p className="label-caps text-muted-foreground">Fri 15 Oct 2027 · Kyoto</p>],
    ["Numerals", "--type-display-numerals-*", <p className="numerals text-(length:--type-display-numerals-size) text-foreground">376</p>],
    ["Small", "--type-small-*", <p className="text-xs text-destructive">Errors and fine print only.</p>],
  ]
  return <>{rows.map(([n, tok, el]) => <div key={n} className="flex flex-col gap-2 border-b border-border py-4 last:border-b-0"><span className="label-caps text-muted-foreground">{n} · <span className="normal-case tracking-normal">{tok}</span></span>{el}</div>)}</>
}

function Space() {
  return (
    <>
      <h3 className="label-caps text-muted-foreground">Space</h3>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
        <div key={n} className="flex items-center gap-4 py-1"><span className="w-20 text-sm text-muted-foreground">space-{n}</span><span className="h-4 rounded-sm bg-primary" style={{ width: `var(--space-${n})` }} /></div>
      ))}
      <h3 className="label-caps mt-6 text-muted-foreground">Radius</h3>
      <div className="flex flex-wrap gap-4">
        {["chip", "card", "button", "letter", "pill"].map((r) => (
          <div key={r} className="flex flex-col items-center gap-2"><span className="size-20 border-2 border-primary bg-card" style={{ borderRadius: `var(--radius-${r})` }} /><span className="text-sm text-muted-foreground">{r}</span></div>
        ))}
      </div>
    </>
  )
}

const MOMENTS: [string, string][] = [
  ["Arrival", "The envelope opens and the letter rises (first visit only)"],
  ["Home", "The names settle in once per visit; the live line ticks quietly"],
  ["RSVP", "Steps slide the way you're going; the tick pops in on a chip"],
  ["Success", "The hanko stamps, with one furin ting if sound is on"],
  ["Fortune", "The box tilts three times and the slip unfolds"],
  ["The day", "The timeline line fills as you scroll; Now marker on the day"],
  ["Getting there", "Show the driver goes full screen and keeps the screen awake"],
]
function Motion() {
  const [go, setGo] = useState(0)
  const rows: [string, string, string][] = [["press", "--duration-press", "--ease-paper"], ["quick", "--duration-quick", "--ease-paper"], ["settle", "--duration-settle", "--ease-paper"], ["rise", "--duration-rise", "--ease-letter"]]
  return (
    <>
      <Button variant="outline" onClick={() => setGo(go + 1)} className="self-start">Play</Button>
      {rows.map(([n, d, e]) => (
        <div key={n} className="flex items-center gap-4 py-2">
          <span className="w-32 text-sm text-muted-foreground">{n} · {d.replace("--duration-", "")}</span>
          <div className="relative h-8 flex-1 rounded-sm bg-secondary" style={{ containerType: "inline-size" }}>
            <span className="absolute top-1 left-1 size-6 rounded-sm bg-primary" style={{ transform: go % 2 ? "translateX(calc(100cqw - 32px))" : "none", transition: `transform var(${d}) var(${e})` }} />
          </div>
        </div>
      ))}
      <h3 className="label-caps mt-6 text-muted-foreground">One moment per screen</h3>
      <dl className="divide-y divide-border">{MOMENTS.map(([a, b]) => <div key={a} className="flex gap-4 py-3"><dt className="w-32 shrink-0 font-semibold text-foreground">{a}</dt><dd>{b}</dd></div>)}</dl>
      <p className="hand">Under reduced motion everything is still: the letter is just there, steps fade, nothing drifts.</p>
    </>
  )
}

function Overview() {
  return (
    <div className="flex flex-col gap-4">
      <p>Every page is a letter in front of a scene. The letter is the only surface; everything on it uses three type sizes and one set of states. Tokens come in three layers: brand (the palette), system (what a colour is for, per mode) and component (one component, tunable alone).</p>
      <ul className="flex list-disc flex-col gap-2 pl-6">
        <li>Scenes: {Object.keys(SCENES).join(", ")}</li>
        <li>Three sizes per screen: names or heading, body, label</li>
        <li>States: default, hover, focus, pressed, selected, disabled, error, loading</li>
        <li>Motion: press 90, quick 150, settle 300, rise 600</li>
      </ul>
    </div>
  )
}

// Re-render swatches when the tuning panel changes a value
function useTune() {
  const [n, setN] = useState(0)
  useEffect(() => {
    const on = () => setN((x) => x + 1)
    window.addEventListener("ng-tune", on)
    return () => window.removeEventListener("ng-tune", on)
  }, [])
  return n
}

export function KitPage() {
  useLang()
  const [id, setId] = useState(() => location.hash.slice(1) || "overview")
  const [modes, setModes] = useState<"both" | "autumn" | "lantern">("both")
  useEffect(() => {
    const on = () => setId(location.hash.slice(1) || "overview")
    window.addEventListener("hashchange", on)
    return () => window.removeEventListener("hashchange", on)
  }, [])
  const page = ALL.find((p) => p.id === id) ?? ALL[0]
  const panels = modes === "both" ? (["autumn", "lantern"] as const) : [modes]
  return (
    <div className="kit min-h-svh bg-background">
      <header className="sticky top-0 z-30 flex flex-wrap items-center gap-4 border-b bg-background/95 px-4 py-3 backdrop-blur md:px-6">
        <p className="font-display text-2xl text-foreground">{COUPLE.first[0]}&amp;{COUPLE.second[0]} <span className="label-caps text-muted-foreground">Design system</span></p>
        <div role="group" aria-label="Modes" className="ml-auto flex gap-1">
          {(["both", "autumn", "lantern"] as const).map((m) => (
            <button key={m} type="button" aria-pressed={modes === m} onClick={() => setModes(m)} className="state min-h-11 rounded-sm px-3 text-foreground">{m === "both" ? "Both" : m === "autumn" ? "Light" : "Lantern"}</button>
          ))}
        </div>
        {tuneEnabled && <TuneLauncher />}
      </header>
      <div className="mx-auto grid max-w-[1440px] gap-6 px-4 py-6 md:px-6 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Design system" className="lg:sticky lg:top-24 lg:self-start">
          <label className="label-caps mb-2 block text-muted-foreground lg:hidden" htmlFor="kit-jump">Jump to</label>
          <select id="kit-jump" className="state field lg:hidden" value={page.id} onChange={(e) => (location.hash = e.target.value)}>
            {GROUPS.map((g) => <optgroup key={g.group} label={g.group}>{g.pages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</optgroup>)}
          </select>
          <div className="hidden flex-col gap-6 lg:flex">
            {GROUPS.map((g) => (
              <div key={g.group} className="flex flex-col gap-1">
                <p className="label-caps text-muted-foreground">{g.group}</p>
                {g.pages.map((p) => (
                  <a key={p.id} href={`#${p.id}`} aria-current={p.id === page.id ? "page" : undefined}
                    className={cn("rounded-sm px-2 py-1 text-foreground outline-2 outline-offset-2 outline-transparent focus-visible:outline-ring", p.id === page.id ? "bg-secondary font-semibold" : "hover:bg-secondary/60")}>{p.name}</a>
                ))}
              </div>
            ))}
          </div>
        </nav>
        <main className="flex min-w-0 flex-col gap-6">
          <header className="flex flex-col gap-2">
            <h1 className="heading">{page.name}</h1>
            <p className="max-w-[60ch]">{page.purpose}</p>
            {page.tokens && <p className="label-caps text-muted-foreground">Tokens · <span className="normal-case tracking-normal">{page.tokens}</span></p>}
          </header>
          <div className={cn("grid gap-6", panels.length > 1 && "xl:grid-cols-2")}>
            {panels.map((m) => (
              <section key={m} data-theme={m} aria-label={m === "autumn" ? "Light" : "Lantern"} className="kit-panel flex min-w-0 flex-col gap-4 rounded-3xl border-t-[6px] border-(--letter-edge-color) bg-background p-6 text-body shadow-paper">
                <p className="label-caps text-muted-foreground">{m === "autumn" ? "Light" : "Lantern"}</p>
                {page.render()}
              </section>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
