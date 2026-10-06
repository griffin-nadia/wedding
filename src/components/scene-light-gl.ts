import { Mesh, Program, Renderer, Triangle } from "ogl"

// Options → Light → Shader: the same light as the CSS build, drawn by one fragment shader. Day: dappled light
// through leaves (two slow layers of soft noise). Night: a breathing lantern pool with a little flicker, a few far,
// out-of-focus lantern bokeh, and grain that only shows where the light falls. Output is light only (premultiplied
// alpha), composited over the page; faces get a soft hole. 30 fps cap, DPR ≤ 1.5, paused while the tab is hidden.
const vertex = /* glsl */ `
attribute vec2 position; attribute vec2 uv; varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }`

const fragment = /* glsl */ `
precision mediump float;
uniform vec2 uRes; uniform float uTime; uniform vec2 uNudge; uniform float uNight; uniform vec3 uFace;
varying vec2 vUv;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y); }
float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; } return v; }
void main() {
  vec2 px = vUv * uRes; float aspect = uRes.x / uRes.y; vec2 p = vec2(vUv.x * aspect, vUv.y);
  float t = uTime; vec2 n = uNudge * 0.03;
  float light; vec3 col;
  if (uNight < 0.5) {
    // Komorebi: leaf gaps as the bright side of slow noise; a far layer and a near one, drifting differently
    float far = smoothstep(0.5, 0.66, fbm(p * 5.0 + vec2(t * 0.012, t * 0.006) + n));
    float near = smoothstep(0.54, 0.7, fbm(p * 3.2 - vec2(t * 0.008, -t * 0.01) + n * 1.6 + 7.0));
    light = far * 0.55 + near * 0.75;
    light *= smoothstep(1.4, 0.2, distance(p, vec2(aspect * 0.85, 1.05))); // brighter toward the top right, like the sun
    col = vec3(1.0, 0.95, 0.82);
  } else {
    // Lantern pool: drifts on its own, breathes, flickers a little; the pointer only leans it
    vec2 c = vec2(aspect * (0.3 + 0.03 * sin(t * 0.21)), 0.62 + 0.025 * cos(t * 0.17)) + n * vec2(1.0, -1.0);
    float breathe = 0.85 + 0.1 * sin(t * 0.9) + 0.05 * (noise(vec2(t * 3.0, 1.0)) - 0.5);
    float pool = exp(-pow(distance(p, c) / 0.42, 2.0)) * breathe;
    // Bokeh: five soft discs far back, near the edges
    float bokeh = 0.0;
    for (int i = 0; i < 5; i++) {
      float fi = float(i);
      vec2 b = vec2(aspect * fract(0.13 + fi * 0.27 + 0.01 * sin(t * 0.05 + fi)), fract(0.71 + fi * 0.37));
      bokeh += smoothstep(0.075, 0.05, distance(p, b)) * (0.25 + 0.15 * sin(t * 0.6 + fi * 2.0));
    }
    float grain = (hash(floor(px)) - 0.5) * 0.35 * pool;
    light = pool * 0.7 + bokeh * 0.35 + grain;
    col = vec3(1.0, 0.72, 0.42);
  }
  // Faces: a soft hole (uFace = centre x, centre y, radius in px; y from the top)
  vec2 fp = vec2(px.x, uRes.y - px.y);
  light *= mix(0.25, 1.0, smoothstep(uFace.z * 0.55, uFace.z * 1.15, distance(fp, uFace.xy)));
  float a = clamp(light, 0.0, 1.0) * (uNight < 0.5 ? 0.34 : 0.32);
  gl_FragColor = vec4(col * a, a);
}`

export function startLight(host: HTMLElement, night: boolean, still: boolean): () => void {
  const dpr = Math.min(1.5, window.devicePixelRatio || 1)
  const renderer = new Renderer({ dpr, alpha: true, premultipliedAlpha: true, antialias: false })
  const gl = renderer.gl
  const canvas = gl.canvas as HTMLCanvasElement
  canvas.className = "scene-light-canvas"
  host.appendChild(canvas)
  const program = new Program(gl, {
    vertex, fragment, transparent: true,
    uniforms: { uRes: { value: [1, 1] }, uTime: { value: 0 }, uNudge: { value: [0, 0] }, uNight: { value: night ? 1 : 0 }, uFace: { value: [-999, -999, 0] } },
  })
  const mesh = new Mesh(gl, { geometry: new Triangle(gl), program })
  const size = () => { renderer.setSize(innerWidth, innerHeight); program.uniforms.uRes.value = [innerWidth * dpr, innerHeight * dpr] }
  size(); addEventListener("resize", size)
  const start = performance.now()
  let raf = 0, last = 0
  const draw = (now: number) => {
    const cs = getComputedStyle(host)
    program.uniforms.uTime.value = still ? 40 : (now - start) / 1000 + 40
    program.uniforms.uNudge.value = [parseFloat(cs.getPropertyValue("--nx")) || 0, parseFloat(cs.getPropertyValue("--ny")) || 0]
    program.uniforms.uFace.value = [(parseFloat(cs.getPropertyValue("--face-x")) || -999) * dpr, (parseFloat(cs.getPropertyValue("--face-y")) || -999) * dpr, (parseFloat(cs.getPropertyValue("--face-r")) || 0) * dpr]
    renderer.render({ scene: mesh })
  }
  const loop = (now: number) => {
    raf = requestAnimationFrame(loop)
    if (document.hidden || now - last < 33) return
    last = now; draw(now)
  }
  if (still) requestAnimationFrame(draw); else raf = requestAnimationFrame(loop)
  return () => { cancelAnimationFrame(raf); removeEventListener("resize", size); canvas.remove(); gl.getExtension("WEBGL_lose_context")?.loseContext() }
}
