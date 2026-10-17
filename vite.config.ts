import fs from "node:fs"
import path from "node:path"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, type Plugin } from "vite"

// Preloads the Latin subsets of our self-hosted fonts (Oranienbaum and Inter), so text paints in the right font first
// time. Zen Old Mincho, the Japanese display face, loads only when someone switches to Japanese.
function preloadFonts(): Plugin {
  const wanted = /(oranienbaum-latin-400|inter-latin-400|inter-latin-500)-normal-.*\.woff2$/
  return {
    name: "preload-fonts",
    transformIndexHtml(_html, ctx) {
      if (!ctx.bundle) return
      return Object.keys(ctx.bundle)
        .filter((f) => wanted.test(f))
        .map((f) => ({
          tag: "link",
          attrs: { rel: "preload", as: "font", type: "font/woff2", href: `/wedding/${f}`, crossorigin: "" },
          injectTo: "head" as const,
        }))
    },
  }
}

// Couple photos stay private until Nadia says yes. PUBLIC_PHOTOS=1 copies the public set into the
// build (from photos-private/, or public/photos/ once committed). family-dinner never goes public.
const PUBLIC_PHOTOS = process.env.PUBLIC_PHOTOS === "1"
function copyPhotos(): Plugin {
  let outDir = "dist"
  return {
    name: "copy-photos",
    apply: "build",
    configResolved(c) { outDir = path.resolve(c.root, c.build.outDir) },
    closeBundle() {
      const from = path.resolve(__dirname, "photos-private")
      if (!PUBLIC_PHOTOS || !fs.existsSync(from)) return
      const to = path.join(outDir, "photos")
      fs.mkdirSync(to, { recursive: true })
      for (const f of fs.readdirSync(from)) if (/\.(avif|webp|jpg)$/.test(f) && !f.startsWith("family-dinner")) fs.copyFileSync(path.join(from, f), path.join(to, f))
    },
  }
}

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
// Also fails if anything from the lab is built (it's local only).
function noPrivateInBuild(): Plugin {
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
        // The lab (lab.html, src/lab) is local only: nothing of it may be built
        if (/lab(-frame)?\.html$/.test(f) || (/\.js$/.test(f) && fs.readFileSync(f, "utf8").includes("__NG_LAB__"))) throw new Error(`lab code in the build: ${path.relative(outDir, f)}`)
      }
    },
  }
}

// Hosted at griffin-nadia.github.io/wedding (a project site), so base is the repo name.
export default defineConfig(({ command }) => ({
  base: "/wedding/",
  plugins: [react(), tailwindcss(), preloadFonts(), copyPhotos(), privateSong(), noPrivateInBuild()],
  define: {
    __PRIVATE_SONG__: JSON.stringify(command === "serve" && fs.existsSync(PRIVATE_SONG)),
    __PUBLIC_PHOTOS__: JSON.stringify(PUBLIC_PHOTOS),
    // Art drops in with no other change: Nadia's paper wash and her handwritten sign-off
    __PAPER_ART__: JSON.stringify(["avif", "webp", "png"].find((x) => fs.existsSync(path.resolve(__dirname, `public/art/paper/base.${x}`))) ?? null),
    __SIGNOFF_ART__: JSON.stringify(fs.existsSync(path.resolve(__dirname, "public/brand/signoff.svg"))),
  },
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
}))
