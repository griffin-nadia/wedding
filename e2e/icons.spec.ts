import { test, expect } from "@playwright/test"

// 18e: the wax seal is the icon everywhere: a tab (.ico with 16, 32 and 48), a phone's home screen (apple-touch 180)
// and an installed site (the manifest's 192, 512 and maskable 512)
test("every icon the page and manifest point to is there, at the size it says", async ({ page, request }, info) => {
  test.skip(info.project.name !== "laptop", "once is enough")
  await page.goto("?h=sample")
  const hrefs = await page.evaluate(() => [...document.querySelectorAll<HTMLLinkElement>("link[rel=icon], link[rel=apple-touch-icon], link[rel=manifest]")].map((l) => l.href))
  for (const h of hrefs) expect((await request.get(h)).status(), h).toBe(200)
  const ico = await (await request.get(hrefs.find((h) => h.endsWith(".ico"))!)).body()
  expect([ico.readUInt16LE(4), ico[6], ico[22], ico[38]]).toEqual([3, 16, 32, 48])
  const manifest = await (await request.get(hrefs.find((h) => h.endsWith(".webmanifest"))!)).json()
  for (const icon of manifest.icons) {
    const size = await page.evaluate(async (src) => { const i = new Image(); i.src = src; await i.decode(); return `${i.naturalWidth}x${i.naturalHeight}` }, new URL(icon.src, page.url()).href)
    expect(size, icon.src).toBe(icon.sizes)
  }
  expect(manifest.icons.some((i: { purpose: string }) => i.purpose === "maskable")).toBe(true)
})
