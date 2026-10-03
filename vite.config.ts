import fs from "node:fs"
import path from "node:path"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, type Plugin } from "vite"

// Preloads the Latin subsets of our self-hosted fonts, so text paints in the right font first time. Klee One (the
// sign-off and the arrival note only) loads when used, so it never competes with their photo for the first paint.
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

// Hosted at griffin-nadia.github.io/wedding (a project site), so base is the repo name.
export default defineConfig({
  base: "/wedding/",
  plugins: [react(), tailwindcss(), preloadFonts(), copyPhotos()],
  define: {
    __PUBLIC_PHOTOS__: JSON.stringify(PUBLIC_PHOTOS),
    // Art drops in with no other change: Nadia's paper wash and her handwritten sign-off
    __PAPER_ART__: JSON.stringify(["avif", "webp", "png"].find((x) => fs.existsSync(path.resolve(__dirname, `public/art/paper/base.${x}`))) ?? null),
    __SIGNOFF_ART__: JSON.stringify(fs.existsSync(path.resolve(__dirname, "public/brand/signoff.svg"))),
  },
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
})
