import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react"
import { ART } from "@/lib/art"
import { loop } from "@/lib/frame"
import { useLang } from "@/lib/lang"
import { useTheme } from "@/lib/theme"
import type { City } from "@/lib/city-search"
import { bundle, nearHome, PACE, type ChapterPin, type Place } from "@/lib/journey-names"
import { ChapterPins } from "@/components/chapter-pins"

/**
 * The journey on a painted globe. Three.js loads only here, when it mounts. The picture is painted on this device
 * (src/lib/paint-globe.ts) or is Nadia's painted land once ART.globeLand is set.
 * Run 27: the antique globe Griffin and Nadia chose (paint-globe.ts), solid paper with an ink rim, by day in Autumn
 * and by night in Lantern. Lines on the far side are hidden by the paper; a line on the near side is in front of it.
 * Lines: Griffin's (Canada) and Nadia's (Australia) draw first; then every other coming household's city as faint
 * dotted lines, one per city, never who; last, this household's own, in gold, with a darker edge under it so it
 * reads on the pale land. Kyoto is pinned with its seal and date, an upright label that follows it round the spin
 * (dimmed while Kyoto is on the far side, never mirrored).
 * Turning: it opens over the Pacific and turns to face Kyoto as the lines draw, then turns slowly on its own. A
 * finger or a mouse takes it (pointer capture, so the story's swipe never gets the drag): it follows with damping,
 * keeps turning with inertia when let go, the tilt is clamped, and the slow turn waits 3 s after the last touch and
 * eases back in, so the two never fight. Reduced motion: held facing Kyoto with every line already drawn, nothing
 * turning, flying or following.
 * The pixel ratio is capped (1.5 on phones), and it stops drawing whenever it's off screen (or while held: the stop's
 * globe while the full-screen view is open).
 * Run 25, the cold-load flash: the camera's distance is worked out from the box's shape whenever the box changes (it
 * was only worked out once, from the first size), reduced motion redraws on a resize too, and the globe fades in over a
 * still disc of the same size once its first frame is drawn (data-ready), never an empty square.
 * Chapter pins (run 25): each chapter's place as a small numbered stamp, moved with the globe like the names.
 * Run 26: one line weight per kind, in screen px whatever the zoom, the same as the flat map's (home 2 dotted, guests
 * 1.2 dashed, a bundle 2.4, theirs 3 solid); a paper plane flies each line once, at the tip of the line as it draws
 * (none under reduced motion); zoom is the camera's own zoom (1x to 3x, the picture magnified, the lines' weight kept),
 * and only on the full-screen globe, whose box is the whole stage, so a zoomed globe never shows as a square.
 */
type Line = { from: [number, number]; kind: "nadia" | "griffin" | "guest" | "you"; bundled?: boolean; low?: boolean }
// Run 24: Griffin's line starts at Victoria (the brief: Kyoto, Brisbane and Victoria always labelled)
const KYOTO: [number, number] = [35.01, 135.77], BRISBANE: [number, number] = [-27.47, 153.03], VICTORIA: [number, number] = [48.43, -123.37]
/** Zoom range and the step for the + and − buttons (run 24) */
const ZOOM = { min: 1, max: 3 } // the step for + and − is the viewer's (story-journey.tsx STEP)
/** Run 26: each kind's line on screen, in px, shared with the flat map's CSS (index.css, .journey-flat-lines) */
const WEIGHT = { home: 2, guest: 1.2, bundle: 2.4, you: 2, edge: 4 } // run 26c: their line as strong as the home lines
const DASH = { home: [3, 3], guest: [2, 3] } as const
/** A paper plane pointing right (+x), 24 × 24, folded down the middle */
const PLANE = '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M2 11.5 22 3l-6.5 18-4-7.5z" fill="currentColor" stroke="var(--plane-edge)" stroke-width="1.3" stroke-linejoin="round"/><path d="M22 3 11.5 13.5" stroke="var(--plane-edge)" stroke-width="1.1"/></svg>'
/** The turn's feel: degrees a second on its own, the wait after a touch, the follow and the glide */
const TURN = { auto: 3.5, wait: 3000, easeIn: 1500, follow: 16, glide: 2.4, tilt: 55 }

