import { useEffect, useRef, useState } from "react"
import { loop } from "@/lib/frame"
import { useLang } from "@/lib/lang"
import { tween } from "../../motion"

/**
 * Experiment: the journey on a line-drawn globe (built on the lab's globe: Three.js, Natural Earth 1:110m borders
 * vendored in src/lab/data, a paper-coloured sphere). Nadia's line lifts off from Brisbane and Griffin's from Canada
 * (Edmonton), each drawing in as an arc above the paper; then the camera flies to Kyoto and the 京 seal lands.
 * Drag to spin it, with damping. Three.js and the borders load only when this mounts. Reduced motion: the last
 * frame, drawn once, as a still image.
 */
const BRISBANE: [number, number] = [-27.47, 153.03], EDMONTON: [number, number] = [53.55, -113.49], KYOTO: [number, number] = [35.01, 135.77]
const START: [number, number] = [14, -172] // over the Pacific, with both cities and Kyoto in view

const css = `
.x-globe2 { position: relative; isolation: isolate; height: 100svh; min-height: 100svh; overflow: hidden; touch-action: none; background: radial-gradient(ellipse at 50% 42%, var(--letter-bg) 0%, color-mix(in oklab, var(--letter-bg) 50%, var(--surface-alt)) 55%, var(--surface-alt) 100%); color: var(--ink); cursor: grab; }
.x-globe2:active { cursor: grabbing; }
.x-globe2::before { content: ""; position: absolute; inset: 0; z-index: -1; background: var(--paper-live, none) center / cover; mix-blend-mode: var(--paper-blend); opacity: 0.6; pointer-events: none; }
.x-globe2-stage { position: absolute; inset: 0; }
.x-globe2-stage canvas, .x-globe2-stage img { position: absolute; inset: 0; display: block; width: 100%; height: 100%; }
.x-globe2-label { position: absolute; left: 0; top: 0; padding: 3px 8px; border-radius: var(--radius-pill); background: var(--letter-bg); color: var(--ink); box-shadow: var(--elevation-raised); font: 500 var(--type-label-size) / var(--type-label-leading) var(--font-label); white-space: nowrap; pointer-events: none; transition: opacity 200ms linear; will-change: transform; }
.x-globe2-label i { display: inline-block; width: 8px; height: 8px; margin-right: 6px; border-radius: 50%; vertical-align: 0; }
.x-globe2-seal { position: absolute; left: 0; top: 0; width: 44px; height: 44px; margin: -22px 0 0 -22px; display: grid; place-items: center; border-radius: 10px; background: var(--action); color: var(--action-ink); font: 24px/1 var(--font-ja); box-shadow: 0 10px 24px -10px rgb(var(--tint-shadow) / 0.6); opacity: 0; pointer-events: none; }
.x-globe2-seal[data-landed] .x-globe2-seal-in { animation: x-globe2-stamp 620ms cubic-bezier(0.3, 1.5, 0.5, 1) both; }
.x-globe2-seal[data-landed] { opacity: 1; }
.x-globe2-seal-in { display: grid; place-items: center; width: 100%; height: 100%; }
@keyframes x-globe2-stamp { 0% { opacity: 0; transform: translateY(-40px) scale(1.9) rotate(-12deg); } 100% { opacity: 1; transform: none; } }
.x-globe2-top { position: absolute; left: 0; right: 0; top: 16px; text-align: center; font: 500 var(--type-label-size) / var(--type-label-leading) var(--font-label); letter-spacing: var(--type-label-tracking); text-transform: uppercase; color: var(--ink-story); pointer-events: none; }
.x-globe2-legend { position: absolute; left: 0; right: 0; bottom: calc(16px + env(safe-area-inset-bottom)); display: flex; flex-wrap: wrap; justify-content: center; gap: 6px 20px; margin: 0; padding: 0 16px; list-style: none; font-size: var(--type-small-size); color: var(--ink-soft); pointer-events: none; }
.x-globe2-legend li { display: inline-flex; align-items: center; gap: 8px; }
.x-globe2-legend span { display: inline-block; width: 22px; border-top: 3px solid; border-radius: 2px; }
@media (prefers-reduced-motion: reduce) { .x-globe2-seal[data-landed] .x-globe2-seal-in { animation: none; } }
`
export default function JourneyGlobe() {
  const { t } = useLang()
  const box = useRef<HTMLDivElement>(null), stage = useRef<HTMLDivElement>(null), seal = useRef<HTMLDivElement>(null)
  const labels = useRef<(HTMLSpanElement | null)[]>([])
  const [still, setStill] = useState<string | null>(null)

  useEffect(() => {
    const el = stage.current, root = box.current
    if (!el || !root) return
    let alive = true, stop = () => {}
    void Promise.all([
      import("three"), import("three/examples/jsm/controls/OrbitControls.js"), import("three/examples/jsm/lines/Line2.js"),
      import("three/examples/jsm/lines/LineMaterial.js"), import("three/examples/jsm/lines/LineGeometry.js"), import("../../../data/borders-110m.json"),
    ]).then(([THREE, { OrbitControls }, { Line2 }, { LineMaterial }, { LineGeometry }, data]) => {
      if (!alive) return
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches
      let w = el.clientWidth, h = el.clientHeight
      // The site's colours are oklch, which Three.js can't read: let a canvas turn them into RGB
      const rgb = (v: string, fallback: string) => {
        const x = document.createElement("canvas").getContext("2d")!
        x.fillStyle = fallback; x.fillStyle = getComputedStyle(root).getPropertyValue(v).trim() || fallback; x.fillRect(0, 0, 1, 1)
        const [r, g, b] = x.getImageData(0, 0, 1, 1).data
        return new THREE.Color(r / 255, g / 255, b / 255).convertSRGBToLinear()
      }
      const ink = rgb("--ink", "#421a05"), paper = rgb("--letter-bg", "#f3e7d3"), nadia = rgb("--ink-story", "#a84f32"), griffin = rgb("--ink-moss", "#727354")
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: reduce })
      renderer.setPixelRatio(Math.min(2, devicePixelRatio)); renderer.setSize(w, h)
      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 100)
      const toV = (lat: number, lon: number, r = 1) => { const p = (90 - lat) * Math.PI / 180, q = (lon + 180) * Math.PI / 180; return new THREE.Vector3(-r * Math.sin(p) * Math.cos(q), r * Math.cos(p), r * Math.sin(p) * Math.sin(q)) }
      // Far enough that the whole globe fits the short side, with room for the arcs and labels
      const fit = () => 1.38 / Math.tan((camera.fov * Math.PI) / 360) / Math.min(1, camera.aspect)

      scene.add(new THREE.Mesh(new THREE.SphereGeometry(0.995, 72, 54), new THREE.MeshBasicMaterial({ color: paper })))
      const borderMat = new THREE.LineBasicMaterial({ color: ink, transparent: true, opacity: 0.62 })
      for (const line of (data.default as { lines: number[][][] }).lines) scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(line.map(([lon, lat]) => toV(lat, lon, 1.001))), borderMat))
      // A faint graticule, every 30°, like the lines on an old school globe
      const grid = new THREE.LineBasicMaterial({ color: ink, transparent: true, opacity: 0.1 })
      for (let lat = -60; lat <= 60; lat += 30) scene.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 121 }, (_, i) => toV(lat, i * 3, 1.0005))), grid))
      for (let lon = -180; lon < 180; lon += 30) scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 61 }, (_, i) => toV(-90 + i * 3, lon, 1.0005))), grid))

      // The two lines to Kyoto: great-circle arcs lifting off the paper, drawn in by how many segments show
      const N = 160
      const arcLine = (from: [number, number], colour: InstanceType<typeof THREE.Color>) => {
        const a = toV(...from), b = toV(...KYOTO), om = a.angleTo(b), pts: number[] = []
        for (let i = 0; i < N; i++) {
          const s = i / (N - 1), v = a.clone().multiplyScalar(Math.sin((1 - s) * om)).add(b.clone().multiplyScalar(Math.sin(s * om))).divideScalar(Math.sin(om))
          v.setLength(1.004 + 0.2 * om * Math.sin(Math.PI * s)); pts.push(v.x, v.y, v.z)
        }
        const g = new LineGeometry(); g.setPositions(pts)
        const m = new LineMaterial({ color: colour.getHex(), linewidth: 3, transparent: true })
        m.resolution.set(w, h)
        const line = new Line2(g, m); line.computeLineDistances(); g.instanceCount = 0
        scene.add(line)
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.014, 16, 12), new THREE.MeshBasicMaterial({ color: colour })); dot.position.copy(toV(...from, 1.003)); scene.add(dot)
        return { g, m, draw: (p: number) => { g.instanceCount = Math.max(0, Math.round(p * (N - 1))) } }
      }
      const arcs = [arcLine(BRISBANE, nadia), arcLine(EDMONTON, griffin)]
      const kyotoDot = new THREE.Mesh(new THREE.SphereGeometry(0.016, 16, 12), new THREE.MeshBasicMaterial({ color: ink })); kyotoDot.position.copy(toV(...KYOTO, 1.003)); scene.add(kyotoDot)

      const controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true; controls.dampingFactor = 0.07; controls.enablePan = false; controls.rotateSpeed = 0.55
      el.appendChild(renderer.domElement)

      const startDir = toV(...START).normalize(), endDir = toV(KYOTO[0] - 6, KYOTO[1], 1).normalize()
      const startDist = fit() * 1.05, endDist = fit() * 0.95
      controls.minDistance = endDist * 0.8; controls.maxDistance = startDist * 1.6
      const setCam = (dir: InstanceType<typeof THREE.Vector3>, dist: number) => { camera.position.copy(dir).multiplyScalar(dist); camera.lookAt(0, 0, 0) }
      setCam(reduce ? endDir : startDir, reduce ? endDist : startDist)

      const places = [{ v: toV(...BRISBANE, 1.01) }, { v: toV(...EDMONTON, 1.01) }, { v: toV(...KYOTO, 1.01) }]
      const place = () => {
        const cam = camera.position.clone().normalize()
        places.forEach(({ v }, i) => {
          const l = labels.current[i]
          const p = v.clone().project(camera), x = ((p.x + 1) / 2) * w, y = ((1 - p.y) / 2) * h, front = v.clone().normalize().dot(cam) > 0.12
          if (l) { l.style.transform = i === 2 ? `translate(${x + 28}px, ${y - 12}px)` : `translate(${x + 10}px, ${y - 12}px)`; l.style.opacity = front ? "1" : "0" }
          if (i === 2 && seal.current) { seal.current.style.transform = `translate(${x}px, ${y}px)`; seal.current.style.visibility = front ? "" : "hidden" }
        })
      }
      const land = () => seal.current?.setAttribute("data-landed", "")

      if (reduce) {
        arcs.forEach((a) => a.draw(1)); controls.update(); renderer.render(scene, camera); place(); land()
        setStill(renderer.domElement.toDataURL("image/png")); renderer.domElement.remove(); controls.dispose(); renderer.dispose()
        return
      }

      // The sequence: both lines draw in (Griffin's a beat after Nadia's), then the camera flies to Kyoto, then the seal
      const cancels: (() => void)[] = []
      let flying = true
      const ease = (s: number) => (s < 0.5 ? 4 * s * s * s : 1 - Math.pow(-2 * s + 2, 3) / 2)
      const fly = () => {
        if (!flying) return land()
        const from = camera.position.clone().normalize(), d0 = camera.position.length()
        const q = new THREE.Quaternion().setFromUnitVectors(from, endDir), q0 = new THREE.Quaternion()
        cancels.push(tween(2400, (s, done) => {
          if (!flying) return
          const dir = from.clone().applyQuaternion(q0.clone().slerp(q, s))
          setCam(dir, d0 + (endDist - d0) * s)
          if (done) { flying = false; land() }
        }, ease))
      }
      cancels.push(tween(2800, (s, done) => {
        arcs[0].draw(Math.min(1, s * 1.45)); arcs[1].draw(Math.max(0, Math.min(1, s * 1.45 - 0.45)))
        if (done) fly()
      }, (s) => s))
      // Dragging takes over from the flight at once (the seal still lands)
      controls.addEventListener("start", () => { if (flying) { flying = false; land() } })

      const ro = new ResizeObserver(() => {
        w = el.clientWidth; h = el.clientHeight
        renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); arcs.forEach((a) => a.m.resolution.set(w, h))
      })
      ro.observe(el)
      const cancel = loop(() => { if (!flying) controls.update(); renderer.render(scene, camera); place() })
      stop = () => { cancel(); cancels.forEach((c) => c()); ro.disconnect(); controls.dispose(); renderer.dispose(); renderer.domElement.remove() }
    })
    return () => { alive = false; stop() }
  }, [])

  const names = [
    { name: t.journey.brisbane, colour: "var(--ink-story)" },
    { name: t.journey.canada, colour: "var(--ink-moss)" },
    { name: t.journey.kyoto, colour: "" },
  ]
  return (
    <div ref={box} className="x-globe2" role="img" aria-label={`${t.journey.list.nadia}. ${t.journey.list.griffin}.`}>
      <style>{css}</style>
      <div ref={stage} className="x-globe2-stage">{still && <img src={still} alt="" />}</div>
      {names.map((n, i) => (
        <span key={i} ref={(e) => { labels.current[i] = e }} className="x-globe2-label" style={{ opacity: 0 }} aria-hidden>
          {n.colour && <i style={{ background: n.colour }} />}{n.name}
        </span>
      ))}
      <div ref={seal} className="x-globe2-seal" aria-hidden><span className="x-globe2-seal-in">京</span></div>
      <p className="x-globe2-top" aria-hidden>{t.home.dateLine}</p>
      <ul className="x-globe2-legend" aria-hidden>
        <li><span style={{ borderColor: "var(--ink-story)" }} />{t.journey.list.nadia}</li>
        <li><span style={{ borderColor: "var(--ink-moss)" }} />{t.journey.list.griffin}</li>
      </ul>
    </div>
  )
}
