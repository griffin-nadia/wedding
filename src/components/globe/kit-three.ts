import * as THREE from "three"
import { DIST, FLAT, FOV, LAT_F } from "./kit-geo"
import { breathe } from "./kit-paint"

/**
 * The globe's paper (globes24 kit), loaded only when a look mounts. One plane mesh, its vertices bent by the shader
 * between the flat map and the sphere (kit-geo.ts's place(), per vertex), with the look's 2:1 picture on it. A
 * see-through look draws its far side first, faint, then the near side. No depth buffer: the lines and labels are
 * drawn over it by the kit, which hides what's round the back itself.
 * The canvas goes on the page (drawing nothing) while the picture paints, so its first frame isn't paid for later;
 * then the picture's upload and the shader's compile each get a task of their own (setPicture()).
 */
export type View = { lon: number; tilt: number; m: number; z?: number }
export type PaperOptions = { seeThrough: number; shade: number; glsl: string; segments: [number, number]; nearest?: boolean }

const vert = /* glsl */ `
uniform float uM, uLon, uTilt;
varying vec2 vUv; varying float vK, vZ;
void main() {
  float s = uv.x, t = uv.y;
  float dl = (s - 0.5) * 6.2831853, lat = (t - 0.5) * 3.1415927;
  float e = abs(s - 0.5) * 2.0;
  float k = clamp(uM * 1.6 - (1.0 - e) * 0.6, 0.0, 1.0); k = k * k * (3.0 - 2.0 * k);
  float cl = cos(lat);
  vec3 sp = vec3(cl * sin(dl), sin(lat), cl * cos(dl));
  sp = vec3(sp.x, sp.y * cos(uTilt) - sp.z * sin(uTilt), sp.y * sin(uTilt) + sp.z * cos(uTilt));
  vec3 fp = vec3(dl * ${FLAT.toFixed(6)}, (lat - ${LAT_F.toFixed(6)}) * ${FLAT.toFixed(6)}, 1.0);
  vUv = vec2(uLon / 6.2831853 + s, t);
  vK = k; vZ = mix(1.0, sp.z, k);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(mix(fp, sp, k), 1.0);
}`
const frag = (glsl: string) => /* glsl */ `
uniform sampler2D map, uMask; uniform float uShade, uAlpha, uLon, uTilt, uLand, uGrain;
varying vec2 vUv; varying float vK, vZ;
void main() {
  vec4 col = texture2D(map, vUv);
  col.rgb *= mix(1.0, 0.7 + 0.3 * clamp(vZ, 0.0, 1.0), uShade * vK);
  ${glsl}
  // Run 26 tuning: the land see-through (its mask), and grain added on the paper (fixed to the map, so it turns with it)
  col.a *= mix(1.0, uLand, texture2D(uMask, vUv).r);
  float n = fract(sin(dot(floor(vec2(fract(vUv.x), vUv.y) * vec2(1600.0, 800.0)), vec2(12.9898, 78.233))) * 43758.5453);
  col.rgb *= 1.0 + (n - 0.5) * uGrain * 0.4;
  gl_FragColor = vec4(col.rgb, col.a * uAlpha);
}`

export function makePaper(o: PaperOptions, pixelRatio: number) {
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true })
  renderer.setPixelRatio(pixelRatio)
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(FOV, 5 / 4, 0.1, 50)
  camera.position.set(0, 0, DIST); camera.lookAt(0, 0, 0)
  const geo = new THREE.PlaneGeometry(1, 1, ...o.segments)
  let tex: THREE.CanvasTexture | null = null, mask: THREE.CanvasTexture | null = null
  const uniforms = { map: { value: null as THREE.Texture | null }, uM: { value: 1 }, uLon: { value: 0 }, uTilt: { value: 0 }, uShade: { value: o.shade }, uAlpha: { value: 1 }, uMask: { value: null as THREE.Texture | null }, uLand: { value: 1 }, uGrain: { value: 0 } }
  // The two sides share every uniform object but their alpha, so one write moves both
  const material = (side: THREE.Side, alpha: number) => new THREE.ShaderMaterial({
    uniforms: { ...uniforms, uAlpha: { value: alpha } }, vertexShader: vert, fragmentShader: frag(o.glsl),
    side, transparent: true, depthTest: false, depthWrite: false,
  })
  const near = new THREE.Mesh(geo, material(THREE.FrontSide, 1)); near.renderOrder = 1
  const far = o.seeThrough > 0 ? new THREE.Mesh(geo, material(THREE.BackSide, o.seeThrough)) : null
  if (far) far.renderOrder = 0
  return {
    canvas: renderer.domElement,
    resize: (w: number, h: number) => { renderer.setSize(w, h, false); camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix(); renderer.render(scene, camera) },
    /** The look's picture onto the paper: its upload, then the shader's compile, each in a task of its own */
    setPicture: async (picture: HTMLCanvasElement) => {
      tex = new THREE.CanvasTexture(picture)
      tex.wrapS = THREE.RepeatWrapping; tex.anisotropy = 4
      // Run 27: hard pixels (the video game look)
      if (o.nearest) { tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false }
      uniforms.map.value = tex
      // finish() waits for the GPU here, so each piece of its work is paid in its own short task, not in one long
      // first frame
      const gl = renderer.getContext()
      renderer.initTexture(tex); gl.finish()
      await breathe()
      scene.add(near); if (far) scene.add(far)
      await renderer.compileAsync(scene, camera); gl.finish()
      await breathe()
      renderer.render(scene, camera); gl.finish()
      await breathe()
    },
    /** The land's mask (white land on black, 2:1) for the Land opacity slider */
    setMask: (m: HTMLCanvasElement) => { mask = new THREE.CanvasTexture(m); mask.wrapS = THREE.RepeatWrapping; uniforms.uMask.value = mask },
    /** The tuning panel: land opacity and added grain, 0 to 1 */
    tune: (land: number, grain: number) => { uniforms.uLand.value = land; uniforms.uGrain.value = grain },
    render: (v: View) => {
      uniforms.uM.value = v.m; uniforms.uLon.value = v.lon; uniforms.uTilt.value = v.tilt
      if (camera.zoom !== (v.z ?? 1)) { camera.zoom = v.z ?? 1; camera.updateProjectionMatrix() }
      renderer.render(scene, camera)
    },
    dispose: () => { geo.dispose(); tex?.dispose(); mask?.dispose(); for (const mesh of [near, far]) (mesh?.material as THREE.Material | undefined)?.dispose(); renderer.dispose() },
  }
}
