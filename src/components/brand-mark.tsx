/**
 * The top bar's mark (run 27, from the lab's "G&N from Nadia's lettering"): a G and an N cut from Nadia's own
 * lettering of the names (the masks the names on Home use, public/art/names), her "&" between in the sage. Each part
 * is a window onto the mask at its own columns, so the three keep her baseline. The link keeps "G&N" as its name.
 * The cut, measured from the mask's ink (1040 × 274): G columns 10 to 114, "&" 486 to 540, N 582 to 739; rows 10 to 272.
 */
const MASK = { w: 1040, h: 274, top: 10, rows: 262 }
const PARTS = { g: [10, 114, "names-mask"], amp: [486, 540, "amp-mask"], n: [582, 739, "names-mask"] } as const
const url = (m: string) => `image-set(url(${import.meta.env.BASE_URL}art/names/${m}-520.webp) 1x, url(${import.meta.env.BASE_URL}art/names/${m}-1040.webp) 2x)`

export function BrandMark() {
  const s = `calc(var(--mark-h) / ${MASK.rows})`
  return (
    <span className="brand-mark" aria-hidden>
      {(Object.keys(PARTS) as (keyof typeof PARTS)[]).map((k) => {
        const [a, b, m] = PARTS[k]
        const size = `calc(${MASK.w} * ${s}) calc(${MASK.h} * ${s})`, at = `calc(${-a} * ${s}) calc(${-MASK.top} * ${s})`
        return <span key={k} className={`brand-mark-part brand-mark-${k}`} style={{ width: `calc(${b - a} * ${s})`, WebkitMaskImage: url(m), maskImage: url(m), WebkitMaskSize: size, maskSize: size, WebkitMaskPosition: at, maskPosition: at }} />
      })}
    </span>
  )
}
