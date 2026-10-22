/**
 * The one projection behind every look (globes24 kit). A point is (lat, dl, alt): latitude, longitude relative to the
 * view's centre (radians, unwrapped, so a line crossing the date line stays in one piece) and height above the land.
 * m is the morph: 0 the flat paper map, 1 the globe. The paper curls from its edges in (an edge point starts curling
 * first, the centre last), so it reads as a sheet wrapping round a ball, not a cross-fade.
 * The shader in kit-three.ts does exactly this per vertex; place() does it on the CPU for the lines and labels, so
 * both always agree. Keep the two in step if you change one.
 */
export const FOV = 32 // degrees, vertical
export const ASPECT = 5 / 4 // the map's box, fixed, so nothing moves when you switch
export const TAN = Math.tan((FOV * Math.PI) / 360)
/** The camera's distance: the globe (radius 1) fills about four fifths of the box's height */
export const DIST = 1.25 / TAN
/** The flat map sits on the plane touching the globe's front (z = 1), centred on 4°N, 72°N to 64°S tall (the site's frame) */
export const LAT_F = (4 * Math.PI) / 180
export const FLAT = ((DIST - 1) * TAN) / ((68 * Math.PI) / 180)
/** How far a line's height lifts it north on the flat map, so the lines bow like flight paths */
export const LIFT = 1.1

/** How far a point has curled (0 flat .. 1 on the globe), from the morph and how far it is from the centre */
export function curl(m: number, dl: number) {
  const e = Math.min(1, Math.abs(dl) / Math.PI)
  const k = Math.max(0, Math.min(1, m * 1.6 - (1 - e) * 0.6))
  return k * k * (3 - 2 * k)
}

/** A point in view space for this morph and tilt (writes into out, returns it) */
export function place(lat: number, dl: number, alt: number, m: number, tilt: number, out: number[] = [0, 0, 0]) {
  const k = curl(m, dl), cl = Math.cos(lat), r = 1 + alt
  const sx = cl * Math.sin(dl), sy = Math.sin(lat), sz = cl * Math.cos(dl)
  const ty = sy * Math.cos(tilt) - sz * Math.sin(tilt), tz = sy * Math.sin(tilt) + sz * Math.cos(tilt)
  const fx = dl * FLAT, fy = (lat - LAT_F) * FLAT + alt * LIFT
  out[0] = fx + (sx * r - fx) * k; out[1] = fy + (ty * r - fy) * k; out[2] = 1 + (tz * r - 1) * k
  return out
}

/** Screen pixels for a view-space point in a w × h box */
export function project(p: number[], w: number, h: number, out: number[] = [0, 0]) {
  const d = DIST - p[2]
  out[0] = ((p[0] / (d * TAN * ASPECT)) + 1) * 0.5 * w
  out[1] = (1 - p[1] / (d * TAN)) * 0.5 * h
  return out
}

/** On the globe, is the point behind the ball (the camera's ray meets the sphere first)? */
export function hidden(p: number[]) {
  const dx = p[0], dy = p[1], dz = p[2] - DIST
  const a = dx * dx + dy * dy + dz * dz, b = 2 * DIST * dz, c = DIST * DIST - 1
  const disc = b * b - 4 * a * c
  if (disc <= 0) return false
  const t = (-b - Math.sqrt(disc)) / (2 * a)
  return t > 0 && t < 0.995
}

/** Wraps an angle into -π..π */
export const wrap = (a: number) => a - 2 * Math.PI * Math.round(a / (2 * Math.PI))
