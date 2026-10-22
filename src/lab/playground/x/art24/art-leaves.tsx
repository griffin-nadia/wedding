import { Hanko } from "@/components/hanko"
import { DRAFT_FORTUNES, SlipWords, fortuneIndex } from "@/components/fortune-card"
import { ART } from "@/lib/art"
import { useTake } from "../../params"
import { A, ART_CSS, DoneMock, Polaroid, leaves, leavesSet } from "./parts"

/**
 * Nadia's gum leaves (ART.leaves) three ways (run 24, section 8). Her maple leaf isn't here: the file isn't available
 * yet (private/nadia-art-17oct/maple-leaf.png hasn't been saved from her email), so every take is gum leaves only.
 * - stickers: die-cut stickers on the story's polaroids (a white edge, a soft shadow), one corner lifting
 * - fortune: a sprig tucked over the fortune slip's top corner
 * - done: a sprig beside the 寿 seal on the RSVP done screen
 */
const P = "x-leaf"
const css = `
.${P}-sticker { position: absolute; width: 46%; height: auto; aspect-ratio: ${ART.leaves.ratio}; z-index: 2;
  filter: drop-shadow(0 0 0 #fff) drop-shadow(1.5px 0 0 #fff) drop-shadow(-1.5px 0 0 #fff) drop-shadow(0 1.5px 0 #fff) drop-shadow(0 -1.5px 0 #fff) drop-shadow(0 3px 3px rgb(40 20 0 / .28)); }
.${P}-sticker[data-at="0"] { right: -12%; top: -8%; --sr: 18deg; }
.${P}-sticker[data-at="2"] { left: -14%; bottom: 8%; --sr: -32deg; }
.${P}-slip { position: relative; max-width: 320px; margin-inline: auto; }
.${P}-slip .omikuji-slip { animation: none; }
.${P}-tuck { position: absolute; right: -6px; top: -26px; width: 88px; height: auto; z-index: 2; --sr: 24deg; filter: drop-shadow(0 2px 2px rgb(40 20 0 / .25)); }
.${P}-head { display: flex; align-items: center; gap: var(--space-2); }
.${P}-sprig { width: 56px; height: auto; --sr: -18deg; filter: drop-shadow(0 1px 1px rgb(40 20 0 / .2)); }
`
const MAPLE = "Her maple leaf isn't available yet (the file hasn't been saved from her email), so these are gum leaves only."

export default function ArtLeaves() {
  const take = useTake("stickers")
  const i = fortuneIndex("sample", DRAFT_FORTUNES.length)
  return (
    <div className={A}>
      <style>{ART_CSS + css}</style>
      {take === "stickers" && (
        <div className={`${A}-row`}>
          {[0, 1, 2].map((n) => (
            <Polaroid key={n} i={n}>
              {n !== 1 && <img aria-hidden alt="" data-at={n} className={`${P}-sticker ${A}-press`} style={{ ["--d" as string]: `${250 + n * 200}ms` }} src={leaves(160)} srcSet={leavesSet} sizes="100px" />}
            </Polaroid>
          ))}
        </div>
      )}
      {take === "fortune" && (
        <div className={`${P}-slip`}>
          <div className="omikuji-slip paper-feel" role="group" aria-label="A fortune slip (a mock)">
            <span aria-hidden className="omikuji-creases" />
            <SlipWords i={i} of={DRAFT_FORTUNES.length} fortune={DRAFT_FORTUNES[i]} copy />
          </div>
          <img aria-hidden alt="" className={`${P}-tuck ${A}-press`} style={{ ["--d" as string]: "250ms" }} src={leaves(160)} srcSet={leavesSet} sizes="96px" />
        </div>
      )}
      {take === "done" && (
        <DoneMock head={<span className={`${P}-head`}><Hanko stamp /><img aria-hidden alt="" className={`${P}-sprig ${A}-press`} style={{ ["--d" as string]: "450ms" }} src={leaves(160)} srcSet={leavesSet} sizes="56px" /></span>} />
      )}
      <p className={`${A}-note`}>{MAPLE}</p>
    </div>
  )
}
