import { test, expect } from "@playwright/test"
import fs from "node:fs"

// "Open on your phone" (docs/quality.md): laptops only, its own card outside the letter, clear of the letter and of
// their faces (the face rect in scenes.json, placed the way object-fit: cover places the photo).
const scenes = JSON.parse(fs.readFileSync("src/content/scenes.json", "utf8"))

test("the QR card is laptop only, outside the letter and clear of their faces", async ({ page }, info) => {
  await page.addInitScript(() => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-music", "off") })
  if (info.project.name === "phone") {
    for (const w of [390, 768]) { await page.setViewportSize({ width: w, height: 844 }); await page.goto("?h=sample"); await page.waitForLoadState("networkidle"); await expect(page.locator(".phone-qr")).toHaveCount(0) }
    return
  }
  for (const theme of ["autumn", "lantern"]) for (const [w, h] of [[1024, 768], [1280, 800], [1440, 900], [1920, 1080]]) {
    await page.setViewportSize({ width: w, height: h })
    await page.addInitScript((t) => localStorage.setItem("ng-theme", t), theme)
    await page.goto("?h=sample"); await page.waitForLoadState("networkidle")
    await expect(page.locator(".phone-qr")).toBeVisible()
    await expect(page.locator("#letter .phone-qr")).toHaveCount(0)
    const r = await page.evaluate((scenes) => {
      const box = document.querySelector<HTMLElement>("[data-photo].opacity-100")!, img = box.querySelector("img")!, name = box.dataset.photo!
      const meta = matchMedia("(min-width: 1280px)").matches && scenes[name].wide ? scenes[name].wide : scenes[name]
      const ir = img.getBoundingClientRect(), s = Math.max(ir.width / meta.w, ir.height / meta.h)
      const [px, py] = getComputedStyle(img).objectPosition.split(" ").map((v) => parseFloat(v) / 100)
      const ox = ir.left + (ir.width - meta.w * s) * px, oy = ir.top + (ir.height - meta.h * s) * py
      const [x0, y0, x1, y1] = meta.face
      const face = { left: ox + x0 * meta.w * s, top: oy + y0 * meta.h * s, right: ox + x1 * meta.w * s, bottom: oy + y1 * meta.h * s }
      const q = document.querySelector(".phone-qr")!.getBoundingClientRect(), l = document.getElementById("letter")!.getBoundingClientRect()
      const hit = (a: DOMRect, z: { left: number; top: number; right: number; bottom: number }) => !(a.right <= z.left || a.left >= z.right || a.bottom <= z.top || a.top >= z.bottom)
      return { onFace: hit(q, face), onLetter: hit(q, l), right: innerWidth - q.right, bottom: innerHeight - q.bottom }
    }, scenes)
    expect(r, `${w}x${h} ${theme}`).toMatchObject({ onFace: false, onLetter: false })
    expect(r.right).toBeLessThan(48); expect(r.bottom).toBeLessThan(48) // bottom right
  }
})
