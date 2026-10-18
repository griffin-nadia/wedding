import { useEffect, useRef, useState } from "react"
import { getJourneys, SAMPLE_JOURNEYS } from "@/lib/api"
import { loop } from "@/lib/frame"
import { useLang } from "@/lib/lang"
import { useTheme } from "@/lib/theme"
import { getSpeed, still } from "../../motion"
import { useKnob, useTake } from "../../params"
import { cssHex, paint, type Inks, type Style } from "./paint"

/**
 * The globe three ways, with every line (lab run 19). Same journey as the site's globe (journey-globe.tsx): Nadia's
 * line from Brisbane and Griffin's from Edmonton, then one faint dotted line per guest city (never who), then this
 * household's own in gold, all as arcs above the paper. Three hands for the land (paint.ts): see-through watercolour
 * washes (the far side shows faintly through), an ink line drawing with hatching, or gouache cut from paper.
 * - The turn: a finger or mouse turns it directly, and a flick carries on and slows (velocity from the last 80 ms,
 *   eased out over about half a second), with pitch held within a gentle range by a soft spring. Arrow keys turn it too.
 * - The Kyoto label: an HTML label pinned to Kyoto each frame (a transform), fading out as Kyoto turns away.
 * Reduced motion: facing Kyoto, every line drawn, no flying; it still turns under a finger, without the coasting.
 * The sample household's own line (gold) is drawn from Melbourne, one of the site's sample cities.
 */
