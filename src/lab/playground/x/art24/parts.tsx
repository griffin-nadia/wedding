import { useState, type ReactNode } from "react"
import { Photo } from "@/components/photo"
import { Button } from "@/components/ui/button"
import { STORY_PLAN } from "@/content/story-plan"
import { ART } from "@/lib/art"
import { useLang } from "@/lib/lang"
import { privatePhoto } from "../../private"

/**
 * Shared by the run 24 art takes (section 8): the art's addresses, a polaroid of a story chapter, the RSVP done
 * screen as a mock, and a private picture that falls back to plain paper. Styles in ART_CSS, prefixed x-art-.
 */
export const A = "x-art"
const base = import.meta.env.BASE_URL
export const seal = (w: 64 | 128 | 256 = 128) => `${base}${ART.seal.src}-${w}.webp`
export const sealSet = ART.seal.widths.map((w) => `${base}${ART.seal.src}-${w}.webp ${w}w`).join(", ")
export const leaves = (w: 160 | 320 = 320) => `${base}${ART.leaves.src}-${w}.webp`
export const leavesSet = ART.leaves.widths.map((w) => `${base}${ART.leaves.src}-${w}.webp ${w}w`).join(", ")
/** Private pictures only on the dev server: in a build the address never ships (vite's no-private-in-build guard) */
export const priv = (file: string) => (import.meta.env.DEV ? privatePhoto(file) : null)

/** The first chapters with a photo, for the polaroids */
export const CHAPTERS = STORY_PLAN.filter((c) => c.photo).slice(0, 3)
const TILT = [-4, 3, -2]

export const ART_CSS = `
.${A} { display: flex; flex-direction: column; gap: var(--space-5); }
.${A}-note { font-size: var(--type-small-size); color: var(--ink-soft); max-width: 62ch; }
.${A}-row { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--space-4) var(--space-3); padding: var(--space-3) var(--space-1); align-items: start; }
/* Phones: two across, the third centred under them, so the captions have room */
@media (max-width: 767px) { .${A}-row { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-5) var(--space-4); padding-inline: var(--space-3); } .${A}-row > :nth-child(3) { grid-column: 1 / -1; justify-self: center; width: calc(50% - var(--space-2)); } }
/* A polaroid: about 5% border, 18% at the bottom, the caption in the bottom border */
.${A}-pol { position: relative; display: block; background: var(--brand-paper-bright); padding: 5% 5% 0; border-radius: 2px; rotate: var(--r);
  box-shadow: 0 0 0 .5px rgb(var(--tint-shadow) / .18), 0 1px 2px rgb(var(--tint-shadow) / .2), 0 12px 24px -12px rgb(var(--tint-shadow) / .5); }
.${A}-pol .photo-print > div { aspect-ratio: 4 / 5 !important; border-radius: 0; }
.${A}-pol figcaption { display: none; }
.${A}-cap { display: block; height: 18cqw; min-height: 2.4rem; padding-top: 4%; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #3b2a1e; font: 400 clamp(.8rem, 2.4vw, 1rem) / 1.2 var(--font-display); text-transform: lowercase; }
/* The RSVP done screen, as the sheet shows it (rsvp-sheet.tsx Done), in a card */
.${A}-done { width: 100%; max-width: 440px; margin-inline: auto; display: flex; flex-direction: column; align-items: center; gap: var(--space-3); text-align: center;
  padding: var(--space-6) var(--space-5); border-radius: var(--radius-section); background: var(--surface-raised); border: 1px solid var(--line-hairline); box-shadow: var(--elevation-paper); }
.${A}-paper { display: block; background: color-mix(in oklab, var(--brand-paper-bright) 90%, var(--ink) 5%); }
/* Pressed in: lands a touch big and settles (transform and opacity); reduced motion fades */
@keyframes ${A}-press { 0% { opacity: 0; transform: scale(1.35) rotate(var(--sr, 0deg)); } 60% { opacity: 1; transform: scale(.96) rotate(var(--sr, 0deg)); } 100% { opacity: 1; transform: scale(1) rotate(var(--sr, 0deg)); } }
@keyframes ${A}-fade { from { opacity: 0; } to { opacity: 1; } }
.${A}-press { animation: ${A}-press 520ms var(--ease-paper) both; animation-delay: var(--d, 0ms); transform: rotate(var(--sr, 0deg)); }
@media (prefers-reduced-motion: reduce) { .${A}-press { animation-name: ${A}-fade; animation-duration: 300ms; } }
`

/** A story chapter as a polaroid, with whatever sits on it (a seal, a sticker) */
export function Polaroid({ i, children }: { i: number; children?: ReactNode }) {
  const c = CHAPTERS[i]
  return (
    <figure className={`${A}-pol`} style={{ ["--r" as string]: `${TILT[i % 3]}deg`, containerType: "inline-size" }}>
      <Photo name={c.photo!} treatment="print" sizes="(min-width: 768px) 220px, 30vw" alt={`${c.title}, ${c.year}`} />
      {/* Ground rule: the caption is the chapter's year and place, lowercase; screen readers have the title in the alt */}
      <span aria-hidden className={`${A}-cap`}>{c.year}{c.place ? ` · ${c.place.replace(/\s*\(.*\)/, "").split(",").pop()!.trim()}` : ""}</span>
      {children}
    </figure>
  )
}

/** The done screen's words and buttons (the sheet's own copy), with the art where the 寿 seal sits */
export function DoneMock({ head, children }: { head: ReactNode; children?: ReactNode }) {
  const { t } = useLang()
  return (
    <section className={`${A}-done`} aria-label="The RSVP done screen (a mock)">
      {head}
      <h2 className="heading text-foreground">{t.rsvp.doneTitle.all}</h2>
      <p>{t.rsvp.sentLine} {t.rsvp.doneBodyEmail}</p>
      {children}
      <div className="flex flex-col items-stretch gap-2 self-stretch sm:flex-row sm:items-center sm:justify-center sm:gap-6">
        <Button size="md" className="w-full sm:w-auto">{t.rsvp.backHome}</Button>
        <button type="button" className="btn-text min-h-11 self-center sm:self-auto">{t.rsvp.changeReply}</button>
      </div>
    </section>
  )
}

/** A private picture, or plain paper where the build can't reach it (no broken image, no error) */
export function PrivImg({ file, alt, className, fallbackClass }: { file: string; alt: string; className?: string; fallbackClass?: string }) {
  const [failed, setFailed] = useState(false)
  const src = priv(file)
  if (!src || failed) return <span role="img" aria-label={alt} className={`${A}-paper ${fallbackClass ?? ""}`} />
  return <img src={src} alt={alt} className={className} decoding="async" onError={() => setFailed(true)} />
}
