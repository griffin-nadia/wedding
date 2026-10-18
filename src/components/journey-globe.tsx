import { useEffect, useRef, useState, type ReactNode } from "react"
import { ART } from "@/lib/art"
import { loop } from "@/lib/frame"
import { useLang } from "@/lib/lang"
import { useTheme } from "@/lib/theme"
import type { City } from "@/lib/city-search"

/**
 * The journey on a painted globe. Three.js loads only here, when it mounts. The picture is painted on this device
 * (src/lib/paint-globe.ts) or is Nadia's painted land once ART.globeLand is set.
 * Run 19, see-through: the globe is drawn twice, its far side first (faint, through the glass) and its near side last
 * as a half-strength wash, so the far side's countries show through as it turns. Lines sit between the two: a line on
 * the far side is softened by the near side's wash, a line on the near side is in front of it.
 * Lines: Griffin's (Canada) and Nadia's (Australia) draw first; then every other coming household's city as faint
 * dotted lines, one per city, never who; last, this household's own, in gold, with a darker edge under it so it
 * reads on the pale land. Kyoto is pinned with its seal and date, an upright label that follows it round the spin
 * (dimmed while Kyoto is on the far side, never mirrored).
 * Turning: it opens over the Pacific and turns to face Kyoto as the lines draw, then turns slowly on its own. A
 * finger or a mouse takes it (pointer capture, so the story's swipe never gets the drag): it follows with damping,
 * keeps turning with inertia when let go, the tilt is clamped, and the slow turn waits 3 s after the last touch and
 * eases back in, so the two never fight. Reduced motion: held facing Kyoto with every line already drawn, nothing
 * turning, flying or following.
 * The pixel ratio is capped (1.5 on phones), and it stops drawing whenever it's off screen.
 */
type Line = { from: [number, number]; kind: "nadia" | "griffin" | "guest" | "you" }
const KYOTO: [number, number] = [35.01, 135.77], BRISBANE: [number, number] = [-27.47, 153.03], EDMONTON: [number, number] = [53.55, -113.49]
/** The turn's feel: degrees a second on its own, the wait after a touch, the follow and the glide */
const TURN = { auto: 5, wait: 3000, easeIn: 1500, follow: 16, glide: 2.4, tilt: 55 }

