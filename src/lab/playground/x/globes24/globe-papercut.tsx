import { GlobeLab, type Look } from "./kit"
import { around, breathe, grain, land, seeded, sheet } from "./kit-paint"

/**
 * Look 7, paper cut-out (lab 19's take, pushed further): the world cut from sheets of gouache-painted paper and
 * stacked. A deep sea sheet, then a paler sheet for the shallows cut a little wider than the coast, then the land,
 * then a smaller inland sheet, each casting a soft shadow down and to the right on the one under it, and each
 * showing a thin pale core where the scissors cut it. Every sheet has its own brushy gouache and paper tooth.
 * The shadows are cheap: drawn small and blurred by scaling, then laid over at full size.
 */
const COL = {
  day: { sea: "#5f8ea0", shelf: "#8fb6bb", land: ["#e2b77a", "#d79f6c", "#c9b27c"], inland: "#ecd29c", core: "rgba(255, 250, 238, 0.9)", shadow: "rgba(40, 30, 20, 0.5)" },
  night: { sea: "#1b2a3c", shelf: "#2c4152", land: ["#6e5a40", "#674c3a", "#5f5640"], inland: "#7c6849", core: "rgba(230, 215, 190, 0.45)", shadow: "rgba(0, 0, 0, 0.7)" },
}

/** Brushy gouache over one sheet: long soft strokes a touch lighter and darker than its colour, in a few widths
 *  (one path per tone and width, so it's six strokes, not hundreds) */
function gouache(g: CanvasRenderingContext2D, W: number, H: number, u: number, seed: number) {
  const rnd = seeded(seed)
  g.lineCap = "round"
  for (const tone of ["rgba(255, 255, 255, 0.05)", "rgba(0, 0, 0, 0.045)"]) for (const lw of [7, 13, 22]) {
    g.strokeStyle = tone; g.lineWidth = lw * u; g.beginPath()
    for (let i = 0; i < 40; i++) {
      const x = rnd() * W, y = rnd() * H, len = (0.02 + rnd() * 0.08) * W, a = (rnd() - 0.5) * 0.5
      around(x, len, W, (cx) => { g.moveTo(cx - len / 2, y - a * len); g.lineTo(cx + len / 2, y + a * len) })
    }
    g.stroke()
  }
}

const look: Look = {
  line: "plane",
  shade: 0.3,
  rim: 1,
  inks: (night) => ({ guest: night ? "#e8d6b4" : "#2f2219", ink: night ? "#f1e2c4" : "#2f2219", paper: night ? "#efe2c8" : "#fffaf0" }),
  back: (night) => (night ? COL.night.sea : COL.day.shelf),
  paint: async ({ night, width: W }) => {
    const k = night ? COL.night : COL.day, [c, g] = sheet(W), H = W / 2, u = W / 2048
    const { all, countries } = await land(W)
    // A small canvas for the shadows: each sheet's shape in the shadow colour, blurred by drawing it small and back up
    const SW = W / 8, sc = document.createElement("canvas"); sc.width = SW; sc.height = SW / 2
    const sg = sc.getContext("2d", { willReadFrequently: true })!
    const tiny = document.createElement("canvas"); tiny.width = SW / 2; tiny.height = SW / 4
    const tg = tiny.getContext("2d", { willReadFrequently: true })!
    const shadow = (shape: (x: CanvasRenderingContext2D) => void, off: number, a: number) => {
      sg.setTransform(1, 0, 0, 1, 0, 0); sg.clearRect(0, 0, SW, SW / 2)
      sg.setTransform(1 / 8, 0, 0, 1 / 8, (off * u) / 8, (off * 1.3 * u) / 8); sg.fillStyle = k.shadow; shape(sg)
      tg.clearRect(0, 0, tiny.width, tiny.height); tg.drawImage(sc, 0, 0, tiny.width, tiny.height)
      g.save(); g.globalAlpha = a; g.drawImage(tiny, 0, 0, W, H); g.restore()
    }
    // The sea sheet
    g.fillStyle = k.sea; g.fillRect(0, 0, W, H)
    gouache(g, W, H, u, 31)
    await breathe(g)
    // The shallows: the land's shape cut 9 px wider all round (a fill and a wide stroke)
    const SHELF = 18 * u
    const shelf = (x: CanvasRenderingContext2D) => { x.fill(all); x.lineWidth = SHELF; x.lineJoin = "round"; x.strokeStyle = x.fillStyle; x.stroke(all) }
    shadow(shelf, 6, 0.55)
    await breathe(g)
    g.fillStyle = k.shelf; shelf(g)
    await breathe(g)
    // The land, each country cut from one of three sheets
    shadow((x) => x.fill(all), 7, 0.6)
    await breathe(g)
    countries.forEach((x, i) => { g.fillStyle = k.land[i % 3]; g.fill(x.path) })
    await breathe(g)
    g.save(); g.clip(all); gouache(g, W, H, u, 41); g.restore()
    await breathe(g)
    // The cut edge's pale core
    g.strokeStyle = k.core; g.lineWidth = 1.2 * u; g.lineJoin = "round"; g.stroke(all)
    await breathe(g)
    // The inland sheet: the land cut 8 px in from the coast (the land, less a wide stroke along its edge)
    const IN = document.createElement("canvas"); IN.width = W; IN.height = H
    const ig = IN.getContext("2d", { willReadFrequently: true })!
    ig.fillStyle = k.inland; ig.fill(all)
    await breathe(ig)
    ig.globalCompositeOperation = "destination-out"; ig.lineWidth = 22 * u; ig.lineJoin = "round"; ig.stroke(all)
    await breathe(ig)
    ig.globalCompositeOperation = "source-atop"; gouache(ig, W, H, u, 47)
    await breathe(g)
    // Its shadow from its own picture, then the sheet itself
    sg.setTransform(1, 0, 0, 1, 0, 0); sg.clearRect(0, 0, SW, SW / 2)
    sg.drawImage(IN, (4 * u) / 8, (5 * u) / 8, SW, SW / 2); sg.globalCompositeOperation = "source-in"; sg.fillStyle = k.shadow; sg.fillRect(0, 0, SW, SW / 2); sg.globalCompositeOperation = "source-over"
    tg.clearRect(0, 0, tiny.width, tiny.height); tg.drawImage(sc, 0, 0, tiny.width, tiny.height)
    g.save(); g.globalAlpha = 0.45; g.drawImage(tiny, 0, 0, W, H); g.restore()
    await breathe(g)
    g.drawImage(IN, 0, 0)
    await breathe(g)
    // Paper tooth over every sheet
    grain(g, night ? 0.07 : 0.11, 43)
    return c
  },
}

export default function GlobePapercut() {
  return <GlobeLab look={look} />
}
