import { useEffect, useState } from "react"

/**
 * A QR code drawn in the browser (no third-party service), soft and hand-made (run 21): rounded modules, rounded
 * corner eyes and a hand-drawn frame, all in currentColor (the ink) on the paper under it, so it suits both modes.
 * The code itself is unchanged, so it still scans (e2e/phone-qr.spec.ts decodes it at its displayed size, both themes).
 */
export function Qr({ value, label, className }: { value: string; label: string; className?: string }) {
  const [code, setCode] = useState<{ d: string; eyes: string; size: number } | null>(null)
  useEffect(() => {
    let live = true
    import("qrcode-generator").then(({ default: qrcode }) => {
      const qr = qrcode(0, "M")
      qr.addData(value)
      qr.make()
      const n = qr.getModuleCount()
      // The three finder patterns are drawn as eyes, so their modules are left out of the dots
      const corners = [[0, 0], [n - 7, 0], [0, n - 7]]
      const inEye = (r: number, c: number) => corners.some(([x, y]) => c >= x && c < x + 7 && r >= y && r < y + 7)
      let d = ""
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c) && !inEye(r, c)) d += box(c + 0.04, r + 0.04, 0.92, 0.36)
      // Each eye: a 7×7 ring (outer box minus the 5×5 inside, even-odd) and the 3×3 centre
      const eyes = corners.map(([x, y]) => box(x, y, 7, 2.2) + box(x + 1, y + 1, 5, 1.5) + box(x + 2, y + 2, 3, 1)).join("")
      if (live) setCode({ d, eyes, size: n })
    })
    return () => { live = false }
  }, [value])
  const pad = 3.6 // the quiet zone (2.5 modules) and the frame around it
  return (
    <svg role="img" aria-label={label} viewBox={code ? `${-pad} ${-pad} ${code.size + 2 * pad} ${code.size + 2 * pad}` : "0 0 1 1"} className={className}>
      {code && <>
        <path d={code.d} fill="currentColor" />
        <path d={code.eyes} fill="currentColor" fillRule="evenodd" />
        <path d={frame(code.size, pad - 0.7)} fill="none" stroke="currentColor" strokeWidth={0.32} strokeLinecap="round" strokeLinejoin="round" opacity={0.7} />
      </>}
    </svg>
  )
}

/** A rounded square as one closed path (clockwise) */
function box(x: number, y: number, s: number, r: number) {
  return `M${x + r} ${y}h${s - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}v${s - 2 * r}a${r} ${r} 0 0 1 ${-r} ${r}h${2 * r - s}a${r} ${r} 0 0 1 ${-r} ${-r}v${2 * r - s}a${r} ${r} 0 0 1 ${r} ${-r}z`
}

/** A hand-drawn rounded frame `gap` outside the code: a few gentle wobbles along each side, the same every time, and
 *  the line stopping just short of where it started, like a pen lifted */
function frame(n: number, gap: number) {
  const a = -gap, b = n + gap, r = 2.4, steps = 6
  const wob = (i: number) => Math.sin(i * 2.3) * 0.18 + Math.sin(i * 0.9) * 0.12
  const pts: [number, number][] = []
  const side = (x0: number, y0: number, x1: number, y1: number, k: number) => {
    for (let i = 0; i <= steps; i++) {
      const t = i / steps, nx = y1 - y0 ? 1 : 0, ny = x1 - x0 ? 1 : 0
      pts.push([x0 + (x1 - x0) * t + nx * wob(k * 10 + i), y0 + (y1 - y0) * t + ny * wob(k * 10 + i)])
    }
  }
  side(a + r, a, b - r, a, 1); side(b, a + r, b, b - r, 2); side(b - r, b, a + r, b, 3); side(a, b - r, a, a + r + 0.6, 4)
  // Smooth through the points (each corner rounds between the end of one side and the start of the next)
  let d = `M${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`
  for (let i = 1; i < pts.length; i++) {
    const [x, y] = pts[i], [px, py] = pts[i - 1]
    d += ` Q${px.toFixed(2)} ${py.toFixed(2)} ${((px + x) / 2).toFixed(2)} ${((py + y) / 2).toFixed(2)}`
  }
  return d
}
