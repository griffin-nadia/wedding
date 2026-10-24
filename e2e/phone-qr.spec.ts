import { test, expect } from "@playwright/test"
import fs from "node:fs"

// "Open on your phone" (docs/quality.md): laptops only, its own card outside the letter, clear of the letter and of
// their faces (the face rect in scenes.json, placed the way object-fit: cover places the photo).
const scenes = JSON.parse(fs.readFileSync("src/content/scenes.json", "utf8"))

test("the QR card is laptop only, Home only, outside the letter and clear of their faces", async ({ page }, info) => {
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
  // Run 27: on Home only
  for (const path of ["the-day", "travel", "our-story", "faqs"]) {
    await page.goto(`${path}?h=sample`); await page.waitForLoadState("networkidle")
    await expect(page.locator(".phone-qr"), path).toHaveCount(0)
  }
})

// Run 21: the softer QR (rounded modules and eyes, a hand-drawn frame) still scans. The code is screenshotted at the
// size it's shown, with the card's paper behind it, and decoded with jsQR, in both themes (Lantern is light ink on
// dark paper, so the decoder tries the inverted image too, as phone cameras do).
test("the QR scans at the size it's shown, in both themes", async ({ page }, info) => {
  test.skip(info.project.name === "phone", "laptops")
  for (const theme of ["autumn", "lantern"]) {
    await page.addInitScript((t) => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-music", "off"); localStorage.setItem("ng-theme", t) }, theme)
    await page.goto("?h=sample"); await page.waitForLoadState("networkidle")
    const code = page.locator(".phone-qr svg")
    await expect(code.locator("path").first()).toBeAttached()
    const png = (await code.screenshot()).toString("base64")
    await page.addScriptTag({ path: "node_modules/jsqr/dist/jsQR.js" })
    const text = await page.evaluate(async (b64) => {
      const img = new Image(); img.src = `data:image/png;base64,${b64}`; await img.decode()
      const c = document.createElement("canvas"); c.width = img.width; c.height = img.height
      const g = c.getContext("2d")!; g.drawImage(img, 0, 0)
      const px = g.getImageData(0, 0, c.width, c.height)
      const jsQR = (window as unknown as { jsQR: (d: Uint8ClampedArray, w: number, h: number, o: object) => { data: string } | null }).jsQR
      return jsQR(px.data, px.width, px.height, { inversionAttempts: "attemptBoth" })?.data ?? null
    }, png)
    expect(text, theme).toMatch(/\/wedding\/\?h=sample$/)
  }
})
