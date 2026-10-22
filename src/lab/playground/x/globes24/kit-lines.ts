import type { LineStyle } from "./kit-data"

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
}

const PLANE = new Path2D("M1 0L-0.85 -0.7L-0.4 0L-0.85 0.7Z")
const PLANE_FOLD = new Path2D("M-0.4 0L1 0")
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
  const w = o.width
  g.strokeStyle = o.colour; g.fillStyle = o.colour; g.lineCap = "round"; g.lineJoin = "round"
  if (style === "ink") return ribbon(g, xs, ys, a, b, total, w * 1.25)
  if (style === "thread") {
    // A thread: the strand, then a fainter twist along it so it reads as spun
    g.lineWidth = w; g.setLineDash([]); path(g, xs, ys, a, b); g.stroke()
    g.lineWidth = Math.max(0.6, w * 0.4); g.setLineDash([w * 1.4, w * 1.6]); g.strokeStyle = "rgba(255, 255, 255, 0.38)"; g.stroke()
    return
  }
  g.lineWidth = style === "dots" ? w * 1.5 : style === "stitch" ? w * 1.1 : Math.max(1, w * 0.75)
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
  if (style === "thread" && al[0] > 0) {
    g.globalAlpha = base * al[0]; g.fillStyle = o.colour; g.strokeStyle = o.ink; g.lineWidth = 0.8
    g.beginPath(); g.arc(xs[0], ys[0], o.width * 1.35, 0, Math.PI * 2); g.fill(); g.stroke()
    g.beginPath(); g.arc(xs[0] + o.width * 1.5, ys[0] - o.width * 0.6, o.width * 0.7, 0, Math.PI * 2); g.strokeStyle = o.colour; g.stroke()
  }
  // The plane or the leaf, travelling once: at the head while the line draws, gone when it lands
  if (o.head && travels(style) && end < total - 1 && al[end] > 0) {
    const i = Math.max(1, end), ang = Math.atan2(ys[i] - ys[i - 1], xs[i] - xs[i - 1])
    const s = Math.max(8, o.width * 4.2)
    g.globalAlpha = Math.min(1, base / 0.75) * al[end]
    g.translate(xs[end], ys[end])
    if (style === "plane") {
      g.rotate(ang); g.scale(s, s)
      g.fillStyle = o.paper; g.fill(PLANE)
      g.lineWidth = 1 / s; g.strokeStyle = o.ink; g.stroke(PLANE); g.stroke(PLANE_FOLD)
    } else {
      g.rotate(ang + Math.PI / 2 + Math.sin(o.time * 3.2) * 0.45); g.scale(s * 0.9, s * 0.9)
      g.fillStyle = o.ink; g.fill(LEAF)
    }
  }
  g.restore()
}
