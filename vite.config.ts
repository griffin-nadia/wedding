import fs from "node:fs"
import path from "node:path"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, type BuildOptions, type Plugin } from "vite"

// Preloads the Latin subsets of our self-hosted fonts (Oranienbaum and Inter), so text paints in the right font first
// time. Zen Old Mincho, the Japanese display face, loads only when someone switches to Japanese.
function preloadFonts(): Plugin {
  const wanted = /(oranienbaum-latin-400|inter-latin-400|inter-latin-500)-normal-.*\.woff2$/
  let base = "/wedding/"
  return {
    name: "preload-fonts",
    configResolved(c) { base = c.base },
    transformIndexHtml(_html, ctx) {
      if (!ctx.bundle) return
      return Object.keys(ctx.bundle)
        .filter((f) => wanted.test(f))
        .map((f) => ({
          tag: "link",
          attrs: { rel: "preload", as: "font", type: "font/woff2", href: `${base}${f}`, crossorigin: "" },
          injectTo: "head" as const,
        }))
    },
  }
}

// Couple photos live in public/photos (committed, the web sizes only; family-dinner and the originals stay in
// photos-private/). PUBLIC_PHOTOS=1 (the Pages build) shows them; a plain build keeps the paper frames, so the
// screenshot baselines don't change.
const HAS_PHOTOS = process.env.PUBLIC_PHOTOS === "1" && fs.existsSync(path.resolve(__dirname, "public/photos"))

// Local preview only: npm run dev plays private/song.mp3 when it's there. Served from memory by the dev server, so it
// never lands in dist. The build check below fails the build if anything from private/ does.
const PRIVATE = path.resolve(__dirname, "private")
const PRIVATE_SONG = path.join(PRIVATE, "song.mp3")
function privateSong(): Plugin {
  return {
    name: "private-song",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/wedding/__private/song.mp3", (_req, res) => {
        if (!fs.existsSync(PRIVATE_SONG)) { res.statusCode = 404; res.end(); return }
        res.setHeader("Content-Type", "audio/mpeg")
        fs.createReadStream(PRIVATE_SONG).pipe(res)
      })
    },
  }
}
// The lab's private pictures (run 24): photos-private/ and private/nadia-art-*/ served by the dev server at
// /wedding/__private/<path> (for lab takes that try photos not on the site yet, like Griffin's other childhood prints).
// Dev server only, from memory: never in any build, and a lab test build just gets a 404 (the takes fall back to paper).
const PRIVATE_DIRS: Record<string, string> = { photos: path.resolve(__dirname, "photos-private"), art: PRIVATE }
function privatePictures(): Plugin {
  return {
    name: "private-pictures",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/wedding/__private/", (req, res, next) => {
        const [root, ...rest] = decodeURIComponent((req.url ?? "").split("?")[0]).replace(/^\//, "").split("/")
        const base = PRIVATE_DIRS[root], file = base && path.resolve(base, rest.join("/"))
        if (!file || !file.startsWith(base + path.sep) || !/\.(png|jpe?g|webp|avif)$/i.test(file) || !fs.existsSync(file)) return next()
        const type = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", avif: "image/avif" }[file.split(".").pop()!.toLowerCase()]
        res.setHeader("Content-Type", type ?? "application/octet-stream")
        fs.createReadStream(file).pipe(res)
      })
    },
  }
}
// Also fails if anything from the lab is built (it's local only).
/**
 * The lab is local only (final run, 18 Oct): `npm run lab` (the dev server), or `npm run build:lab` after `npm run
 * build` for the lab's own tests (the Playwright web server runs it). `npm run build`, and so the Pages deploy, never
 * builds it. Built with no back end (VITE_API_URL empty), so it only has the sample household. Its pages and scripts
 * go in dist/LAB_PATH; the public files (art, photos, scenes) are the site's own, at /wedding/.
 */
export const LAB_PATH = "lab"

function noPrivateInBuild(lab = false): Plugin {
  let outDir = "dist"
  return {
    name: "no-private-in-build",
    apply: "build",
    enforce: "post",
    configResolved(c) { outDir = path.resolve(c.root, c.build.outDir) },
    closeBundle() {
      const priv = fs.existsSync(PRIVATE) ? fs.readdirSync(PRIVATE) : []
      const sizes = new Set(priv.map((f) => fs.statSync(path.join(PRIVATE, f))).filter((s) => s.isFile()).map((s) => s.size))
      const walk = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]))
      for (const f of walk(outDir)) {
        const same = sizes.has(fs.statSync(f).size) && priv.some((p) => fs.statSync(path.join(PRIVATE, p)).isFile() && fs.readFileSync(path.join(PRIVATE, p)).equals(fs.readFileSync(f)))
        if (same || (/\.(js|html)$/.test(f) && fs.readFileSync(f, "utf8").includes("__private/"))) throw new Error(`private/ file in the build: ${path.relative(outDir, f)}`)
        // The guest site never carries the lab: the lab is its own build, in its own folder (LAB_PATH)
        if (!lab && (/lab(-frame|-play)?\.html$/.test(f) || (/\.js$/.test(f) && fs.readFileSync(f, "utf8").includes("__NG_LAB__")))) throw new Error(`lab code in the build: ${path.relative(outDir, f)}`)
      }
    },
  }
}

// The site's own address, for the link preview's image (index.html): one value, the build variable VITE_SITE_URL, so a
// move to Cloudflare Pages or a custom domain (run 20) is a variable, not an edit. The back end's emails and QR cards
// use SITE_URL in Script Properties.
process.env.VITE_SITE_URL ||= "https://griffin-nadia.github.io/wedding"

// Hosted at griffin-nadia.github.io/wedding (a project site), so base is the repo name.
export default defineConfig(({ command, mode }) => ({
  base: mode === "lab" ? `/wedding/${LAB_PATH}/` : "/wedding/",
  plugins: [react(), tailwindcss(), preloadFonts(), privateSong(), privatePictures(), noPrivateInBuild(mode === "lab")],
  ...(mode === "lab" ? {
    publicDir: false,
    build: { outDir: `dist/${LAB_PATH}`, emptyOutDir: false, rollupOptions: { input: { lab: path.resolve(__dirname, "lab.html"), "lab-play": path.resolve(__dirname, "lab-play.html") } } } as BuildOptions,
  } : { build: { sourcemap: false } }), // run 20: never source maps on the guest site (scripts/leak-check.mjs checks the rest)
  define: {
    ...(mode === "lab" ? {
      // Public files are the site's own; lab pages link to each other under LAB_PATH; no back end at all
      "import.meta.env.BASE_URL": JSON.stringify("/wedding/"),
      "import.meta.env.VITE_LAB_BASE": JSON.stringify(`/wedding/${LAB_PATH}/`),
      "import.meta.env.VITE_API_URL": JSON.stringify(""),
    } : {}),
    __PRIVATE_SONG__: JSON.stringify(command === "serve" && fs.existsSync(PRIVATE_SONG)),
    __PUBLIC_PHOTOS__: JSON.stringify(HAS_PHOTOS),
    // Art drops in with no other change: Nadia's paper wash and her handwritten sign-off
    __PAPER_ART__: JSON.stringify(["avif", "webp", "png"].find((x) => fs.existsSync(path.resolve(__dirname, `public/art/paper/base.${x}`))) ?? null),
    __SIGNOFF_ART__: JSON.stringify(fs.existsSync(path.resolve(__dirname, "public/brand/signoff.svg"))),
  },
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
}))
