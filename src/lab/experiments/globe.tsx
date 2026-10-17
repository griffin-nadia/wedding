import { useEffect, useRef, useState } from "react"
import { loop } from "@/lib/frame"

/**
 * Experiment: a line-drawn globe. Country borders and coasts from Natural Earth 1:110m, vendored in
 * src/lab/data/borders-110m.json (scripts/vendor-borders.mjs; never fetched at runtime), drawn as thin lines on a
 * paper-coloured sphere with Three.js. Placeholder cities are HTML labels placed each frame by projecting their
 * point, hidden when they turn to the far side. OrbitControls with damping; Three.js and the data load only when
 * this card mounts. Under reduced motion it renders once and shows that frame as a still image.
 */
const CITIES: [string, number, number][] = [["Kyoto", 35.0, 135.8], ["Brisbane", -27.5, 153.0], ["Melbourne", -37.8, 145.0], ["Perth", -31.9, 115.9], ["Edmonton", 53.5, -113.5]]
const css = `
.x-globe { position: relative; height: 340px; border-radius: var(--radius-section); overflow: hidden; background: var(--surface-alt); touch-action: none; }
.x-globe canvas, .x-globe img { display: block; width: 100%; height: 100%; }
.x-globe-label { position: absolute; left: 0; top: 0; padding: 2px 6px; border-radius: var(--radius-control); background: var(--letter-bg); color: var(--ink); font: 500 var(--type-label-size) / var(--type-label-leading) var(--font-label); white-space: nowrap; pointer-events: none; box-shadow: var(--elevation-raised); }
`
export default function Globe() {
  const box = useRef<HTMLDivElement>(null)
  const [still, setStill] = useState<string | null>(null)
  useEffect(() => {
    const el = box.current
    if (!el) return
    let stop = () => {}
    let alive = true
    void Promise.all([import("three"), import("three/examples/jsm/controls/OrbitControls.js"), import("../data/borders-110m.json")]).then(([THREE, { OrbitControls }, data]) => {
      if (!alive) return
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches
      const w = el.clientWidth, h = el.clientHeight
      // The site's colours are oklch, which Three.js can't read: let a canvas turn them into RGB
      const rgb = (v: string, fallback: string) => {
        const x = document.createElement("canvas").getContext("2d")!
        x.fillStyle = fallback; x.fillStyle = getComputedStyle(el).getPropertyValue(v).trim() || fallback; x.fillRect(0, 0, 1, 1)
        const [r, g, b] = x.getImageData(0, 0, 1, 1).data
        return new THREE.Color(r / 255, g / 255, b / 255).convertSRGBToLinear()
      }
      const ink = rgb("--ink", "#421a05"), paper = rgb("--letter-bg", "#f3e7d3")
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: reduce })
      renderer.setPixelRatio(Math.min(2, devicePixelRatio)); renderer.setSize(w, h)
      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 100); camera.position.set(0, 0.6, 3.6)
      const toV = (lat: number, lon: number, r = 1) => { const p = (90 - lat) * Math.PI / 180, t = (lon + 180) * Math.PI / 180; return new THREE.Vector3(-r * Math.sin(p) * Math.cos(t), r * Math.cos(p), r * Math.sin(p) * Math.sin(t)) }
      scene.add(new THREE.Mesh(new THREE.SphereGeometry(0.995, 64, 48), new THREE.MeshBasicMaterial({ color: paper })))
      const mat = new THREE.LineBasicMaterial({ color: ink, transparent: true, opacity: 0.75 })
      for (const line of (data.default as { lines: number[][][] }).lines) scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(line.map(([lon, lat]) => toV(lat, lon, 1.001))), mat))
      // Face Kyoto to start
      scene.rotation.y = -((135.8 + 90) * Math.PI) / 180
      const controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true; controls.dampingFactor = 0.08; controls.enablePan = false; controls.minDistance = 2.2; controls.maxDistance = 6
      el.appendChild(renderer.domElement)
      const labels = CITIES.map(([name, lat, lon]) => {
        const l = document.createElement("span"); l.className = "x-globe-label"; l.textContent = name; el.appendChild(l)
        return { l, v: toV(lat, lon, 1.01) }
      })
      const place = () => {
        const cam = camera.position.clone().normalize()
        for (const { l, v } of labels) {
          const world = v.clone().applyEuler(scene.rotation)
          const p = world.clone().project(camera)
          l.style.transform = `translate(${((p.x + 1) / 2) * w + 6}px, ${((1 - p.y) / 2) * h - 10}px)`
          l.style.opacity = world.dot(cam) > 0.15 ? "1" : "0"
        }
      }
      if (reduce) {
        renderer.render(scene, camera); place()
        setStill(renderer.domElement.toDataURL("image/png")); renderer.domElement.remove(); controls.dispose(); renderer.dispose()
        return
      }
      const cancel = loop(() => { controls.update(); renderer.render(scene, camera); place() })
      stop = () => { cancel(); controls.dispose(); renderer.dispose(); el.replaceChildren() }
    })
    return () => { alive = false; stop() }
  }, [])
  return (
    <div ref={box} className="x-globe" role="img" aria-label="A line-drawn globe with Kyoto, Brisbane, Melbourne, Perth and Edmonton marked">
      <style>{css}</style>
      {still && <img src={still} alt="" />}
    </div>
  )
}
