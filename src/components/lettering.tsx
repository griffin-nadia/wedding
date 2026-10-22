import { ART, type LetteringKey } from "@/lib/art"

/**
 * A word in Nadia's hand lettering where she's drawn one (run 21: the page headings and the G&N mark), as masked art
 * filled with the ink colour, so it suits both themes. The real words stay for screen readers, search and copy. Until
 * her file is in ART.lettering, the words show in the site's font, exactly as before.
 */
export function Lettering({ word, children }: { word: LetteringKey; children: string }) {
  const art = ART.lettering[word]
  if (!art.src) return <>{children}</>
  return (
    <>
      <span aria-hidden className="lettering" style={{ ["--lettering-art" as string]: `url(${import.meta.env.BASE_URL}${art.src})`, ["--lettering-ratio" as string]: String(art.ratio) }} />
      <span className="sr-only">{children}</span>
    </>
  )
}
