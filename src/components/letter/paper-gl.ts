import { Mesh, Program, Renderer, Texture, Triangle } from "ogl"

/**
 * The paper layer (v3 L): one full-screen triangle and one fragment shader. Warm paper gradient (or
 * Nadia's wash when public/art/paper/base.* exists), grain, a light that drifts and follows the scroll,
 * the page turn and the cursor, and a mist band that breathes. ~24 fps, paused when the tab is hidden.
 * The CSS paper underneath is the fallback; this only adds `paper-gl` to <html> once it's drawing.
 */
const vertex = /* glsl */ `
attribute vec2 position; attribute vec2 uv; varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }`

const fragment = /* glsl */ `
precision mediump float;
uniform vec2 uRes; uniform float uTime; uniform float uScroll; uniform float uTurn; uniform vec2 uMouse;
uniform vec3 uA; uniform vec3 uB; uniform vec3 uLight; uniform vec3 uMist; uniform float uGrain;
uniform sampler2D uTex; uniform float uHasTex; uniform float uTexAspect;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y); }
void main() {
  vec2 uv = vUv; float aspect = uRes.x / uRes.y;
  vec3 col = mix(uA, uB, clamp(uv.x * 0.6 + (1.0 - uv.y) * 0.4, 0.0, 1.0));
  if (uHasTex > 0.5) {
    vec2 tuv = uv - 0.5; if (aspect > uTexAspect) tuv.y *= uTexAspect / aspect; else tuv.x *= aspect / uTexAspect;
    col = texture2D(uTex, tuv + 0.5).rgb;
  }
  float t = uTime;
  vec2 lp = vec2(0.22 + 0.02 * sin(t * 0.157) - uTurn * 0.02 + (uMouse.x - 0.5) * 0.04,
                 0.82 + 0.015 * cos(t * 0.157) + uScroll * 0.02 - (uMouse.y - 0.5) * 0.04);
  float light = smoothstep(0.6, 0.0, distance(uv * vec2(aspect, 1.0), lp * vec2(aspect, 1.0)));
  col += uLight * light * 0.16;
  float band = smoothstep(0.16, 0.0, abs(uv.y - 0.46 - (noise(vec2(uv.x * 3.0 + t * 0.02, t * 0.05)) - 0.5) * 0.08));
  float breathe = 0.06 + 0.04 * (0.5 + 0.5 * sin(t * 0.5236));
  col = mix(col, uMist, band * breathe);
  col += (hash(floor(gl_FragCoord.xy)) - 0.5) * uGrain;
  gl_FragColor = vec4(col, 1.0);
}`

const hex = (css: string) => {
  const c = getComputedStyle(document.documentElement).getPropertyValue(css).trim()
  const m = c.match(/^#?([0-9a-f]{6})$/i)
  if (!m) return [0.95, 0.9, 0.83]
  const n = parseInt(m[1], 16)
  return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]
}

export function startPaper(art: string | null): () => void {
  const renderer = new Renderer({ dpr: Math.min(1.5, window.devicePixelRatio || 1), alpha: false, antialias: false })
  const gl = renderer.gl
  const canvas = gl.canvas as HTMLCanvasElement
  canvas.className = "paper-canvas"
  canvas.setAttribute("aria-hidden", "true")
  const scene = document.querySelector(".scene")
  scene?.appendChild(canvas)
  const tex = new Texture(gl)
  const program = new Program(gl, {
    vertex, fragment,
    uniforms: {
      uRes: { value: [innerWidth, innerHeight] }, uTime: { value: 0 }, uScroll: { value: 0 }, uTurn: { value: 0 }, uMouse: { value: [0.5, 0.5] },
      uA: { value: [1, 1, 1] }, uB: { value: [1, 1, 1] }, uLight: { value: [1, 1, 1] }, uMist: { value: [1, 1, 1] }, uGrain: { value: 0.03 },
      uTex: { value: tex }, uHasTex: { value: 0 }, uTexAspect: { value: 1.5 },
    },
  })
  const mesh = new Mesh(gl, { geometry: new Triangle(gl), program })
  const u = program.uniforms
  const colours = () => {
    const lantern = document.documentElement.dataset.theme === "lantern"
    u.uA.value = hex(lantern ? "--brand-yoru" : "--brand-kinari")
    u.uB.value = hex(lantern ? "--brand-yoru-raised" : "--brand-sage-paper")
    u.uLight.value = hex(lantern ? "--brand-hachimitsu" : "--brand-mitsu")
    u.uMist.value = lantern ? [0.79, 0.73, 0.64] : [1, 1, 1]
    u.uGrain.value = lantern ? 0.02 : 0.03
  }
  colours()
  if (art) {
    const img = new Image()
    img.onload = () => { tex.image = img; u.uHasTex.value = 1; u.uTexAspect.value = img.width / img.height }
    img.src = `${import.meta.env.BASE_URL}art/paper/base.${art}`
  }
  const resize = () => { renderer.setSize(innerWidth, innerHeight); u.uRes.value = [innerWidth, innerHeight] }
  resize()
  const onMouse = (e: PointerEvent) => { if (e.pointerType === "mouse") u.uMouse.value = [e.clientX / innerWidth, e.clientY / innerHeight] }
  const mo = new MutationObserver(colours)
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })
  window.addEventListener("resize", resize)
  window.addEventListener("pointermove", onMouse, { passive: true })
  let raf = 0, last = 0, stopped = false
  const t0 = performance.now()
  const frame = (now: number) => {
    if (stopped) return
    raf = requestAnimationFrame(frame)
    if (document.hidden || now - last < 41) return // ~24 fps; nothing here needs more
    last = now
    const root = getComputedStyle(document.documentElement)
    u.uTime.value = (now - t0) / 1000
    u.uScroll.value = Number(root.getPropertyValue("--paper-scroll") || 0)
    u.uTurn.value = Number(root.getPropertyValue("--paper-turn") || 0)
    renderer.render({ scene: mesh })
    document.documentElement.classList.add("paper-gl")
  }
  raf = requestAnimationFrame(frame)
  return () => {
    stopped = true; cancelAnimationFrame(raf); mo.disconnect()
    window.removeEventListener("resize", resize); window.removeEventListener("pointermove", onMouse)
    canvas.remove(); document.documentElement.classList.remove("paper-gl")
    gl.getExtension("WEBGL_lose_context")?.loseContext()
  }
}