export function JourneyGlobe({ you, cities, label, children, zoomable = false, held = false, pins = [], onPin, zoomRef }: { you: City | null; cities: { lat: number; lon: number; n: number; country?: string; name?: string }[]; label: string; children?: ReactNode; zoomable?: boolean; held?: boolean; pins?: ChapterPin[]; onPin?: (key: string) => void
  /** Run 26: the full-screen view's + and − (one pair for both views, in one spot): zoom by a factor */
  zoomRef?: RefObject<((f: number) => void) | null> }) {
  const { t, lang } = useLang()
  const brisbane = useRef<HTMLSpanElement>(null), victoria = useRef<HTMLSpanElement>(null), yours = useRef<HTMLSpanElement>(null), tip = useRef<HTMLSpanElement>(null)
  const own = useRef<((f: number) => void) | null>(null), zoomBy = zoomRef ?? own
  const { theme } = useTheme()
  const box = useRef<HTMLDivElement>(null)
  const pin = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)
  const [ready, setReady] = useState(false)
  const hold = useRef(held)
  hold.current = held
  const pinEls = useRef<(HTMLSpanElement | null)[]>([])
  const pinKey = pins.map((p) => p.key).join()
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
        // Guest cities by the naming rule, a country with many lines bundled into one (lib/journey-names.ts)
        const guests = bundle(cities.map((c) => ({ name: c.name ?? "", country: c.country ?? "", lat: c.lat, lon: c.lon, n: c.n }) as Place), lang, t.journey.households)
        let tex: InstanceType<typeof THREE.Texture>
        if (ART.globeLand) tex = await new THREE.TextureLoader().loadAsync(`${import.meta.env.BASE_URL}${ART.globeLand}`)
        else tex = new THREE.CanvasTexture(await paintGlobe(theme === "lantern", phone ? 1024 : 2048))
        if (!alive) return
        tex.colorSpace = THREE.SRGBColorSpace
        let w = el.clientWidth, h = el.clientHeight
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: reduce })
        renderer.setPixelRatio(Math.min(phone ? 1.5 : 2, devicePixelRatio)); renderer.setSize(w, h)
        const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(32, w / h, 0.1, 100)
        const toV = (lat: number, lon: number, r = 1) => { const p = (90 - lat) * Math.PI / 180, q = (lon + 180) * Math.PI / 180; return new THREE.Vector3(-r * Math.sin(p) * Math.cos(q), r * Math.cos(p), r * Math.sin(p) * Math.sin(q)) }
        // Run 27, the antique globe: solid paper, so no far side through it. An ink rim first (the back of a slightly
        // bigger ball, which only shows past the globe's edge), then the lines, then the paper over the far side's
        const sphere = new THREE.SphereGeometry(1, 96, 64)
        const rim = new THREE.Mesh(new THREE.SphereGeometry(1.012, 96, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color(hex("--ink", "#3b2a20")), side: THREE.BackSide, transparent: true, opacity: 0.7, depthWrite: false }))
        const near = new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ map: tex, side: THREE.FrontSide, transparent: true, depthWrite: false }))
        rim.renderOrder = 0; near.renderOrder = 3
        scene.add(rim, near)
        const colour = { nadia: hex("--ink-story", "#a84f32"), griffin: hex("--ink-moss", "#727354"), guest: hex("--journey-guest", "#6e4f2c"), you: hex("--journey-you", "#d5a34f"), edge: hex("--ink", "#3b2a20") }
        const N = 140
        const make = ({ from, kind, bundled = false, low = false }: Line) => {
          const a = toV(...from), b = toV(...KYOTO), om = a.angleTo(b), pts: number[] = []
          const side = a.clone().cross(b).normalize()
          if (om < 0.01) return null
          for (let i = 0; i < N; i++) {
            const s = i / (N - 1), v = a.clone().multiplyScalar(Math.sin((1 - s) * om)).add(b.clone().multiplyScalar(Math.sin(s * om))).divideScalar(Math.sin(om))
            // Beside a home line's start: lower, and bowed off to one side, so the two lines part and both read
            if (low) v.addScaledVector(side, 0.12 * om * Math.sin(Math.PI * s))
            v.setLength(1.004 + (low ? 0.05 : 0.09) * om * Math.sin(Math.PI * s)); pts.push(v.x, v.y, v.z)
          }
          const g = new LineGeometry(); g.setPositions(pts)
          const dotted = kind === "guest", mine = kind === "you", dash = dotted ? DASH.guest : mine ? null : DASH.home
          // Run 27: their own line gets an ink edge under it, so the gold holds on the antique globe's pale paper
          const edge = mine ? [new LineMaterial({ color: new THREE.Color(colour.edge).getHex(), linewidth: WEIGHT.edge, transparent: true, opacity: 0.35 })] : []
          const parts = [...edge, new LineMaterial({ color: new THREE.Color(colour[kind]).getHex(), linewidth: mine ? WEIGHT.you : dotted ? (bundled ? WEIGHT.bundle : WEIGHT.guest) : WEIGHT.home, transparent: true, opacity: dotted ? (bundled ? 0.7 : 0.5) : 1, dashed: Boolean(dash) })]
          const lines = parts.map((m, i) => {
            m.resolution.set(w, h)
            const line = new Line2(g, m); line.computeLineDistances(); line.renderOrder = mine ? 2 + i * 0.1 : 1
            scene.add(line)
            return line
          })
          g.instanceCount = reduce ? N - 1 : 0
          const ms = lines.map((l) => l.material as InstanceType<typeof LineMaterial>)
          // Dashes are set in px on screen (dashPx), worked out from the globe's size on screen
          const dashPx = (r: number) => { if (dash) for (const m of ms) { m.dashSize = dash[0] / r; m.gapSize = dash[1] / r } }
          const at = (i: number) => new THREE.Vector3(pts[i * 3], pts[i * 3 + 1], pts[i * 3 + 2])
          return { g, ms, dashPx, at, draw: (p: number) => { g.instanceCount = Math.max(0, Math.round(p * (N - 1))) } }
        }
        // Home lines first, then everyone else's (one per city), then theirs, last
        const lines: Line[] = [{ from: BRISBANE, kind: "nadia" }, { from: VICTORIA, kind: "griffin" }, ...guests.map((c) => ({ from: [c.lat, c.lon] as [number, number], kind: "guest" as const, bundled: c.bundled }))]
        if (you && you.lat != null && you.lon != null && you.id !== "jp") lines.push({ from: [you.lat, you.lon], kind: "you", low: nearHome(you.lat, you.lon) }) // beside a home line: a lower curve, so both read
        const arcs = lines.map((l) => ({ kind: l.kind, arc: make(l) })).filter((a) => a.arc) as { kind: Line["kind"]; arc: NonNullable<ReturnType<typeof make>> }[]
        const dot = (at: [number, number], r: number, c: string) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(c) })); m.position.copy(toV(...at, 1.004)); m.renderOrder = 1; scene.add(m) }
        dot(KYOTO, 0.018, hex("--brand-shiro-kinari", "#f4ecdb")) // cream, like its seal (run 26c)
        const last = lines[lines.length - 1]
        if (last.kind === "you") dot(last.from, 0.014, colour.you)
        // The camera's distance fits the globe in the box's shorter side: worked out again on every resize (run 25)
        const fit = () => 1.3 / Math.tan((camera.fov * Math.PI) / 360) / Math.min(1, camera.aspect || 1)
        let dist = fit()
        const zoom = { v: 1, t: 1 }
        const clampZoom = (z: number) => Math.min(ZOOM.max, Math.max(ZOOM.min, z))
        // Where the camera looks from, as the latitude and longitude it's over (any longitude: no wrapping, no jump)
        const view = { lat: KYOTO[0] - 12, lon: KYOTO[1] + 4 }
        const kyoto = toV(...KYOTO, 1.004)
        // Zoomed in, the camera comes closer (never inside the globe's glow: 1.3 at 3x)
        // Run 26: zoom magnifies (the camera's zoom), the camera stays where it fits the globe
        let radiusPx = 0
        const setCam = () => {
          camera.position.copy(toV(view.lat, view.lon).normalize().multiplyScalar(dist)); camera.lookAt(0, 0, 0)
          if (camera.zoom !== zoom.v) { camera.zoom = zoom.v; camera.updateProjectionMatrix() }
          // The globe's radius on screen (about 0.39 of the box's shorter side at 1x): the dashes keep their px size
          const r = 0.39 * Math.min(w, h) * zoom.v
          if (Math.abs(r - radiusPx) > 0.5) { radiusPx = r; arcs.forEach(({ arc }) => arc.dashPx(r)) }
        }
        // Kyoto's label, pinned: an upright HTML label moved to wherever Kyoto is on screen, on whichever side keeps
        // it inside the globe's square, dimmed while Kyoto is round the back
        // Brisbane and Victoria are always named (run 24), small, wherever they are, dimmed round the back
        const named = [{ v: toV(...BRISBANE, 1.004), el: brisbane.current }, { v: toV(...VICTORIA, 1.004), el: victoria.current }, ...(last.kind === "you" ? [{ v: toV(...last.from, 1.004), el: yours.current }] : [])]
        const guestAt = guests.map((g) => ({ v: toV(g.lat, g.lon, 1.004), label: g.label }))
        const toScreen = (v: InstanceType<typeof THREE.Vector3>) => { const s = v.clone().project(camera); return { x: ((s.x + 1) / 2) * w, y: ((1 - s.y) / 2) * h, back: v.dot(camera.position) < 0.08 * camera.position.length() } }
        const pinAt = pins.map((p) => toV(...p.at, 1.004))
        const placeNames = () => {
          named.forEach(({ v, el: n }) => { if (!n) return; const s = toScreen(v); n.style.transform = `translate3d(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px, 0)`; n.dataset.back = String(s.back) })
          pinAt.forEach((v, i) => { const n = pinEls.current[i]; if (!n) return; const s = toScreen(v); n.style.setProperty("--x", `${s.x.toFixed(1)}px`); n.style.setProperty("--y", `${s.y.toFixed(1)}px`); n.dataset.back = String(s.back) })
        }
        // A guest city's label on hover (laptops) or tap (phones): the nearest line start within 22px on the near side
        let tipFor: { x: number; y: number } | null = null, tipUntil = 0
        const showTip = (x: number, y: number, hold = 0) => {
          const r = cv.getBoundingClientRect(), px = x - r.left, py = y - r.top
          let best: { d: number; label: string; s: { x: number; y: number } } | null = null
          for (const g of guestAt) { const s = toScreen(g.v); if (s.back) continue; const d = Math.hypot(s.x - px, s.y - py); if (d < 22 && (!best || d < best.d)) best = { d, label: g.label, s } }
          const el = tip.current
          if (!el) return
          if (!best) { if (performance.now() > tipUntil) { el.hidden = true; tipFor = null } return }
          el.textContent = best.label; el.hidden = false; tipFor = best.s; tipUntil = performance.now() + hold
          el.style.transform = `translate3d(${best.s.x.toFixed(1)}px, ${best.s.y.toFixed(1)}px, 0)`
        }
        void tipFor
        const placePin = () => {
          placeNames()
          const p = pin.current
          if (!p) return
          const s = kyoto.clone().project(camera), x = ((s.x + 1) / 2) * w, y = ((1 - s.y) / 2) * h
          const back = kyoto.dot(camera.position) < 0.3 * dist // round the edge or behind
          p.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
          p.dataset.side = x > w * 0.55 ? "left" : "right"
          p.dataset.back = String(back)
        }
        el.prepend(renderer.domElement)
        const cv = renderer.domElement
        // Run 26: a paper plane per line, flown once along it as it draws (not under reduced motion)
        const planes = reduce ? [] : arcs.map(({ kind }) => {
          const p = document.createElement("span"); p.className = `journey-plane journey-plane-${kind}`; p.innerHTML = PLANE; p.hidden = true; el.append(p); return p
        })
        const fly = (i: number, prog: number) => {
          const p = planes[i]
          if (!p) return
          if (prog <= 0 || prog >= 1) { if (!p.hidden) p.hidden = true; return }
          const { arc } = arcs[i], k = Math.round(prog * (N - 1)), a = toScreen(arc.at(Math.max(0, k - 1))), b = toScreen(arc.at(k))
          p.hidden = false; p.dataset.back = String(b.back)
          p.style.transform = `translate3d(${b.x.toFixed(1)}px, ${b.y.toFixed(1)}px, 0) rotate(${Math.atan2(b.y - a.y, b.x - a.x).toFixed(3)}rad)`
        }
        // Zoom (run 24): Ctrl or Cmd with the scroll wheel (a trackpad pinch sends that too) while on the globe; a plain
        // scroll always scrolls the page. Pinch with two fingers on phones. The + and − buttons. 1x to 3x, eased.
        const wheel = (e: WheelEvent) => { if (!e.ctrlKey && !e.metaKey) return; e.preventDefault(); zoom.t = clampZoom(zoom.t * Math.exp(-e.deltaY * 0.01)) }
        // Run 26: only the full-screen globe zooms (the stop's is a small square: zoomed, it showed as one)
        if (zoomable) cv.addEventListener("wheel", wheel, { passive: false })
        const resize = () => {
          w = el.clientWidth; h = el.clientHeight
          if (!w || !h) return
          renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); dist = fit()
          arcs.forEach(({ arc }) => arc.ms.forEach((m) => m.resolution.set(w, h)))
          radiusPx = 0 // the dashes again, for the new size
        }
        const ro = new ResizeObserver(() => { resize(); if (reduce) draw() })
        let shown = false
        const first = () => { if (!shown && alive) { shown = true; setReady(true) } }
        const draw = () => { zoom.v = zoom.t; setCam(); renderer.render(scene, camera); placePin(); first() }
        if (reduce) {
          zoomBy.current = (f) => { zoom.t = clampZoom(zoom.t * f); draw() }
          if (zoomable) cv.addEventListener("wheel", () => requestAnimationFrame(draw))
          cv.addEventListener("pointermove", (e) => e.pointerType === "mouse" && showTip(e.clientX, e.clientY))
          cv.addEventListener("pointerup", (e) => showTip(e.clientX, e.clientY, 2500))
          draw(); ro.observe(el)
          stop = () => { ro.disconnect(); cv.removeEventListener("wheel", wheel); renderer.dispose(); renderer.domElement.remove() }; return
        }
        zoomBy.current = (f) => { zoom.t = clampZoom(zoom.t * f) }
        // Opens over the Pacific, every line in view, then turns the short way to Kyoto
        const start = { lat: 5, lon: -175 }, face = { ...view }
        face.lon = start.lon + ((((face.lon - start.lon) % 360) + 540) % 360) - 180
        Object.assign(view, start)
        const target = { ...start }, vel = { lat: 0, lon: 0 }
        let dragging: { id: number; x: number; y: number; t: number; x0: number; y0: number } | null = null, touched = -Infinity, intro = true
        // Two fingers: a pinch (the drag lets go while it lasts)
        const fingers = new Map<number, { x: number; y: number }>()
        let pinch: { d: number; z: number } | null = null
        const spread = () => { const [a, b] = [...fingers.values()]; return Math.hypot(a.x - b.x, a.y - b.y) }
        const perPx = () => 180 / Math.max(160, el.clientWidth) // a drag across the globe turns it half way
        const down = (e: PointerEvent) => {
          if (e.pointerType === "touch" && zoomable) fingers.set(e.pointerId, { x: e.clientX, y: e.clientY })
          if (fingers.size === 2) { pinch = { d: spread(), z: zoom.t }; dragging = null; intro = false; return }
          if (dragging || (e.pointerType === "mouse" && e.button !== 0)) return
          e.stopPropagation()
          renderer.domElement.setPointerCapture(e.pointerId)
          dragging = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp, x0: e.clientX, y0: e.clientY }; intro = false; vel.lat = vel.lon = 0
          Object.assign(target, view); el.dataset.dragging = ""
        }
        const move = (e: PointerEvent) => {
          if (fingers.has(e.pointerId)) fingers.set(e.pointerId, { x: e.clientX, y: e.clientY })
          if (pinch && fingers.size === 2) { zoom.t = clampZoom(pinch.z * (spread() / Math.max(1, pinch.d))); return }
          if (!dragging && e.pointerType === "mouse") showTip(e.clientX, e.clientY)
          if (!dragging || e.pointerId !== dragging.id) return
          const k = perPx(), dLon = -(e.clientX - dragging.x) * k, dLat = (e.clientY - dragging.y) * k, dt = Math.max(1, e.timeStamp - dragging.t) / 1000
          target.lon += dLon; target.lat = Math.max(-TURN.tilt, Math.min(TURN.tilt, target.lat + dLat))
          // The release speed: smoothed over the last few moves, so one jittery event can't fling it
          vel.lon = vel.lon * 0.6 + (dLon / dt) * 0.4; vel.lat = vel.lat * 0.6 + (dLat / dt) * 0.4
          dragging = { ...dragging, x: e.clientX, y: e.clientY, t: e.timeStamp }
        }
        const up = (e: PointerEvent) => {
          fingers.delete(e.pointerId); if (fingers.size < 2) pinch = null
          if (!dragging || e.pointerId !== dragging.id) return
          // A tap (not a drag) names the guest city under it for a moment
          if (Math.hypot(e.clientX - dragging.x0, e.clientY - dragging.y0) < 6) showTip(e.clientX, e.clientY, 2500)
          if (e.timeStamp - dragging.t > 80) vel.lat = vel.lon = 0 // held still before letting go: no glide
          dragging = null; touched = performance.now(); delete el.dataset.dragging
        }
        cv.addEventListener("pointerdown", down); cv.addEventListener("pointermove", move)
        cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up); cv.addEventListener("lostpointercapture", up)
        const t0 = performance.now(), ease = (s: number) => (s < 0.5 ? 4 * s * s * s : 1 - Math.pow(-2 * s + 2, 3) / 2)
        let visible = true, then = t0
        const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting })
        io.observe(el)
        const cancel = loop((now) => {
          const dt = Math.min(0.05, (now - then) / 1000); then = now
          if (!visible || hold.current) { then = now; return true } // off screen or held: nothing drawn until it's back
          const s = (now - t0) / 1000 / PACE // run 26c: slower by PACE (journey-names.ts)
          // 0 to 1.2 s the home lines, 1.2 to 2.6 s everyone else's, then theirs, last (times PACE)
          arcs.forEach(({ kind, arc }, i) => {
            const at = kind === "nadia" ? 0 : kind === "griffin" ? 0.25 : kind === "guest" ? 1.2 + (i % 8) * 0.12 : 2.6
            const prog = Math.min(1, Math.max(0, (s - at) / 1.1))
            arc.draw(prog); fly(i, prog)
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
          zoom.v += (zoom.t - zoom.v) * (1 - Math.exp(-10 * dt))
          setCam()
          renderer.render(scene, camera)
          placePin(); first()
          return true
        })
        ro.observe(el)
        stop = () => { cancel(); io.disconnect(); ro.disconnect(); cv.removeEventListener("wheel", wheel); planes.forEach((p) => p.remove()); renderer.dispose(); renderer.domElement.remove() }
      })
      .catch(() => setFailed(true))
    return () => { alive = false; stop() }
    // pinKey stands for pins (the same places, the same pins)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [you, cities, theme, lang, t.journey.households, pinKey, zoomable])
  if (failed) return null
  return (
    <div className="journey-globe" data-ready={ready || undefined}>
      <div ref={box} className="journey-globe-art" role="img" aria-label={label}>
        <div ref={pin} className="globe-pin" aria-hidden><div className="globe-pin-body"><span className="globe-pin-seal">京</span><span className="globe-pin-text">{t.journey.kyotoPin}</span></div></div>
        {/* Run 26c: who's from there, as a G or an N in their line's colour beside the place (Nadia from Brisbane,
            Griffin from Victoria, Canada); the legend names them */}
        <span ref={brisbane} className="globe-place" aria-hidden><b className="home-mark home-mark-nadia">N</b>{t.journey.from.nadia}</span>
        <span ref={victoria} className="globe-place" aria-hidden><b className="home-mark home-mark-griffin">G</b>{t.journey.from.griffin}</span>
        {/* Run 26c (Jehan): their own place, a gold "You" badge beside its name, like the G and the N */}
        {you && you.id !== "jp" && you.lat != null && you.lon != null && (nearHome(you.lat, you.lon)
          ? <span ref={yours} className="globe-place globe-place-under" aria-hidden><b className="home-mark home-mark-you">{t.journey.youMark}</b></span>
          : <span ref={yours} className="globe-place" aria-hidden><b className="home-mark home-mark-you">{t.journey.youMark}</b>{you.name}</span>)}
        <span ref={tip} className="globe-tip" aria-hidden hidden />
        <span className="sr-only">{t.journey.title}</span>
      </div>
      {!ready && <span className="journey-globe-wait" aria-hidden>{t.journey.loading}</span>}
      <ChapterPins pins={pins} onPin={onPin} refs={pinEls} />
      {children}
    </div>
  )
}
