/**
 * Cuts Nadia's map pieces out of her venue map, off the main thread (stickers.ts). Her paper background (light, low
 * colour) is flooded away from each crop's edges, so only what's joined to the edge goes and the drawing's own whites
 * stay; the cut edge keeps half its ink, so it isn't jagged. Lab only.
 */
type Box = [x: number, y: number, w: number, h: number]
const isPaper = (d: Uint8ClampedArray, k: number) => {
  const r = d[k], g = d[k + 1], b = d[k + 2]
  return Math.max(r, g, b) - Math.min(r, g, b) < 26 && r + g + b > 3 * 168
}
async function cut(map: ImageBitmap, [x, y, w, h]: Box) {
  const c = new OffscreenCanvas(w, h), ctx = c.getContext("2d", { willReadFrequently: true })!
  ctx.drawImage(map, x, y, w, h, 0, 0, w, h)
  const im = ctx.getImageData(0, 0, w, h), d = im.data
  const seen = new Uint8Array(w * h), stack: number[] = []
  for (let i = 0; i < w; i++) stack.push(i, (h - 1) * w + i)
  for (let j = 0; j < h; j++) stack.push(j * w, j * w + w - 1)
  while (stack.length) {
    const p = stack.pop()!
    if (seen[p] || !isPaper(d, p * 4)) continue
    seen[p] = 1; d[p * 4 + 3] = 0
    const px = p % w
    if (px > 0) stack.push(p - 1); if (px < w - 1) stack.push(p + 1)
    if (p >= w) stack.push(p - w); if (p < w * (h - 1)) stack.push(p + w)
  }
  for (let p = 0; p < w * h; p++) if (!seen[p] && ((p % w > 0 && seen[p - 1]) || (p % w < w - 1 && seen[p + 1]) || seen[p - w] || seen[p + w])) d[p * 4 + 3] = 140
  ctx.putImageData(im, 0, 0)
  return c.convertToBlob({ type: "image/png" })
}
self.onmessage = async (e: MessageEvent<{ map: Blob; cuts: Record<string, Box> }>) => {
  const map = await createImageBitmap(e.data.map)
  const out: Record<string, Blob> = {}
  for (const [k, box] of Object.entries(e.data.cuts)) out[k] = await cut(map, box)
  map.close()
  ;(self as unknown as { postMessage: (m: unknown) => void }).postMessage(out)
}
