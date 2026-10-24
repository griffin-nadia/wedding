import type { Look } from "../globes24/kit-view"
import { breathe, grain, land, latY, lonX, seeded, sheet } from "../globes24/kit-paint"

/**
 * Run 26, a folded road map: the world as a much-used fold-out map. Pale sea with tinted depth bands off the coasts,
 * pastel countries with dashed borders, a fine graticule, eight by four panels folded concertina-style (the fold
 * light is a few lines of shader, so the creases turn with the world), the paper rubbed white where the folds cross,
 * and a coffee ring in the Indian Ocean. A flock of three paper planes flies each line, as if folded from the map.
 */
const COL = {
  day: { sea: "#cfe3ea", band: "rgba(70, 130, 160, 0.12)", land: ["#f2d4cf", "#f3e6b0", "#d9e6c4", "#e2d8ea"], border: "#b55b8a", coast: "#5d8aa0", grid: "rgba(60, 110, 140, 0.25)", crease: "rgba(90, 70, 50, 0.22)", wear: "rgba(255, 255, 250, 0.75)", ring: "rgba(120, 70, 30, 0.28)" },
  night: { sea: "#1d3140", band: "rgba(120, 170, 200, 0.08)", land: ["#4a3a38", "#4a4430", "#36402f", "#3e3846"], border: "#c58aa8", coast: "#88aec0", grid: "rgba(140, 180, 200, 0.18)", crease: "rgba(0, 0, 0, 0.35)", wear: "rgba(200, 200, 190, 0.25)", ring: "rgba(200, 150, 100, 0.2)" },
}
const COLS = 8, ROWS = 4

export const look: Look = {
  line: "ink",
  icon: "flock",
  shade: 0.2,
  rim: 1,
  inks: (night) => (night
    ? { nadia: "#ef6b5a", griffin: "#7fcf9a", guest: "#e3dccd", you: "#f2bf3a", ink: "#101a22", paper: "#fbf6e9" }
    : { nadia: "#c0392b", griffin: "#2c6e49", guest: "#36312c", you: "#e0a100", ink: "#2b2622", paper: "#fffdf6" }),
  back: (night) => (night ? COL.night.sea : COL.day.sea),
  // The concertina folds: each panel lit as a slope, alternating mountain and valley across, and a gentler fold down
  glsl: /* glsl */ `
    float fu = fract(fract(vUv.x) * ${COLS}.0), fv = fract(vUv.y * ${ROWS}.0);
    float cu = mod(floor(fract(vUv.x) * ${COLS}.0), 2.0), cv = mod(floor(vUv.y * ${ROWS}.0), 2.0);
    float slope = mix(fu, 1.0 - fu, cu) - 0.5, slopeV = mix(fv, 1.0 - fv, cv) - 0.5;
    col.rgb *= 1.0 + slope * 0.13 + slopeV * 0.06;`,
  paint: async ({ night, width: W }) => {
    const k = night ? COL.night : COL.day, [c, g] = sheet(W), H = W / 2, u = W / 2048, rnd = seeded(53)
    g.fillStyle = k.sea; g.fillRect(0, 0, W, H)
    const { all, countries } = await land(W)
    // Depth bands off every coast, darker nearer the land
    g.lineJoin = "round"
    for (const lw of [46, 30, 16]) { g.strokeStyle = k.band; g.lineWidth = lw * u; g.stroke(all) }
    await breathe(g)
    // The graticule, every 15°
    g.strokeStyle = k.grid; g.lineWidth = 0.8 * u; g.beginPath()
    for (let lon = -180; lon <= 180; lon += 15) { g.moveTo(lonX(lon, W), 0); g.lineTo(lonX(lon, W), H) }
    for (let lat = -75; lat <= 75; lat += 15) { g.moveTo(0, latY(lat, W)); g.lineTo(W, latY(lat, W)) }
    g.stroke()
    await breathe(g)
    // Pastel countries, dashed borders, the coast
    countries.forEach((x, i) => { g.fillStyle = k.land[(i * 3) % 4]; g.fill(x.path) })
    await breathe(g)
    g.setLineDash([5 * u, 3 * u]); g.strokeStyle = k.border; g.lineWidth = 1 * u
    for (const x of countries) g.stroke(x.path)
    g.setLineDash([])
    g.strokeStyle = k.coast; g.lineWidth = 1.3 * u; g.stroke(all)
    await breathe(g)
    // The creases, and the paper rubbed through where they cross
    g.strokeStyle = k.crease; g.lineWidth = 1.6 * u; g.beginPath()
    for (let i = 1; i < COLS; i++) { g.moveTo((i * W) / COLS, 0); g.lineTo((i * W) / COLS, H) }
    for (let j = 1; j < ROWS; j++) { g.moveTo(0, (j * H) / ROWS); g.lineTo(W, (j * H) / ROWS) }
    g.stroke()
    for (let i = 1; i < COLS; i++) for (let j = 1; j < ROWS; j++) {
      const x = (i * W) / COLS, y = (j * H) / ROWS, r = (6 + rnd() * 8) * u
      const b = g.createRadialGradient(x, y, 0, x, y, r); b.addColorStop(0, k.wear); b.addColorStop(1, "transparent")
      g.fillStyle = b; g.fillRect(x - r, y - r, r * 2, r * 2)
    }
    await breathe(g)
    // A coffee ring in the Indian Ocean
    const cx = lonX(78, W), cy = latY(-30, W), R = 70 * u
    g.strokeStyle = k.ring; g.lineWidth = 5 * u; g.beginPath(); g.ellipse(cx, cy, R, R * 0.96, 0.3, 0.2, Math.PI * 1.85); g.stroke()
    g.lineWidth = 2 * u; g.beginPath(); g.ellipse(cx + 4 * u, cy + 2 * u, R * 0.93, R * 0.9, 0.3, 0, Math.PI * 2); g.stroke()
    await breathe(g)
    grain(g, night ? 0.07 : 0.1, 53)
    return c
  },
}
