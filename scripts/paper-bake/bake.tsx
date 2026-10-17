// The page scripts/paper-bake.mjs photographs: one PaperTexture per tone, still, at the tile's size
import { createRoot } from "react-dom/client"
import { PaperTexture } from "@paper-design/shaders-react"
import { COLOURS, PAPER, TILE, forTone, type PaperTone } from "../../src/lib/paper"

const extra = JSON.parse(new URLSearchParams(location.search).get("p") ?? "{}")
const tone = (new URLSearchParams(location.search).get("tone") ?? "light") as PaperTone
createRoot(document.getElementById("root")!).render(
  <PaperTexture id="t" className="t" speed={0} fit="cover" {...forTone({ ...PAPER, ...extra, colours: undefined }, tone)} {...COLOURS[tone]} {...extra.colours?.[tone]} style={{ width: TILE, height: TILE }} />,
)
