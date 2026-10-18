import { useEffect, useRef, useState } from "react"
import { ART } from "@/lib/art"
import { loop } from "@/lib/frame"
import { useLang } from "@/lib/lang"
import { useTheme } from "@/lib/theme"
import type { City } from "@/lib/city-search"

/**
 * The journey on a painted globe (final run). Three.js loads only here, when it mounts. The globe's picture is
 * painted on this device (src/lib/paint-globe.ts: watercolour washes, pooled edges, paper grain) or is Nadia's
 * painted land once ART.globeLand is set. Griffin's line (Canada) and Nadia's (Australia) draw first; then every other
 * coming household's city as faint dotted lines, one per city, never who; last, this household's own line in gold.
 * It turns to face Kyoto as the lines draw, and can be turned by a finger or a mouse after.
 * Reduced motion: held facing Kyoto with every line already drawn, nothing turning or flying.
 * The pixel ratio is capped (1.5 on phones), and it stops drawing whenever it's off screen.
 */
type Line = { from: [number, number]; kind: "nadia" | "griffin" | "guest" | "you" }
const KYOTO: [number, number] = [35.01, 135.77], BRISBANE: [number, number] = [-27.47, 153.03], EDMONTON: [number, number] = [53.55, -113.49]

export function JourneyGlobe({ you, cities, label }: { you: City | null; cities: { lat: number; lon: number; n: number }[]; label: string }) {
  const { t } = useLang()
  const { theme } = useTheme()
  const box = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    const el = box.current
    if (!el) return
    let alive = true, stop = () => {}
    void Promise.all([import("three"), import("three/examples/jsm/lines/Line2.js"), import("three/examples/jsm/lines/LineMaterial.js"), import("three/examples/jsm/lines/LineGeometry.js"), import("@/lib/paint-globe")])
      .then(async ([THREE, { Line2 }, { LineMaterial }, { LineGeometry }, { paintGlobe }]) => {
        if (!alive) return
        const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches, phone = matchMedia("(pointer: coarse)").matches
        // The site's colours are oklch, which Three.js can't read: a canvas turns them into RGB
        const css = getComputedStyle(el)
        const hex = (v: string, fb: string) => {
          const x = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!
          x.fillStyle = fb; x.fillStyle = css.getPropertyValue(v).trim() || fb; x.fillRect(0, 0, 1, 1)
          const [r, g, b] = x.getImageData(0, 0, 1, 1).data
          return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`
        }
        const night = theme === "lantern"
        let tex: InstanceType<typeof THREE.Texture>
        if (ART.globeLand) {
          tex = await new THREE.TextureLoader().loadAsync(`${import.meta.env.BASE_URL}${ART.globeLand}`)
        } else {
          const canvas = await paintGlobe(night
            ? { sea: "#3a3a36", seaDeep: "#2c2b27", land: "#6b6a4c", landEdge: "#2e2c1c", bloom: "#8a7a52", grain: 10 }
            : { sea: "#e6e6dc", seaDeep: "#d8dbd2", land: "#c9c19a", landEdge: "#7d7550", bloom: "#b5a77a", grain: 12 }, phone ? 1024 : 2048)
          tex = new THREE.CanvasTexture(canvas)
        }
        if (!alive) return
        tex.colorSpace = THREE.SRGBColorSpace
        let w = el.clientWidth, h = el.clientHeight
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: reduce })
        renderer.setPixelRatio(Math.min(phone ? 1.5 : 2, devicePixelRatio)); renderer.setSize(w, h)
        const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(32, w / h, 0.1, 100)
        const toV = (lat: number, lon: number, r = 1) => { const p = (90 - lat) * Math.PI / 180, q = (lon + 180) * Math.PI / 180; return new THREE.Vector3(-r * Math.sin(p) * Math.cos(q), r * Math.cos(p), r * Math.sin(p) * Math.sin(q)) }
        const globe = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 64), new THREE.MeshBasicMaterial({ map: tex }))
        scene.add(globe)
        const colour = { nadia: hex("--ink-story", "#a84f32"), griffin: hex("--ink-moss", "#727354"), guest: hex("--ink-soft", "#754b38"), you: hex("--journey-you", "#d5a34f") }
        const N = 140
        const make = ({ from, kind }: Line) => {
          const a = toV(...from), b = toV(...KYOTO), om = a.angleTo(b), pts: number[] = []
          if (om < 0.01) return null
          for (let i = 0; i < N; i++) {
            const s = i / (N - 1), v = a.clone().multiplyScalar(Math.sin((1 - s) * om)).add(b.clone().multiplyScalar(Math.sin(s * om))).divideScalar(Math.sin(om))
            v.setLength(1.004 + 0.09 * om * Math.sin(Math.PI * s)); pts.push(v.x, v.y, v.z)
          }
          const g = new LineGeometry(); g.setPositions(pts)
          const dotted = kind === "guest"
          const m = new LineMaterial({ color: new THREE.Color(colour[kind]).getHex(), linewidth: kind === "you" ? 3.2 : dotted ? 1.4 : 2.4, transparent: true, opacity: dotted ? 0.55 : 1, dashed: dotted, dashSize: 0.018, gapSize: 0.014 })
          m.resolution.set(w, h)
          const line = new Line2(g, m); line.computeLineDistances(); g.instanceCount = reduce ? N - 1 : 0
          scene.add(line)
          return { g, m, draw: (p: number) => { g.instanceCount = Math.max(0, Math.round(p * (N - 1))) } }
        }
        // Home lines first, then everyone else's (one per city), then theirs
        const lines: Line[] = [{ from: BRISBANE, kind: "nadia" }, { from: EDMONTON, kind: "griffin" }, ...cities.map((c) => ({ from: [c.lat, c.lon] as [number, number], kind: "guest" as const }))]
        if (you && you.lat != null && you.lon != null && you.id !== "jp") lines.push({ from: [you.lat, you.lon], kind: "you" })
        const arcs = lines.map(make).filter(Boolean) as NonNullable<ReturnType<typeof make>>[]
        const seal = new THREE.Mesh(new THREE.SphereGeometry(0.018, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(hex("--action", "#5b6b3a")) }))
        seal.position.copy(toV(...KYOTO, 1.004)); scene.add(seal)
        const dist = 1.3 / Math.tan((camera.fov * Math.PI) / 360) / Math.min(1, camera.aspect)
        const face = toV(KYOTO[0] - 12, KYOTO[1] + 4).normalize()
        const startFace = toV(5, -175).normalize() // over the Pacific, every line in view
        const setCam = (dir: InstanceType<typeof THREE.Vector3>) => { camera.position.copy(dir).multiplyScalar(dist); camera.lookAt(0, 0, 0) }
        el.appendChild(renderer.domElement)
        if (reduce) { setCam(face); renderer.render(scene, camera); stop = () => { renderer.dispose(); renderer.domElement.remove() }; return }
        setCam(startFace)
        // Turn by dragging (after the lines have drawn)
        let yaw = 0, pitch = 0, dragging: { x: number; y: number } | null = null
        const down = (e: PointerEvent) => { dragging = { x: e.clientX, y: e.clientY }; renderer.domElement.setPointerCapture(e.pointerId) }
        const move = (e: PointerEvent) => { if (!dragging) return; yaw -= (e.clientX - dragging.x) * 0.006; pitch = Math.max(-1.2, Math.min(1.2, pitch + (e.clientY - dragging.y) * 0.006)); dragging = { x: e.clientX, y: e.clientY } }
        const up = () => { dragging = null }
        renderer.domElement.addEventListener("pointerdown", down); renderer.domElement.addEventListener("pointermove", move); renderer.domElement.addEventListener("pointerup", up)
        const t0 = performance.now(), ease = (s: number) => (s < 0.5 ? 4 * s * s * s : 1 - Math.pow(-2 * s + 2, 3) / 2)
        const q = new THREE.Quaternion().setFromUnitVectors(startFace, face)
        let visible = true
        const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
        io.observe(el)
        const cancel = loop((now) => {
          if (!visible) return true // off screen: nothing drawn until it's back
          const s = (now - t0) / 1000
          // 0 to 1.2 s the home lines, 1.2 to 2.6 s everyone else's, then theirs; the turn to Kyoto over 3 s
          arcs.forEach((a, i) => {
            const kind = lines[i]?.kind
            const start = kind === "nadia" ? 0 : kind === "griffin" ? 0.25 : kind === "guest" ? 1.2 + (i % 8) * 0.12 : 2.6
            a.draw(Math.min(1, Math.max(0, (s - start) / 1.1)))
          })
          const turn = ease(Math.min(1, s / 3))
          const dir = startFace.clone().applyQuaternion(new THREE.Quaternion().slerp(q, turn))
          dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw).applyAxisAngle(new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw), pitch)
          setCam(dir.normalize())
          renderer.render(scene, camera)
          return true
        })
        const ro = new ResizeObserver(() => { w = el.clientWidth; h = el.clientHeight; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); arcs.forEach((a) => a.m.resolution.set(w, h)) })
        ro.observe(el)
        stop = () => { cancel(); io.disconnect(); ro.disconnect(); renderer.dispose(); renderer.domElement.remove() }
      })
      .catch(() => setFailed(true))
    return () => { alive = false; stop() }
  }, [you, cities, theme])
  if (failed) return null
  return <div ref={box} className="journey-globe" role="img" aria-label={label}><span className="sr-only">{t.journey.title}</span></div>
}
