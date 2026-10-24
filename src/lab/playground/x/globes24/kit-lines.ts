import type { Icon, LineStyle } from "./kit-data"

/**
 * The line styles (globes24 kit): how one journey line is drawn on the 2D layer over the paper, the same on the
 * globe and the flat map, and in the key's swatches. Any look can use any style; a look only picks its default.
 * A line arrives as screen points (xs, ys) with an alpha per point (1 in front, less round the back of the globe),
 * and how many of them are drawn so far. Points with the same alpha are drawn as one run.
 * The maple leaf is a simple leaf silhouette drawn here in the look's ink colour: Nadia's maple leaf art isn't
 * available yet, so it stands in until it is.
 */
/** Styles where something travels the arc once (they take a little longer to draw) */
export const travels = (s: LineStyle) => s === "plane" || s === "leaf"
/** What flies the line: the Travelling icon knob, or on "auto" the line style's own (run 26) */
export const iconFor = (s: LineStyle, icon: Icon = "auto"): Exclude<Icon, "auto"> => (icon !== "auto" ? icon : s === "plane" ? "plane" : s === "leaf" ? "leaf" : "none")

export type LineDraw = {
  colour: string
  /** CSS pixels (the canvas is already scaled for the pixel ratio) */
  width: number
  /** The look's ink: the leaf, the plane's fold and the knots' outline */
  ink: string
  /** The paper colour, for the plane's body */
  paper: string
  /** Draw the travelling plane or leaf at the head (while the line is still drawing) */
  head: boolean
  /** Seconds, for the leaf's sway */
  time: number
  /** A wide soft pass under the line (a look's glow): the same dots and dashes in the same places, only wider */
  halo?: boolean
  /** What travels the line (default: the line style's own) and its size, 1 as drawn (run 26 tuning) */
  icon?: Exclude<Icon, "auto">
  iconSize?: number
  /** Run 27: the point the icon flies at on a line that's already drawn (the picker's planes keep flying) */
  at?: number
}

const PLANE = new Path2D("M1 0L-0.85 -0.7L-0.4 0L-0.85 0.7Z")
const PLANE_FOLD = new Path2D("M-0.4 0L1 0")
/** An orizuru seen from above, flying to +x: neck and head ahead, the tail behind, both wings spread */
const CRANE = new Path2D("M1.05 -0.06L0.62 0L0.28 -0.12L0.05 -0.95L-0.18 -0.12L-0.55 -0.05L-1 -0.32L-0.72 0L-1 0.32L-0.55 0.05L-0.18 0.12L0.05 0.95L0.28 0.12L0.62 0Z")
const CRANE_FOLD = new Path2D("M0.62 0L-0.72 0M0.05 -0.95L0.05 0.95")
/** Run 27, the video game look's plane: a little pixel sprite, nose to +x (1 is a pixel) */
const PIXEL_PLANE = [
  "...##...",
  "...###..",
  "#..####.",
  "########",
  "#..####.",
  "...###..",
  "...##...",
]
const LEAF = new Path2D("M0 -1L0.18 -0.55L0.55 -0.72L0.42 -0.25L0.95 -0.22L0.6 0.1L0.76 0.42L0.24 0.3L0.08 0.55L0.05 1L-0.05 1L-0.08 0.55L-0.24 0.3L-0.76 0.42L-0.6 0.1L-0.95 -0.22L-0.42 -0.25L-0.55 -0.72L-0.18 -0.55Z")

function path(g: CanvasRenderingContext2D, xs: ArrayLike<number>, ys: ArrayLike<number>, a: number, b: number) {
  g.beginPath(); g.moveTo(xs[a], ys[a])
  for (let i = a + 1; i <= b; i++) g.lineTo(xs[i], ys[i])
}

/** The inked route: a filled ribbon, thin at both ends and fullest in the middle, like a pen pressed harder mid-stroke */
function ribbon(g: CanvasRenderingContext2D, xs: ArrayLike<number>, ys: ArrayLike<number>, a: number, b: number, total: number, w: number) {
  if (b - a < 1) return
  const left: number[] = [], right: number[] = []
  for (let i = a; i <= b; i++) {
    const j = Math.min(total - 1, Math.max(1, i)), dx = xs[j] - xs[j - 1], dy = ys[j] - ys[j - 1], l = Math.hypot(dx, dy) || 1
    const r = (w / 2) * (0.35 + 0.95 * Math.pow(Math.sin((Math.PI * i) / (total - 1)), 0.6))
    left.push(xs[i] - (dy / l) * r, ys[i] + (dx / l) * r); right.push(xs[i] + (dy / l) * r, ys[i] - (dx / l) * r)
  }
  g.beginPath(); g.moveTo(left[0], left[1])
  for (let i = 2; i < left.length; i += 2) g.lineTo(left[i], left[i + 1])
  for (let i = right.length - 2; i >= 0; i -= 2) g.lineTo(right[i], right[i + 1])
  g.closePath(); g.fill()
}