export function JourneyGlobe({ you, cities, label, children }: { you: City | null; cities: { lat: number; lon: number; n: number; country?: string }[]; label: string; children?: ReactNode }) {
  const { t } = useLang()
  const { theme } = useTheme()
  const box = useRef<HTMLDivElement>(null)
  const pin = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    const el = box.current
    if (!el) return
    let alive = true, stop = () => {}
    void Promise.all([import("three"), import("three/examples/jsm/lines/Line2.js"), import("three/examples/jsm/lines/LineMaterial.js"), import("three/examples/jsm/lines/LineGeometry.js"), import("@/lib/paint-globe")])
      .then(async ([THREE, { Line2 }, { LineMaterial }, { LineGeometry }, { paintGlobe, GLOBE_LOOK }]) => {
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
        const countries = [...cities.map((c) => c.country ?? ""), you?.country ?? ""].filter(Boolean)
        let tex: InstanceType<typeof THREE.Texture>
        if (ART.globeLand) tex = await new THREE.TextureLoader().loadAsync(`${import.meta.env.BASE_URL}${ART.globeLand}`)
        else tex = new THREE.CanvasTexture(await paintGlobe(night ? GLOBE_LOOK.night : GLOBE_LOOK.day, phone ? 1024 : 2048, countries))
        if (!alive) return
        tex.colorSpace = THREE.SRGBColorSpace
        let w = el.clientWidth, h = el.clientHeight
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: reduce })
        renderer.setPixelRatio(Math.min(phone ? 1.5 : 2, devicePixelRatio)); renderer.setSize(w, h)
        const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(32, w / h, 0.1, 100)
        const toV = (lat: number, lon: number, r = 1) => { const p = (90 - lat) * Math.PI / 180, q = (lon + 180) * Math.PI / 180; return new THREE.Vector3(-r * Math.sin(p) * Math.cos(q), r * Math.cos(p), r * Math.sin(p) * Math.sin(q)) }
        // The far side first, faint, then (after the lines) the near side's wash
        const sphere = new THREE.SphereGeometry(1, 96, 64)
        const far = new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, transparent: true, opacity: 0.5, depthWrite: false }))
        const near = new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ map: tex, side: THREE.FrontSide, transparent: true, depthWrite: false }))
        far.renderOrder = 0; near.renderOrder = 3
        scene.add(far, near)
        const colour = { nadia: hex("--ink-story", "#a84f32"), griffin: hex("--ink-moss", "#727354"), guest: hex("--ink-soft", "#754b38"), you: hex("--journey-you", "#d5a34f"), edge: hex("--ink", "#3b2a20") }
        const N = 140
        const make = ({ from, kind }: Line) => {
          const a = toV(...from), b = toV(...KYOTO), om = a.angleTo(b), pts: number[] = []
          if (om < 0.01) return null
          for (let i = 0; i < N; i++) {
            const s = i / (N - 1), v = a.clone().multiplyScalar(Math.sin((1 - s) * om)).add(b.clone().multiplyScalar(Math.sin(s * om))).divideScalar(Math.sin(om))
            v.setLength(1.004 + 0.09 * om * Math.sin(Math.PI * s)); pts.push(v.x, v.y, v.z)
          }
          const g = new LineGeometry(); g.setPositions(pts)
          const dotted = kind === "guest", mine = kind === "you"
          const parts = [new LineMaterial({ color: new THREE.Color(colour[kind]).getHex(), linewidth: mine ? 3.4 : dotted ? 1.4 : 2.4, transparent: true, opacity: dotted ? 0.5 : 1, dashed: dotted, dashSize: 0.018, gapSize: 0.014 })]
          // Their own line gets a soft darker edge under it, so the gold holds on pale land and in Lantern
          if (mine) parts.unshift(new LineMaterial({ color: new THREE.Color(colour.edge).getHex(), linewidth: 6.5, transparent: true, opacity: 0.18, depthWrite: false }))
          const lines = parts.map((m, i) => {
            m.resolution.set(w, h)
            const line = new Line2(g, m); line.computeLineDistances(); line.renderOrder = mine ? 2 + i * 0.1 : 1
            scene.add(line)
            return line
          })
          g.instanceCount = reduce ? N - 1 : 0
          return { g, ms: lines.map((l) => l.material as InstanceType<typeof LineMaterial>), draw: (p: number) => { g.instanceCount = Math.max(0, Math.round(p * (N - 1))) } }
        }
        // Home lines first, then everyone else's (one per city), then theirs, last
        const lines: Line[] = [{ from: BRISBANE, kind: "nadia" }, { from: EDMONTON, kind: "griffin" }, ...cities.map((c) => ({ from: [c.lat, c.lon] as [number, number], kind: "guest" as const }))]
        if (you && you.lat != null && you.lon != null && you.id !== "jp") lines.push({ from: [you.lat, you.lon], kind: "you" })
        const arcs = lines.map((l) => ({ kind: l.kind, arc: make(l) })).filter((a) => a.arc) as { kind: Line["kind"]; arc: NonNullable<ReturnType<typeof make>> }[]
        const dot = (at: [number, number], r: number, c: string) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(c) })); m.position.copy(toV(...at, 1.004)); m.renderOrder = 1; scene.add(m) }
        dot(KYOTO, 0.018, hex("--action", "#5b6b3a"))
        const last = lines[lines.length - 1]
        if (last.kind === "you") dot(last.from, 0.014, colour.you)
        const dist = 1.3 / Math.tan((camera.fov * Math.PI) / 360) / Math.min(1, camera.aspect)
        // Where the camera looks from, as the latitude and longitude it's over (any longitude: no wrapping, no jump)
        const view = { lat: KYOTO[0] - 12, lon: KYOTO[1] + 4 }
        const kyoto = toV(...KYOTO, 1.004)
        const setCam = () => { camera.position.copy(toV(view.lat, view.lon).normalize().multiplyScalar(dist)); camera.lookAt(0, 0, 0) }
        // Kyoto's label, pinned: an upright HTML label moved to wherever Kyoto is on screen, on whichever side keeps
        // it inside the globe's square, dimmed while Kyoto is round the back
        const placePin = () => {
          const p = pin.current
          if (!p) return
          const s = kyoto.clone().project(camera), x = ((s.x + 1) / 2) * w, y = ((1 - s.y) / 2) * h
          const back = kyoto.dot(camera.position) < 0.3 * dist // round the edge or behind
          p.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
          p.dataset.side = x > w * 0.55 ? "left" : "right"
          p.dataset.back = String(back)
        }
        el.prepend(renderer.domElement)
        if (reduce) { setCam(); renderer.render(scene, camera); placePin(); stop = () => { renderer.dispose(); renderer.domElement.remove() }; return }
        // Opens over the Pacific, every line in view, then turns the short way to Kyoto
        const start = { lat: 5, lon: -175 }, face = { ...view }
        face.lon = start.lon + ((((face.lon - start.lon) % 360) + 540) % 360) - 180
        Object.assign(view, start)
        const target = { ...start }, vel = { lat: 0, lon: 0 }
        let dragging: { id: number; x: number; y: number; t: number } | null = null, touched = -Infinity, intro = true
        const perPx = () => 180 / Math.max(160, el.clientWidth) // a drag across the globe turns it half way
        const down = (e: PointerEvent) => {
          if (dragging || (e.pointerType === "mouse" && e.button !== 0)) return
          e.stopPropagation()
          renderer.domElement.setPointerCapture(e.pointerId)
          dragging = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp }; intro = false; vel.lat = vel.lon = 0
          Object.assign(target, view); el.dataset.dragging = ""
        }
        const move = (e: PointerEvent) => {
          if (!dragging || e.pointerId !== dragging.id) return
          const k = perPx(), dLon = -(e.clientX - dragging.x) * k, dLat = (e.clientY - dragging.y) * k, dt = Math.max(1, e.timeStamp - dragging.t) / 1000
          target.lon += dLon; target.lat = Math.max(-TURN.tilt, Math.min(TURN.tilt, target.lat + dLat))
          // The release speed: smoothed over the last few moves, so one jittery event can't fling it
          vel.lon = vel.lon * 0.6 + (dLon / dt) * 0.4; vel.lat = vel.lat * 0.6 + (dLat / dt) * 0.4
          dragging = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp }
        }
        const up = (e: PointerEvent) => {
          if (!dragging || e.pointerId !== dragging.id) return
          if (e.timeStamp - dragging.t > 80) vel.lat = vel.lon = 0 // held still before letting go: no glide
          dragging = null; touched = performance.now(); delete el.dataset.dragging
        }
        const cv = renderer.domElement
        cv.addEventListener("pointerdown", down); cv.addEventListener("pointermove", move)
        cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up); cv.addEventListener("lostpointercapture", up)
        const t0 = performance.now(), ease = (s: number) => (s < 0.5 ? 4 * s * s * s : 1 - Math.pow(-2 * s + 2, 3) / 2)
        let visible = true, then = t0
        const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
        io.observe(el)
        const cancel = loop((now) => {
          const dt = Math.min(0.05, (now - then) / 1000); then = now
          if (!visible) return true // off screen: nothing drawn until it's back
          const s = (now - t0) / 1000
          // 0 to 1.2 s the home lines, 1.2 to 2.6 s everyone else's, then theirs, last
          arcs.forEach(({ kind, arc }, i) => {
            const at = kind === "nadia" ? 0 : kind === "griffin" ? 0.25 : kind === "guest" ? 1.2 + (i % 8) * 0.12 : 2.6
            arc.draw(Math.min(1, Math.max(0, (s - at) / 1.1)))
          })
          if (intro) {
            // The turn to Kyoto over 3 s; then it holds on Kyoto for the wait before turning on its own
            const k = ease(Math.min(1, s / 3))
            target.lat = start.lat + (face.lat - start.lat) * k; target.lon = start.lon + (face.lon - start.lon) * k
            if (s >= 3) { intro = false; touched = now }
          } else if (!dragging) {
            // Let go: it glides on and slows; the slow turn comes back 3 s after the last touch, easing in
            target.lon += vel.lon * dt; target.lat += vel.lat * dt
            const f = Math.exp(-TURN.glide * dt); vel.lon *= f; vel.lat *= f
            if (Math.abs(target.lat) > TURN.tilt) { target.lat = Math.sign(target.lat) * TURN.tilt; vel.lat = 0 }
            const back = Math.min(1, Math.max(0, (now - touched - TURN.wait) / TURN.easeIn))
            target.lon -= TURN.auto * back * back * dt
          }
          // The globe follows its target with damping (no snapping to the finger, no jitter from uneven events)
          const follow = intro ? 1 : 1 - Math.exp(-TURN.follow * dt)
          view.lat += (target.lat - view.lat) * follow; view.lon += (target.lon - view.lon) * follow
          setCam()
          renderer.render(scene, camera)
          placePin()
          return true
        })
        const ro = new ResizeObserver(() => { w = el.clientWidth; h = el.clientHeight; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); arcs.forEach(({ arc }) => arc.ms.forEach((m) => m.resolution.set(w, h))) })
        ro.observe(el)
        stop = () => { cancel(); io.disconnect(); ro.disconnect(); renderer.dispose(); renderer.domElement.remove() }
      })
      .catch(() => setFailed(true))
    return () => { alive = false; stop() }
  }, [you, cities, theme])
  if (failed) return null
  return (
    <div className="journey-globe">
      <div ref={box} className="journey-globe-art" role="img" aria-label={label}>
        <div ref={pin} className="globe-pin" aria-hidden><div className="globe-pin-body"><span className="globe-pin-seal">京</span><span className="globe-pin-text">{t.journey.kyotoPin}</span></div></div>
        <span className="sr-only">{t.journey.title}</span>
      </div>
      {children}
    </div>
  )
}
