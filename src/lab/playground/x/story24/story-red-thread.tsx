import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useLang } from "@/lib/lang"
import { useTheme } from "@/lib/theme"
import { useKnob } from "../../params"
import { still, tween } from "../../motion"
import { Controls, EndWords, KIDS, KIT_CSS, ListView, Polaroid, TILTS, Words, arrowKeys, caption, chapterPic, useAnnounce, useChapters, useMeta, useStops, useSwipe } from "./kit"

/**
 * C. The red thread (赤い糸): the story is the globe. It opens over the Pacific with the two of them as children,
 * Griffin's prints pinned in Canada and Nadia's in Australia, and a red thread tied to each. Every chapter flies the
 * camera along the thread to that chapter's place (a little hop up and over on long legs) and pins its polaroid there;
 * both threads run through every chapter, twisting round each other like one cord, and at the journey stop the camera
 * draws back and they tie in a knot at Kyoto.
 * The globe is the site's own painting (lib/paint-globe.ts, read only) in a scene of its own: the far side faint
 * through the near side, as on the live page. Three.js loads only when this opens. It draws only while something
 * moves (a flight, a resize), so between chapters it costs nothing. Swipes, arrows, the arrow keys and See as a list
 * as on the live page. Reduced motion: no flights, the thread is simply drawn to the chapter and the print fades in.
 * Places: the chapter's place as a point (Hirakata, Japan, Australia, Brisbane, Canada at Edmonton as on the site's
 * globe, Kyoto); a place it doesn't know keeps the camera where it was.
 */
const P = "x-rt"
const KYOTO: [number, number] = [35.01, 135.77], EDMONTON: [number, number] = [53.55, -113.49], BRISBANE: [number, number] = [-27.47, 153.03]
const PLACE: Record<string, [number, number]> = {
  "Kansai Gaidai, Hirakata": [34.81, 135.65], Hirakata: [34.81, 135.65], Japan: [36.2, 138.25], Australia: [-25.5, 134], "Australia (Brisbane)": BRISBANE, Brisbane: BRISBANE,
  Canada: EDMONTON, Edmonton: EDMONTON, Kyoto: KYOTO,
}
const css = `
.${P} { gap: var(--space-2); justify-content: center; }
.${P}-grid { display: grid; width: 100%; max-width: 1400px; gap: var(--space-3); justify-items: center; align-items: center; }
@media (min-width: 1024px) { .${P}-grid { grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr); gap: var(--space-7); } }
.${P}-globe { position: relative; width: min(100%, clamp(250px, calc(100svh - 380px), 460px)); aspect-ratio: 1; margin-top: var(--space-6); touch-action: pan-y; }
@media (min-width: 1024px) { .${P}-globe { width: min(100%, calc(100svh - 170px), 820px); margin-top: 0; } }
.${P}-globe canvas { position: absolute; inset: 0; width: 100% !important; height: 100% !important; }
/* A soft pool of shade under the globe, so it sits on the paper */
.${P}-globe::before { content: ""; position: absolute; left: 12%; right: 12%; bottom: 2%; height: 10%; border-radius: 50%; background: radial-gradient(rgb(var(--tint-shadow) / .22), transparent 70%); }
.${P}-pin { position: absolute; left: 0; top: 0; z-index: 2; pointer-events: none; opacity: 0; transition: opacity 450ms var(--ease-paper); will-change: transform; }
.${P}-pin[data-on="true"] { opacity: 1; }
.${P}-pin[data-back="true"] { opacity: 0 !important; }
.${P}-print { --pw: 112px; position: absolute; left: 0; bottom: 14px; translate: -50% 0; transform-origin: 50% 100%; scale: .6; transition: scale 600ms cubic-bezier(.3, 1.4, .5, 1); }
.${P}-pin[data-on="true"] .${P}-print { scale: 1; }
@media (min-width: 1024px) { .${P}-print { --pw: 172px; } }
.${P}-print .x-s24-pol { --pw: inherit; }
.${P}-print.is-pair .x-s24-pol:first-child { position: absolute; left: -30%; top: -8%; --pw: calc(var(--pw) * .82); }
.${P}-print .x-s24-pol:last-child { position: relative; }
/* The pin itself: a red-headed pin through the print's bottom edge into the place */
.${P}-needle { position: absolute; left: -1px; bottom: 0; width: 2px; height: 22px; background: linear-gradient(var(--thread), color-mix(in oklab, var(--thread) 50%, var(--brand-kogecha))); border-radius: 1px; }
.${P}-needle::before { content: ""; position: absolute; left: 50%; top: -5px; width: 10px; height: 10px; translate: -50% 0; border-radius: 50%; background: radial-gradient(circle at 35% 35%, color-mix(in oklab, var(--thread) 60%, white), var(--thread) 60%); box-shadow: 0 1px 2px rgb(42 18 6 / .5); }
.${P}-kyoto { display: flex; align-items: center; gap: 6px; translate: 22px -50%; padding: 4px 8px 4px 4px; border-radius: var(--radius-control); background: var(--letter-bg); color: var(--ink); font: 500 var(--type-small-size) / 1 var(--font-label); white-space: nowrap; box-shadow: 0 2px 6px rgb(var(--tint-shadow) / .25); }
[data-side="left"] > .${P}-kyoto { translate: calc(-100% - 22px) -50%; }
.${P}-kyoto b { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 4px; background: var(--action); color: var(--action-ink); font: 400 14px / 1 var(--font-ja); }
.${P}-side { display: flex; flex-direction: column; align-items: center; gap: var(--space-3); width: 100%; max-width: 34rem; text-align: center; }
@media (min-width: 1024px) { .${P}-side { align-items: flex-start; text-align: left; } .${P}-side .x-s24-controls { align-items: flex-start; } }
.${P}-side .x-s24-words { min-height: 8.5rem; }
.${P}-side .x-s24-words { align-items: inherit; }
.${P}-still { display: grid; place-items: center; height: 100%; }
@media (prefers-reduced-motion: reduce) { .${P}-print, .${P}-pin[data-on="true"] .${P}-print { scale: 1; transition: none; } }
`
type Api = { fly: (at: number) => void }