type LineKind = "nadia" | "griffin" | "guest" | "you"
const KYOTO: [number, number] = [35.01, 135.77], BRISBANE: [number, number] = [-27.47, 153.03], EDMONTON: [number, number] = [53.55, -113.49]
const P = "x-gs"
const css = `
.${P} { position: relative; width: 100%; max-width: 560px; aspect-ratio: 1; margin-inline: auto; touch-action: none; }
.${P} canvas { display: block; width: 100% !important; height: 100% !important; cursor: grab; outline: 2px solid transparent; outline-offset: 2px; border-radius: 50%; }
.${P} canvas:active { cursor: grabbing; }
.${P} canvas:focus-visible { outline-color: var(--input-focus); }
.${P}-label { position: absolute; left: 0; top: 0; pointer-events: none; will-change: transform, opacity; display: flex; flex-direction: column; align-items: center; gap: 1px;
  translate: -50% calc(-100% - 10px); font: 500 var(--type-small-size) / 1.1 var(--font-label); color: var(--ink); }
.${P}-label b { font: 400 calc(var(--type-small-size) * 1.15) / 1 var(--font-display); }
.${P}-label span { font-family: var(--font-ja); font-size: 11px; color: var(--ink-soft); }
.${P}-label::after { content: ""; width: 1px; height: 8px; background: currentColor; opacity: .6; margin-top: 2px; }
.${P}-legend { display: flex; flex-wrap: wrap; justify-content: center; gap: var(--space-2) var(--space-4); font-size: var(--type-small-size); color: var(--ink-soft); }
.${P}-legend i { display: inline-block; width: 18px; height: 3px; border-radius: 2px; vertical-align: middle; margin-right: 6px; }
.${P}-loading { position: absolute; inset: 0; display: grid; place-items: center; color: var(--ink-muted); font-size: var(--type-small-size); }
`
export default function JourneyGlobeStyles() {
  const style = useTake("watercolour") as Style
  const label = useKnob("label", "on")
  const { theme } = useTheme()
  const { t } = useLang()
  const box = useRef<HTMLDivElement>(null)
  const tag = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    const el = box.current
    if (!el) return
    let alive = true, stop = () => {}
    setReady(false)
    void Promise.all([import("three"), import("three/examples/jsm/lines/Line2.js"), import("three/examples/jsm/lines/LineMaterial.js"), import("three/examples/jsm/lines/LineGeometry.js"), getJourneys()])
      .then(async ([THREE, { Line2 }, { LineMaterial }, { LineGeometry }, cities]) => {
        if (!alive) return
        const reduce = still(), phone = matchMedia("(pointer: coarse)").matches
        const night = theme === "lantern"
        const inks: Inks = {
          night,
          paper: cssHex(el, "--letter-bg", night ? "#2e1b12" : "#f6ecdc"),
          sea: night ? "#2f3a3c" : style === "gouache" ? "#b9c7c0" : "#c9d6d2",
          land: style === "gouache" ? (night ? "#7c7a52" : "#c7b98a") : night ? "#8a8660" : "#b9ad7e",
          edge: night ? "#2a2716" : "#6f6642", ink: cssHex(el, "--ink", night ? "#f1e3c8" : "#4a2a1a"), bloom: night ? "#a49567" : "#9c8d5c",
        }
        const canvas = await paint(style, inks, phone ? 1024 : 2048)
        if (!alive) return
        const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4
        let w = el.clientWidth, h = el.clientHeight
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: reduce })
        renderer.setPixelRatio(Math.min(phone ? 1.5 : 2, devicePixelRatio)); renderer.setSize(w, h)
        const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(32, w / h, 0.1, 100)
        const toV = (lat: number, lon: number, r = 1) => { const p = (90 - lat) * Math.PI / 180, q = (lon + 180) * Math.PI / 180; return new THREE.Vector3(-r * Math.sin(p) * Math.cos(q), r * Math.cos(p), r * Math.sin(p) * Math.sin(q)) }
        const sphere = new THREE.SphereGeometry(1, 96, 64)
        if (style === "watercolour") {
          // See-through: the far side first, faint and mirrored as it would be through thin paper, then the near side
          scene.add(new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.35, side: THREE.BackSide, depthWrite: false })))
          scene.add(new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.FrontSide, depthWrite: false })))
        } else scene.add(new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ map: tex })))
        // Ink: a drawn rim round the globe, as a pen would outline it
        if (style === "ink") {
          const rim = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.014, 160), new THREE.MeshBasicMaterial({ color: new THREE.Color(inks.ink), transparent: true, opacity: 0.8, depthTest: false }))
          scene.add(rim); (scene.userData as { rim?: typeof rim }).rim = rim
        }
        const colour: Record<LineKind, string> = { nadia: cssHex(el, "--ink-story", "#a84f32"), griffin: cssHex(el, "--ink-moss", "#727354"), guest: inks.ink, you: cssHex(el, "--journey-you", "#d5a34f") }
        const N = 140
        type Arc = { g: InstanceType<typeof LineGeometry>; m: InstanceType<typeof LineMaterial>; kind: LineKind; start: number }
        const make = (from: [number, number], kind: LineKind, start: number): Arc | null => {
          const a = toV(...from), b = toV(...KYOTO), om = a.angleTo(b), pts: number[] = []
          if (om < 0.01) return null
          for (let i = 0; i < N; i++) {
            const s = i / (N - 1), v = a.clone().multiplyScalar(Math.sin((1 - s) * om)).add(b.clone().multiplyScalar(Math.sin(s * om))).divideScalar(Math.sin(om))
            v.setLength(1.004 + 0.09 * om * Math.sin(Math.PI * s)); pts.push(v.x, v.y, v.z)
          }
          const g = new LineGeometry(); g.setPositions(pts)
          const dotted = kind === "guest"
          const m = new LineMaterial({ color: new THREE.Color(colour[kind]).getHex(), linewidth: kind === "you" ? 3.2 : dotted ? 1.3 : 2.4, transparent: true, opacity: dotted ? (style === "watercolour" ? 0.5 : 0.6) : 1, dashed: dotted, dashSize: 0.018, gapSize: 0.014 })
          m.resolution.set(w, h)
          const line = new Line2(g, m); line.computeLineDistances(); g.instanceCount = reduce ? N - 1 : 0
          scene.add(line)
          return { g, m, kind, start }
        }
        const arcs = [
          make(BRISBANE, "nadia", 0), make(EDMONTON, "griffin", 0.25),
          ...(cities.length ? cities : SAMPLE_JOURNEYS).map((c, i) => make([c.lat, c.lon], "guest", 1.2 + (i % 8) * 0.12)),
          make([SAMPLE_JOURNEYS[0].lat, SAMPLE_JOURNEYS[0].lon], "you", 2.6),
        ].filter(Boolean) as Arc[]
        const seal = new THREE.Mesh(new THREE.SphereGeometry(0.018, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(cssHex(el, "--action", "#5b6b3a")) }))
        const kyoto = toV(...KYOTO, 1.004); seal.position.copy(kyoto); scene.add(seal)
        const dist = 1.3 / Math.tan((camera.fov * Math.PI) / 360) / Math.min(1, camera.aspect)
        const face = toV(KYOTO[0] - 12, KYOTO[1] + 4).normalize()
        const startFace = reduce ? face : toV(5, -175).normalize()
        const cam = new THREE.Vector3()
        const setCam = (dir: InstanceType<typeof THREE.Vector3>) => { camera.position.copy(dir).multiplyScalar(dist); camera.lookAt(0, 0, 0) }
        const cnv = renderer.domElement
        cnv.tabIndex = 0
        cnv.setAttribute("aria-label", "The globe. Drag, or use the arrow keys, to turn it.")
        el.appendChild(cnv)

        // The turn: yaw and pitch with velocity. Dragging writes them directly; a flick carries on and slows
        let yaw = 0, pitch = 0, vy = 0, vp = 0, dragging = false
        const samples: { t: number; x: number; y: number }[] = []
        const K = 0.0062 // radians per CSS pixel
        const down = (e: PointerEvent) => { dragging = true; vy = vp = 0; samples.length = 0; samples.push({ t: e.timeStamp, x: e.clientX, y: e.clientY }); cnv.setPointerCapture(e.pointerId) }
        const move = (e: PointerEvent) => {
          if (!dragging) return
          // Every point the pointer passed through since the last frame, for a smooth line on fast phones
          for (const c of e.getCoalescedEvents?.() ?? [e]) {
            const last = samples[samples.length - 1]
            yaw -= (c.clientX - last.x) * K; pitch = Math.max(-1.1, Math.min(1.1, pitch + (c.clientY - last.y) * K))
            samples.push({ t: c.timeStamp, x: c.clientX, y: c.clientY })
          }
          while (samples.length > 2 && samples[samples.length - 1].t - samples[0].t > 80) samples.shift()
        }
        const up = () => {
          if (!dragging) return
          dragging = false
          const a = samples[0], b = samples[samples.length - 1], dt = Math.max(8, b.t - a.t) / 1000
          if (!reduce && samples.length > 1) { vy = -((b.x - a.x) * K) / dt; vp = ((b.y - a.y) * K) / dt }
        }
        const key = (e: KeyboardEvent) => {
          const d = { ArrowLeft: [1.4, 0], ArrowRight: [-1.4, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key]
          if (!d) return
          e.preventDefault()
          if (reduce) { yaw += d[0] * 0.15; pitch = Math.max(-1.1, Math.min(1.1, pitch + d[1] * 0.15)) } else { vy += d[0]; vp += d[1] }
        }
        cnv.addEventListener("pointerdown", down); cnv.addEventListener("pointermove", move); cnv.addEventListener("pointerup", up); cnv.addEventListener("pointercancel", up); cnv.addEventListener("keydown", key)

        const t0 = performance.now(), ease = (s: number) => (s < 0.5 ? 4 * s * s * s : 1 - Math.pow(-2 * s + 2, 3) / 2)
        const qTurn = new THREE.Quaternion().setFromUnitVectors(startFace, face)
        const up3 = new THREE.Vector3(0, 1, 0), side = new THREE.Vector3(), proj = new THREE.Vector3()
        let visible = true, then = t0, clock = 0
        const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting }); io.observe(el)
        setReady(true)
        const draw = (now: number) => {
          const dt = Math.min(0.05, (now - then) / 1000) * getSpeed(); then = now; clock += dt
          if (!dragging) {
            yaw += vy * dt; pitch += vp * dt
            const f = Math.exp(-dt * 4.2); vy *= f; vp *= f // about half a second to come to rest
            if (Math.abs(pitch) > 1.1) { pitch += (Math.sign(pitch) * 1.1 - pitch) * Math.min(1, dt * 10); vp *= 0.6 }
          }
          for (const a of arcs) a.g.instanceCount = reduce ? N - 1 : Math.max(0, Math.round(Math.min(1, Math.max(0, (clock - a.start) / 1.1)) * (N - 1)))
          const turn = reduce ? 1 : ease(Math.min(1, clock / 3))
          cam.copy(startFace).applyQuaternion(new THREE.Quaternion().slerp(qTurn, turn)).applyAxisAngle(up3, yaw)
          side.set(1, 0, 0).applyAxisAngle(up3, yaw)
          cam.applyAxisAngle(side, pitch).normalize()
          setCam(cam)
          const rim = (scene.userData as { rim?: InstanceType<typeof THREE.Mesh> }).rim
          if (rim) rim.lookAt(camera.position)
          renderer.render(scene, camera)
          // Kyoto's label: pinned to the city, fading as it turns to the far side
          const lbl = tag.current
          if (lbl) {
            proj.copy(kyoto).project(camera)
            const facing = kyoto.clone().normalize().dot(cam)
            lbl.style.transform = `translate3d(${((proj.x + 1) / 2) * w}px, ${((1 - proj.y) / 2) * h}px, 0)`
            lbl.style.opacity = String(Math.max(0, Math.min(1, (facing - 0.15) * 4)) * Math.min(1, clock / 2.6))
          }
        }
        const cancel = loop((now) => { if (visible) draw(now); return true })
        const ro = new ResizeObserver(() => { w = el.clientWidth; h = el.clientHeight; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); arcs.forEach((a) => a.m.resolution.set(w, h)) })
        ro.observe(el)
        stop = () => { cancel(); io.disconnect(); ro.disconnect(); renderer.dispose(); tex.dispose(); cnv.remove() }
      })
      .catch(() => setFailed(true))
    return () => { alive = false; stop() }
  }, [style, theme])
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <style>{css}</style>
      <div ref={box} className={P} role="group" aria-label={t.journey.title}>
        {!ready && !failed && <p className={`${P}-loading`} aria-live="polite">Painting the globe…</p>}
        {failed && <p className={`${P}-loading`}>No WebGL here: the flat map is the fallback (Journey → Painted flat map).</p>}
        {label === "on" && <div ref={tag} className={`${P}-label`} style={{ opacity: 0 }} aria-hidden><b>Kyoto</b><span>京都</span></div>}
      </div>
      <p className={`${P}-legend`}>
        <span><i style={{ background: "var(--ink-story)" }} />Nadia, from Brisbane</span>
        <span><i style={{ background: "var(--ink-moss)" }} />Griffin, from Canada</span>
        <span><i style={{ background: "repeating-linear-gradient(90deg, var(--ink) 0 4px, transparent 4px 7px)" }} />Every guest city</span>
        <span><i style={{ background: "var(--journey-you)" }} />Yours (sample)</span>
      </p>
    </div>
  )
}
