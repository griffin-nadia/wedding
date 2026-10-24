import type { Look } from "./kit-view"
import { breathe, grain, land, sheet } from "./kit-paint"

/**
 * Look 5, dotted (halftone): the land printed as ink dots on paper, in the spirit of the Stripe, GitHub and COBE
 * globes. The dots sit on rows of equal spacing over the sphere (fewer per row towards the poles, each drawn a little
 * wider on the picture so it lands nearly round on the ball and still reads as a dot on the flat map), and like a
 * halftone screen they shrink towards the coasts. The sea carries a faint, finer screen of its own, so it reads as
 * printed paper rather than empty. Run 27: navy dots on blush paper by day; Lantern, gold dots on umber.
 */
const COL = {
  day: { paper: "#efd6cb", dot: "#1f3a6b", sea: "rgba(31, 58, 107, 0.16)" },
  night: { paper: "#2a1c12", dot: "#f0c66e", sea: "rgba(240, 198, 110, 0.13)" },
}

export const look: Look = {
  line: "dots",
  shade: 0.35,
  rim: 1,
  back: (night) => (night ? COL.night.paper : COL.day.paper),
  paint: async ({ night, width: W }) => {
    const k = night ? COL.night : COL.day, [c, g] = sheet(W), H = W / 2, u = W / 2048
    g.fillStyle = k.paper; g.fillRect(0, 0, W, H)
    const { all } = await land(W)
    await breathe(g)
    // The land as a mask at a quarter size, and a blurred copy of it (down to a sixteenth and back up) for the coasts
    const MW = W / 4, MH = MW / 2, m = document.createElement("canvas"); m.width = MW; m.height = MH
    const mg = m.getContext("2d", { willReadFrequently: true })!
    mg.scale(0.25, 0.25); mg.fillStyle = "#fff"; mg.fill(all); mg.setTransform(1, 0, 0, 1, 0, 0)
    const sharp = mg.getImageData(0, 0, MW, MH).data
    await breathe(g)
    const tiny = document.createElement("canvas"); tiny.width = MW / 8; tiny.height = MH / 8
    const tg = tiny.getContext("2d", { willReadFrequently: true })!; tg.drawImage(m, 0, 0, tiny.width, tiny.height)
    mg.clearRect(0, 0, MW, MH); mg.drawImage(tiny, 0, 0, MW, MH)
    const soft = mg.getImageData(0, 0, MW, MH).data
    await breathe(g)
    const at = (d: Uint8ClampedArray, x: number, y: number) => d[(Math.min(MH - 1, Math.max(0, Math.floor(y / 4))) * MW + Math.min(MW - 1, Math.max(0, Math.floor(x / 4)))) * 4] / 255
    // Rows a dot apart over the sphere; along each row, dots as far apart as the rows are (fewer as it narrows)
    const S = 10 * u, rows = Math.round(H / S)
    // Each dot is one stamp of a round sprite (thousands of drawImage calls are far cheaper than a path of thousands of
    // ellipses). Every small canvas here is a CPU one, like the sheet: drawing a GPU canvas onto it means a read back
    const stamp = (colour: string) => {
      const t = document.createElement("canvas"); t.width = t.height = 32
      const x = t.getContext("2d", { willReadFrequently: true })!; x.fillStyle = colour; x.beginPath(); x.arc(16, 16, 15, 0, Math.PI * 2); x.fill()
      return t
    }
    const dots = (sea: boolean, r0: number, r1: number) => {
      const dot = sea ? seaDot : landDot
      for (let r = r0; r < Math.min(rows, r1); r++) {
        const y = (r + 0.5) * S, lat = (90 - (y / H) * 180) * (Math.PI / 180), cl = Math.max(0.12, Math.cos(lat))
        const n = Math.max(1, Math.round((W / S) * cl)), step = W / n, off = r % 2 ? step / 2 : 0
        for (let i = 0; i < n; i++) {
          const x = off + i * step, on = at(sharp, x, y) > 0.5
          if (on === sea) continue
          // A halftone: full dots inland, smaller at the coast; the sea's screen is a fine even dot
          const rad = sea ? 0.9 * u : (1.2 + 1.9 * Math.min(1, at(soft, x, y) * 1.25)) * u
          // Wider on the picture towards the poles (halfway to round on the ball, so the flat map's dots don't smear)
          const rx = rad / Math.sqrt(cl)
          g.drawImage(dot, x - rx, y - rad, rx * 2, rad * 2)
          if (x + rx > W) g.drawImage(dot, x - W - rx, y - rad, rx * 2, rad * 2)
        }
      }
    }
    // In bands of rows, each its own step
    const seaDot = stamp(k.sea), landDot = stamp(k.dot)
    for (const sea of [true, false]) for (let r = 0; r < rows; r += 35) { dots(sea, r, r + 35); await breathe(g) }
    grain(g, night ? 0.06 : 0.1, 23)
    return c
  },
}