function run(g: CanvasRenderingContext2D, style: LineStyle, xs: ArrayLike<number>, ys: ArrayLike<number>, a: number, b: number, total: number, o: LineDraw) {
  const w = o.width, k = o.halo ? 3.4 : 1
  g.strokeStyle = o.colour; g.fillStyle = o.colour; g.lineCap = "round"; g.lineJoin = "round"
  if (style === "ink") return ribbon(g, xs, ys, a, b, total, w * 1.25 * k)
  if (o.halo && style === "thread") { g.lineWidth = w * k; g.setLineDash([]); path(g, xs, ys, a, b); g.stroke(); return }
  if (style === "thread") {
    // A thread: the strand, then a fainter twist along it so it reads as spun
    g.lineWidth = w; g.setLineDash([]); path(g, xs, ys, a, b); g.stroke()
    g.lineWidth = Math.max(0.6, w * 0.4); g.setLineDash([w * 1.4, w * 1.6]); g.strokeStyle = "rgba(255, 255, 255, 0.38)"; g.stroke()
    return
  }
  if (style === "pixel") {
    // Chunky blocks, square ended, like a line drawn in big pixels
    g.lineCap = "butt"; g.lineJoin = "miter"; g.lineWidth = w * 1.9 * k; g.setLineDash([w * 2.4, w * 1.3])
    path(g, xs, ys, a, b); g.stroke(); return
  }
  g.lineWidth = k * (style === "dots" ? w * 1.5 : style === "stitch" ? w * 1.1 : Math.max(1, w * 0.75))
  g.setLineDash(style === "dots" ? [0.01, w * 2.8] : style === "stitch" ? [w * 3, w * 2.4] : [w * 1.2, w * 2.4])
  path(g, xs, ys, a, b); g.stroke()
}

/** One journey line, drawn up to point n of total. The first point is where they fly from; the last is Kyoto. */
export function drawLine(g: CanvasRenderingContext2D, style: LineStyle, xs: ArrayLike<number>, ys: ArrayLike<number>, al: ArrayLike<number>, n: number, total: number, o: LineDraw) {
  if (n < 2) return
  const end = Math.min(n, total) - 1
  g.save()
  if (travels(style)) g.globalAlpha *= 0.75
  const base = g.globalAlpha
  for (let a = 0; a < end;) {
    let b = a + 1
    while (b < end && al[b] === al[a]) b++
    if (al[a] > 0) { g.globalAlpha = base * al[a]; run(g, style, xs, ys, a, b, total, o) }
    a = b
  }
  g.setLineDash([])
  // The thread's knot where it starts
  if (style === "thread" && !o.halo && al[0] > 0) {
    g.globalAlpha = base * al[0]; g.fillStyle = o.colour; g.strokeStyle = o.ink; g.lineWidth = 0.8
    g.beginPath(); g.arc(xs[0], ys[0], o.width * 1.35, 0, Math.PI * 2); g.fill(); g.stroke()
    g.beginPath(); g.arc(xs[0] + o.width * 1.5, ys[0] - o.width * 0.6, o.width * 0.7, 0, Math.PI * 2); g.strokeStyle = o.colour; g.stroke()
  }
  // The plane, crane or leaf, travelling once: at the head while the line draws, gone when it lands. Three planes
  // fly in a V: the leader at the head, two smaller ones a few points behind, either side of the line.
  const icon = o.icon ?? iconFor(style)
  const head = o.at ?? end
  if (o.head && icon !== "none" && (o.at != null || end < total - 1) && al[head] > 0) {
    const s = Math.max(8, o.width * 4.2) * (o.iconSize ?? 1)
    const fly = (at: number, side: number, k: number) => {
      const i = Math.max(1, at), ang = Math.atan2(ys[i] - ys[i - 1], xs[i] - xs[i - 1]), z = s * k
      g.save()
      g.globalAlpha = Math.min(1, base / (travels(style) ? 0.75 : 1)) * al[at]
      g.translate(xs[at] - Math.sin(ang) * side * s, ys[at] + Math.cos(ang) * side * s)
      if (icon === "pixel") {
        // Turned in eighths, as an old game's sprite would be, each pixel a square
        g.rotate(Math.round(ang / (Math.PI / 4)) * (Math.PI / 4))
        const px = Math.max(1.5, z / 4.5)
        g.fillStyle = o.ink
        PIXEL_PLANE.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] === "#") g.fillRect((x - 4) * px - 0.5, (y - 3.5) * px - 0.5, px + 1, px + 1) })
        g.fillStyle = o.paper
        PIXEL_PLANE.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] === "#") g.fillRect((x - 4) * px, (y - 3.5) * px, px, px) })
      } else if (icon === "leaf") {
        g.rotate(ang + Math.PI / 2 + Math.sin(o.time * 3.2) * 0.45); g.scale(z * 0.9, z * 0.9)
        g.fillStyle = o.ink; g.fill(LEAF)
      } else {
        g.rotate(ang); g.scale(z, z)
        const body = icon === "crane" ? CRANE : PLANE, fold = icon === "crane" ? CRANE_FOLD : PLANE_FOLD
        g.fillStyle = o.paper; g.fill(body)
        g.lineWidth = 1 / z; g.strokeStyle = o.ink; g.stroke(body); g.stroke(fold)
      }
      g.restore()
    }
    fly(head, 0, 1)
    if (icon === "flock" && head > 5) { fly(head - 5, 0.9, 0.7); fly(head - 5, -0.9, 0.7) }
  }
  g.restore()
}