export default function StoryRedThread() {
  const { t } = useLang()
  const { theme } = useTheme()
  const tone = useKnob("thread", "story")
  const s = useChapters()
  const meta = useMeta(s)
  const { at, go, list, setList } = useStops(s.total)
  const end = s.total - 1
  const region = useRef<HTMLDivElement>(null), box = useRef<HTMLDivElement>(null)
  const pins = useRef<Record<string, HTMLDivElement | null>>({})
  const api = useRef<Api | null>(null)
  const atRef = useRef(at)
  const [failed, setFailed] = useState(false)
  // Where each chapter is: its place, or the last known one
  const points = useMemo(() => {
    let last: [number, number] = KYOTO
    return s.stops.map((c) => { const p = PLACE[c.place ?? ""] ?? PLACE[(c.place ?? "").split(",").pop()!.trim()]; if (p) last = p; return last })
  }, [s.stops])

  useEffect(() => {
    const el = box.current
    if (!el) return
    let alive = true, stop = () => {}
    void Promise.all([import("three"), import("three/examples/jsm/lines/Line2.js"), import("three/examples/jsm/lines/LineMaterial.js"), import("three/examples/jsm/lines/LineGeometry.js"), import("@/lib/paint-globe")])
      .then(async ([THREE, { Line2 }, { LineMaterial }, { LineGeometry }, { paintGlobe, GLOBE_LOOK }]) => {
        if (!alive) return
        const phone = matchMedia("(pointer: coarse)").matches, calm = still()
        const hex = (v: string, fb: string) => {
          const x = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!
          x.fillStyle = fb; x.fillStyle = getComputedStyle(el).getPropertyValue(v).trim() || fb; x.fillRect(0, 0, 1, 1)
          const [r, g, b] = x.getImageData(0, 0, 1, 1).data
          return (r << 16) | (g << 8) | b
        }
        const night = theme === "lantern"
        const tex = new THREE.CanvasTexture(await paintGlobe(night ? GLOBE_LOOK.night : GLOBE_LOOK.day, phone ? 1024 : 2048, ["CA", "AU", "JP"]))
        if (!alive) return
        tex.colorSpace = THREE.SRGBColorSpace
        let w = el.clientWidth, h = el.clientHeight
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: calm })
        renderer.setPixelRatio(Math.min(phone ? 1.5 : 2, devicePixelRatio)); renderer.setSize(w, h)
        const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(32, w / h, 0.1, 100)
        const toV = (lat: number, lon: number, r = 1) => { const p = (90 - lat) * Math.PI / 180, q = (lon + 180) * Math.PI / 180; return new THREE.Vector3(-r * Math.sin(p) * Math.cos(q), r * Math.cos(p), r * Math.sin(p) * Math.sin(q)) }
        const sphere = new THREE.SphereGeometry(1, 72, 48)
        const far = new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, transparent: true, opacity: 0.45, depthWrite: false }))
        const near = new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ map: tex, side: THREE.FrontSide, transparent: true, depthWrite: false }))
        far.renderOrder = 0; near.renderOrder = 3
        scene.add(far, near)
        const red = hex(tone === "shu" ? "--brand-shu" : "--ink-story", "#a84f32")
        el.style.setProperty("--thread", tone === "shu" ? "var(--brand-shu)" : "var(--ink-story)")

        // The two strands: Griffin's from Canada, Nadia's from Australia, each through every chapter to Kyoto. Each leg
        // a great-circle arc lifted off the land; the two strands wind round each other, so together they read as one cord.
        const route = [...points, KYOTO]
        const SEG = 56
        const strand = (from: [number, number], twist: number) => {
          const pts: number[] = [], marks: number[] = [0] // marks[i]: how many samples reach stop i + 1's place
          const stops = [from, ...route]
          let n = 0
          for (let i = 0; i < stops.length - 1; i++) {
            const a = toV(...stops[i]), b = toV(...stops[i + 1]), om = a.angleTo(b)
            if (om > 0.002) for (let j = i === 0 ? 0 : 1; j < SEG; j++) {
              const u = j / (SEG - 1), v = a.clone().multiplyScalar(Math.sin((1 - u) * om)).add(b.clone().multiplyScalar(Math.sin(u * om))).divideScalar(Math.sin(om))
              const lift = 1.006 + (0.015 + 0.04 * om) * Math.sin(Math.PI * u)
              v.setLength(lift)
              // The wind: a small sideways offset that turns as it goes, opposite for the two strands
              const side = b.clone().sub(a).cross(v).normalize().multiplyScalar(0.005 * Math.sin(u * Math.PI * 2 * Math.max(2, Math.round(om * 9)) + twist))
              v.add(side); pts.push(v.x, v.y, v.z); n++
            }
            marks.push(n)
          }
          const g = new LineGeometry(); g.setPositions(pts)
          const m = new LineMaterial({ color: red, linewidth: phone ? 2.2 : 2.6, transparent: true, opacity: 0.95 })
          m.resolution.set(w, h)
          const line = new Line2(g, m); line.computeLineDistances(); line.renderOrder = 2
          g.instanceCount = 0
          scene.add(line)
          return { g, m, marks, n }
        }
        const strands = [strand(EDMONTON, 0), strand(BRISBANE, Math.PI)]
        // Where it's been: a small red bead at each chapter's place once the thread has passed it
        const beads = route.slice(0, -1).map((p) => { const b = new THREE.Mesh(new THREE.SphereGeometry(0.011, 12, 8), new THREE.MeshBasicMaterial({ color: red })); b.position.copy(toV(...p, 1.008)); b.visible = false; b.renderOrder = 2; scene.add(b); return b })
        // The knot at Kyoto
        const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(0.026, 0.0075, 96, 8, 2, 3), new THREE.MeshBasicMaterial({ color: red }))
        knot.position.copy(toV(...KYOTO, 1.03)); knot.lookAt(0, 0, 0); knot.scale.setScalar(0.0001); knot.renderOrder = 2
        scene.add(knot)

        // Where the camera is for each stop: over the Pacific to see both homes, close over a chapter (a little north of
        // it, so the print pinned above the place stays in frame), drawn back over Kyoto at the end
        const home = toV(...EDMONTON).add(toV(...BRISBANE)).normalize()
        const viewOf = (i: number) => {
          if (i === 0) return { dir: home, d: 4.3 }
          if (i === end) return { dir: toV(KYOTO[0] + 4, KYOTO[1] - 10), d: 4.7 }
          const [lat, lon] = route[i - 1]
          return { dir: toV(lat + 9, lon), d: 3.75 }
        }
        const cam = { dir: viewOf(atRef.current).dir.clone(), d: viewOf(atRef.current).d }
        const marksFor = (i: number, k: number) => strands[k].marks[Math.min(i, strands[k].marks.length - 1)]
        let count = strands.map((_, k) => marksFor(atRef.current, k))
        const kyoto = toV(...KYOTO, 1.01), tmp = new THREE.Vector3()
        const place = () => {
          camera.position.copy(cam.dir).normalize().multiplyScalar(cam.d); camera.lookAt(0, 0, 0)
          strands.forEach((sd, k) => { sd.g.instanceCount = Math.max(0, Math.round(count[k]) - 1) })
          renderer.render(scene, camera)
          // The prints and Kyoto's label, upright HTML moved to wherever their place is on screen
          const facing = camera.position.clone().normalize()
          for (const [key, node] of Object.entries(pins.current)) {
            if (!node) continue
            const at = key === "kyoto" ? kyoto : key === "g" ? toV(...EDMONTON, 1.006) : key === "n" ? toV(...BRISBANE, 1.006) : toV(...route[Number(key)], 1.006)
            tmp.copy(at).project(camera)
            const x = ((tmp.x + 1) / 2) * w, y = ((1 - tmp.y) / 2) * h
            node.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
            node.dataset.back = String(at.clone().normalize().dot(facing) < 0.12)
            node.dataset.side = x > w * 0.55 ? "left" : "right"
          }
        }
        el.prepend(renderer.domElement)
        // Every material's shader ready now, so a bead appearing mid-story never stalls a frame
        beads.forEach((b) => { b.visible = true }); renderer.compile(scene, camera); beads.forEach((b) => { b.visible = false })
        let flight: (() => void) | null = null, shown = atRef.current
        const fly = (i: number) => {
          flight?.()
          const from = { dir: cam.dir.clone(), d: cam.d }, to = viewOf(i), c0 = [...count], c1 = strands.map((_, k) => marksFor(i, k))
          const om = from.dir.angleTo(to.dir)
          const land = () => {
            shown = i
            beads.forEach((b, j) => { b.visible = i === end || j < i - 1 })
            Object.entries(pins.current).forEach(([k, n]) => { if (n) n.dataset.on = String(k === "kyoto" ? i === end : k === "g" || k === "n" ? i === 0 : Number(k) === i - 1) })
          }
          Object.values(pins.current).forEach((n) => { if (n) n.dataset.on = "false" })
          const knotTo = i === end ? 1 : 0.0001, knot0 = knot.scale.x
          const dur = 900 + Math.min(1600, om * 900)
          const slerp = (u: number) => { const a = from.dir.clone().normalize(), b = to.dir.clone().normalize(), o = a.angleTo(b); return o < 1e-4 ? b : a.multiplyScalar(Math.sin((1 - u) * o)).add(b.multiplyScalar(Math.sin(u * o))).divideScalar(Math.sin(o)) }
          flight = tween(calm ? 1 : dur, (u, done) => {
            cam.dir.copy(slerp(u)); cam.d = from.d + (to.d - from.d) * u + Math.min(1.4, om * 0.9) * Math.sin(Math.PI * u)
            // The thread runs ahead of the camera a little, so it's there as the camera lands
            const v = Math.min(1, u * 1.15)
            count = c0.map((c, k) => c + (c1[k] - c) * v)
            knot.scale.setScalar(Math.max(0.0001, knot0 + (knotTo - knot0) * Math.max(0, (u - 0.55) / 0.45)))
            knot.rotation.z = u * 1.2
            place()
            if (done) { flight = null; land() }
          }, (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2))
        }
        // Opening: placed at once, then the two kids' prints come in
        place(); fly(atRef.current)
        api.current = { fly: (i) => { if (i !== shown || flight) fly(i) } }
        const ro = new ResizeObserver(() => { w = el.clientWidth; h = el.clientHeight; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); strands.forEach((sd) => sd.m.resolution.set(w, h)); place() })
        ro.observe(el)
        stop = () => { flight?.(); ro.disconnect(); renderer.dispose(); renderer.domElement.remove(); api.current = null }
      })
      .catch(() => setFailed(true))
    return () => { alive = false; stop() }
  }, [theme, tone, points, end])
  useEffect(() => { atRef.current = at; api.current?.fly(at) }, [at])

  const step = useCallback((d: 1 | -1) => go(at + d), [go, at])
  useSwipe(region, step)
  const said = useAnnounce(s, at)
  if (list) return <div className={`x-s24-root ${P}`}><style>{KIT_CSS + css}</style><ListView s={s} onBack={() => setList(false)} /></div>
  const c = at > 0 && at < end ? s.stops[at - 1] : null
  const pin = (key: string, kids: React.ReactNode) => <div key={key} ref={(n) => { pins.current[key] = n }} className={`${P}-pin`} data-on="false" aria-hidden>{kids}</div>
  return (
    <div className={`x-s24-root ${P}`}>
      <style>{KIT_CSS + css}</style>
      <h1 className="x-s24-h1">{t.story.title}</h1>
      <div ref={region} className={`x-s24-region ${P}-grid`} role="region" aria-roledescription="carousel" aria-label={t.story.title} tabIndex={0} onKeyDown={arrowKeys(step)}>
        <div ref={box} className={`${P}-globe`} role="img" aria-label={c ? `${c.title}, ${c.year}${c.place ? `, ${c.place}` : ""}` : at === 0 ? `${KIDS.front[0].alt}; ${KIDS.front[1].alt}` : t.journey.kyotoPin}>
          {failed && <div className={`${P}-still`}>{c ? <Polaroid pic={chapterPic(c)} cap={caption(c)} tilt={TILTS[(at - 1) % TILTS.length]} /> : null}</div>}
          {pin("g", <div className={`${P}-print is-pair`}><Polaroid pic={KIDS.behind} tilt={-8} sizes="140px" /><Polaroid pic={KIDS.front[0]} cap="griffin" tilt={4} sizes="180px" eager /><span className={`${P}-needle`} /></div>)}
          {pin("n", <div className={`${P}-print`}><Polaroid pic={KIDS.front[1]} cap="nadia" tilt={-5} sizes="180px" eager /><span className={`${P}-needle`} /></div>)}
          {s.stops.map((ch, i) => (Math.abs(i + 1 - at) <= 1 ? pin(String(i), <div className={`${P}-print`}><Polaroid pic={chapterPic(ch)} cap={caption(ch)} tilt={TILTS[i % TILTS.length]} tape={i % 3 === 0} sizes="(min-width: 1024px) 180px, 120px" /><span className={`${P}-needle`} /></div>) : null))}
          {pin("kyoto", <span className={`${P}-kyoto`}><b>京</b>{t.journey.kyotoPin}</span>)}
        </div>
        <div className={`${P}-side`}>
          {c ? <Words c={c} meta={meta(c)} /> : at === end ? <EndWords s={s} /> : <div className="x-s24-words" />}
          <Controls at={at} total={s.total} go={go} onList={() => setList(true)} />
        </div>
        <p className="sr-only" aria-live="polite">{said}</p>
      </div>
    </div>
  )
}
