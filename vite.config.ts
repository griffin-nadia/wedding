import path from "node:path"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig, type Plugin } from "vite"

// Preloads the Latin subsets of our self-hosted fonts, so text paints in the right font first time.
function preloadFonts(): Plugin {
  const wanted = /(zen-old-mincho-latin-400|eb-garamond-latin-(400|600))-normal-.*\.woff2$/
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

// Hosted at griffin-nadia.github.io/wedding (a project site), so base is the repo name.
export default defineConfig({
  base: "/wedding/",
  plugins: [react(), tailwindcss(), preloadFonts()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
})
