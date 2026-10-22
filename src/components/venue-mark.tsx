/**
 * The Sodoh in Nadia's hand lettering (19 Oct): "THE SODOH / HIGASHIYAMA KYOTO" as a mask filled with the ink, so it
 * suits both themes, about the width of the address under it. Screen readers and copy get the words.
 */
export function VenueMark({ className }: { className?: string }) {
  const base = import.meta.env.BASE_URL
  return (
    <p className={className}>
      <span aria-hidden className="venue-mark" style={{ ["--venue-mark" as string]: `image-set(url(${base}art/sodoh/sodoh-mask-280.webp) 1x, url(${base}art/sodoh/sodoh-mask-560.webp) 2x)` }} />
      <span className="sr-only">The Sodoh Higashiyama, Kyoto</span>
    </p>
  )
}
