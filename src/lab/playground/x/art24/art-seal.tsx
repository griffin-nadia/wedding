import { useEffect } from "react"
import { useLang } from "@/lib/lang"
import { useTake } from "../../params"
import { A, ART_CSS, DoneMock, Polaroid, seal, sealSet } from "./parts"

/**
 * Nadia's wax seal (ART.seal) three ways (run 24, section 8):
 * - polaroid: pressed on the corner of some prints, over the photo's edge, as if sealing it
 * - done: on the RSVP done screen where the 寿 hanko sits today
 * - favicon: in a browser tab at 16 and 32 px beside today's flat mark, and on a home screen; while this take is
 *   open the lab's own tab wears it too
 */
const P = "x-seal"
const css = `
.${P}-stamp { position: absolute; right: -5%; bottom: 17%; width: 28%; height: auto; --sr: -12deg; filter: drop-shadow(0 1px 1px rgb(60 10 0 / .35)); }
.${P}-done { width: 72px; height: 72px; --sr: -8deg; filter: drop-shadow(0 2px 2px rgb(60 10 0 / .3)); }
.${P}-tabs { display: grid; gap: var(--space-3); }
.${P}-strip { display: flex; gap: 2px; padding: 8px 8px 0; border-radius: 10px 10px 0 0; background: #dee1e6; }
.${P}-strip[data-dark] { background: #202124; }
.${P}-tab { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1 1 0; max-width: 220px; height: 34px; padding: 0 12px; border-radius: 8px 8px 0 0; background: #fff; color: #202124; font: 12px/1 system-ui, sans-serif; }
.${P}-strip[data-dark] .${P}-tab { background: #35363a; color: #e8eaed; }
.${P}-tab span { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.${P}-tab img { flex: none; width: 16px; height: 16px; }
.${P}-sizes { display: flex; flex-wrap: wrap; align-items: end; gap: var(--space-5); }
.${P}-sizes figure { display: flex; flex-direction: column; align-items: center; gap: 6px; font-size: var(--type-small-size); color: var(--ink-soft); }
.${P}-app { width: 60px; height: 60px; border-radius: 14px; display: grid; place-items: center; background: var(--brand-paper-bright); box-shadow: 0 1px 3px rgb(0 0 0 / .25); }
.${P}-app img { width: 46px; height: 46px; }
`
const FLAT = `${import.meta.env.BASE_URL}brand/seal.svg`

/** While open, the lab's own tab shows the wax seal (put back on the way out) */
function useFavicon(href: string) {
  useEffect(() => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]') ?? Object.assign(document.head.appendChild(document.createElement("link")), { rel: "icon" })
    const was = link.getAttribute("href")
    link.href = href
    return () => { if (was === null) link.removeAttribute("href"); else link.setAttribute("href", was) }
  }, [href])
}

function Favicon() {
  const { t } = useLang()
  useFavicon(seal(64))
  const tab = (icon: string, label: string) => <div className={`${P}-tab`}><img src={icon} alt="" /><span>{t.meta.title}</span><span className="sr-only">, {label}</span></div>
  return (
    <>
      <div className={`${P}-tabs`} aria-label="Browser tabs (a mock)" role="group">
        {[false, true].map((dark) => (
          <div key={String(dark)} className={`${P}-strip`} data-dark={dark || undefined}>
            {tab(FLAT, "today's flat seal")}{tab(seal(64), "the wax seal")}
          </div>
        ))}
      </div>
      <div className={`${P}-sizes`}>
        <figure><img src={FLAT} alt="Today's flat seal at 16 px" width={16} height={16} /><figcaption>today, 16</figcaption></figure>
        <figure><img src={seal(64)} alt="The wax seal at 16 px" width={16} height={16} /><figcaption>wax, 16</figcaption></figure>
        <figure><img src={FLAT} alt="Today's flat seal at 32 px" width={32} height={32} /><figcaption>today, 32</figcaption></figure>
        <figure><img src={seal(64)} alt="The wax seal at 32 px" width={32} height={32} /><figcaption>wax, 32</figcaption></figure>
        <figure><span className={`${P}-app`}><img src={seal(128)} alt="The wax seal as a home screen icon" /></span><figcaption>home screen</figcaption></figure>
      </div>
      <p className={`${A}-note`}>This tab is wearing the wax seal now. At 16 px the G·N is gone and it reads as a red blob; at 32 and on a home screen it holds up.</p>
    </>
  )
}

export default function ArtSeal() {
  const take = useTake("polaroid")
  return (
    <div className={A}>
      <style>{ART_CSS + css}</style>
      {take === "polaroid" && <>
        <div className={`${A}-row`}>
          {[0, 1, 2].map((i) => (
            <Polaroid key={i} i={i}>
              {i !== 1 && <img aria-hidden alt="" className={`${P}-stamp ${A}-press`} style={{ ["--d" as string]: `${300 + i * 220}ms` }} src={seal(128)} srcSet={sealSet} sizes="64px" />}
            </Polaroid>
          ))}
        </div>
        <p className={`${A}-note`}>Nadia's wax seal pressed on the corner of some prints, never all, the way the tape works.</p>
      </>}
      {take === "done" && (
        <DoneMock head={<img aria-hidden alt="" className={`${P}-done ${A}-press`} style={{ ["--d" as string]: "200ms" }} src={seal(128)} srcSet={sealSet} sizes="72px" />} />
      )}
      {take === "favicon" && <Favicon />}
    </div>
  )
}
