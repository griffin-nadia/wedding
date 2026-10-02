import { useState, type ReactNode } from "react"
import { Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Chip, InfoBlock, ReviewRow, Seal, Skeleton, StepProgress, TimelineRow } from "@/components/blocks"
import { InlineSubmit } from "@/components/inline-submit"
import { Pill } from "@/components/pill"
import { SongPicker } from "@/components/song-picker"
import { Countdown } from "@/components/countdown"
import { Hanko } from "@/components/hanko"
import { Leaf, LeafDivider, Mist, Vine } from "@/components/nature"
import { Photo } from "@/components/photo"
import { JourneyMap } from "@/components/journey-map"
import { useLang } from "@/lib/lang"

/** The living reference: every component and state, light and Lantern side by side. Hidden, not linked. */
export function KitPage() {
  const { t } = useLang()
  const [songs, setSongs] = useState<string[]>(["September · Earth, Wind & Fire"])
  const Section = ({ title, children }: { title: string; children: ReactNode }) => (
    <section className="space-y-3 border-t border-border pt-6"><h2 className="label-caps text-muted-foreground">{title}</h2><div className="space-y-4">{children}</div></section>
  )
  const panel = (
    <div className="space-y-8">
      <Section title="Buttons: primary bead · secondary paper · ghost · disabled · loading">
        <div className="flex flex-wrap gap-3">
          <Button size="lg">Send our RSVP</Button>
          <Button size="lg" variant="outline"><Printer aria-hidden />Print the day</Button>
          <Button size="lg" variant="ghost">See as a list</Button>
          <Button size="lg" disabled>Next</Button>
          <Button size="lg" aria-busy><span className="animate-spin">◌</span>Sending your reply…</Button>
        </div>
      </Section>
      <Section title="Choice card · seal">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex min-h-16 items-center gap-3 rounded-2xl border bg-card px-4"><Seal on={false} />Coming</div>
          <div className="flex min-h-16 items-center gap-3 rounded-2xl border-2 border-primary bg-secondary px-4 font-semibold"><Seal on />Can't make it</div>
        </div>
      </Section>
      <Section title="Chips (multi-select)">
        <div className="flex flex-wrap gap-2"><Chip on onClick={() => {}}>Vegetarian</Chip><Chip on={false} onClick={() => {}}>Vegan</Chip><Chip on onClick={() => {}}>Allergy</Chip></div>
      </Section>
      <Section title="Inputs: default · error · date · textarea">
        <div className="space-y-2"><Label htmlFor="k1">Bringing someone? Their name</Label><Input id="k1" defaultValue="Jo" /></div>
        <div className="space-y-2"><Label htmlFor="k2">What is Alex allergic to?</Label><Input id="k2" aria-invalid /><p className="text-sm text-destructive">Please tell us, so the kitchen can plan.</p></div>
        <div className="space-y-2"><Label htmlFor="k3">Arriving</Label><Input id="k3" type="date" defaultValue="2027-10-12" /></div>
        <div className="space-y-2"><Label htmlFor="k4">Anything else?</Label><Textarea id="k4" defaultValue="Can't wait!" /></div>
      </Section>
      <Section title="Inline-submit: default · busy · error">
        <InlineSubmit id="kit-a" label="Your email" helper="The one your invite went to." submitLabel="Send" onSubmit={() => {}} fallback={{ label: "Or email us", onClick: () => {} }} />
        <InlineSubmit id="kit-b" label="Your email" submitLabel="Send" busy defaultValue="sam@example.com" onSubmit={() => {}} />
        <InlineSubmit id="kit-c" label="Your email" submitLabel="Send" error="That doesn't look like an email address." defaultValue="sam" onSubmit={() => {}} />
      </Section>
      <Section title="Song combobox (type to see loading, results, no match)">
        <SongPicker songs={songs} onChange={setSongs} token="kit" t={{ label: t.rsvp.song, hint: t.rsvp.songHint, placeholder: t.rsvp.songPlaceholder, addTyped: t.rsvp.addTyped, justType: t.rsvp.justType, searching: t.rsvp.searching, noMatch: t.rsvp.noMatch, error: t.rsvp.searchError, remove: t.rsvp.removeSong, full: t.rsvp.songsFull, added: t.rsvp.songsAdded }} />
      </Section>
      <Section title="Status pills">
        <div className="flex flex-wrap gap-2"><Pill tone="good">Replied</Pill><Pill tone="good">Coming</Pill><Pill tone="warn">Not yet</Pill><Pill>Changes lock 30 Apr</Pill><Pill tone="accent">New</Pill></div>
      </Section>
      <Section title="Step progress · review rows">
        <p className="label-caps text-muted-foreground">Step 2 of 3</p><StepProgress step={2} of={3} label="Step 2 of 3" />
        <dl className="divide-y rounded-[1.25rem] bg-card ring-1 ring-border">
          <ReviewRow label="Alex" edit={() => {}} editLabel="Edit Alex">Coming · Vegetarian</ReviewRow>
          <ReviewRow label="Message" edit={() => {}} editLabel="Edit message" block>Can't wait!</ReviewRow>
        </dl>
      </Section>
      <Section title="Timeline row · info block">
        <ol className="relative pl-12"><TimelineRow icon={<Leaf className="size-5" />} time="11:00 am" title="Ceremony" where="The Garden" local="1:00 pm Fri in Melbourne" /></ol>
        <InfoBlock label="From Kyoto Station" action={{ label: "Open the map", href: "#" }}>Taxi is easiest: about 15 minutes.</InfoBlock>
      </Section>
      <Section title="Countdown"><Countdown units={t.home.countdownUnits} kyotoLabel={t.home.kyotoTimeShort} /></Section>
      <Section title="Hanko · leaves · vine · mist · divider · skeleton">
        <div className="flex items-center gap-4"><Hanko /><Hanko size="sm" /><Leaf kind="maple" /><Leaf kind="ivy" tone="b" /><Leaf kind="ginkgo" /></div>
        <Vine className="w-40" /><Mist /><LeafDivider />
        <div className="space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-8 w-56" /></div>
      </Section>
      <Section title="Photo frames A–D (placeholders until photos are public)">
        <Photo name="kyoto-night" treatment="full" className="h-64 rounded-[1.25rem] text-[#f3e7d3]"><p className="absolute bottom-4 left-4 font-display text-3xl">Nadia &amp; Griffin</p></Photo>
        <div className="grid grid-cols-3 items-start gap-4">
          <Photo name="couple-kyoto-view" treatment="print" sizes="200px" />
          <Photo name="nara-deer-nuzzle" treatment="arch" sizes="200px" />
          <Photo name="yasaka-gate-shijo" treatment="split" sizes="200px" />
        </div>
      </Section>
      <Section title="Journey map">
        <JourneyMap labels={t.story} stops={[{ title: "Brisbane", body: "Placeholder story.", photo: "couple-brisbane-market", at: [0, 0] }, { title: "Japan, the first time", body: "Placeholder story.", photo: "torii-mist", at: [0, 0] }, { title: "Kyoto", body: "Placeholder story.", photo: "couple-night-lane-2", at: [0, 0] }]} />
      </Section>
    </div>
  )
  return (
    <main className="mx-auto max-w-[90rem] space-y-6 p-4 md:p-8">
      <h1 className="title">Kit</h1>
      <p className="text-sm text-body">Every component and state, light and Lantern. Not linked from the site.</p>
      <div className="grid gap-8 lg:grid-cols-2">
        <div data-theme="autumn" className="rounded-[1.5rem] bg-background p-6 text-foreground">{panel}</div>
        <div data-theme="lantern" className="rounded-[1.5rem] bg-background p-6 text-foreground">{panel}</div>
      </div>
    </main>
  )
}
