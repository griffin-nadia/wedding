import { useEffect, useState } from "react"

/** A QR code drawn in the browser (no third-party service). Uses currentColor, so it suits both modes. */
export function Qr({ value, label, className }: { value: string; label: string; className?: string }) {
  const [path, setPath] = useState<{ d: string; size: number } | null>(null)
  useEffect(() => {
    let live = true
    import("qrcode-generator").then(({ default: qrcode }) => {
      const qr = qrcode(0, "M")
      qr.addData(value)
      qr.make()
      const n = qr.getModuleCount()
      let d = ""
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`
      if (live) setPath({ d, size: n })
    })
    return () => { live = false }
  }, [value])
  return (
    <svg role="img" aria-label={label} viewBox={path ? `-2 -2 ${path.size + 4} ${path.size + 4}` : "0 0 1 1"} className={className} shapeRendering="crispEdges">
      {path && <path d={path.d} fill="currentColor" />}
    </svg>
  )
}
