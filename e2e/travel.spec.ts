import { test, expect } from "@playwright/test"

// 18f: Travel's sub-tab strip never cuts a link at a hard edge, and on "Around the venue" no label sits on the river,
// a route, a leaf or another label
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => { localStorage.setItem("ng-opened", "1"); localStorage.setItem("ng-music", "off") })
})

test("the jump links: the active one in full, soft fades where more links are past the edge", async ({ page }) => {
  await page.goto("travel?h=sample#before")
  await page.waitForTimeout(800)
  const strip = page.locator(".jump-links ul")
  const r = await strip.evaluate((ul) => {
    const a = ul.querySelector("[aria-current]")!.getBoundingClientRect(), u = ul.getBoundingClientRect()
    const css = getComputedStyle(ul)
    return { inside: a.left >= u.left - 1 && a.right <= u.right + 1, mask: css.maskImage || css.webkitMaskImage, overflow: ul.scrollWidth > ul.clientWidth, left: ul.hasAttribute("data-more-left"), right: ul.hasAttribute("data-more-right"), scrolled: ul.scrollLeft }
  })
  expect(r.inside).toBe(true)
  expect(r.mask).toContain("linear-gradient")
  if (r.overflow) expect(r.left || r.right).toBe(true)
  expect(r.left).toBe(r.scrolled > 2)
})

test("around the venue: no label overlaps the river, a route, a leaf or another label", async ({ page }) => {
  await page.goto("travel?h=sample#around")
  const map = page.locator(".kmap")
  await map.scrollIntoViewIfNeeded()
  for (const name of ["The Sodoh", "Kyoto Station", "Gion-Shijo Station", "Yasaka Pagoda"]) {
    await map.getByRole("button", { name: new RegExp(name) }).click()
    const hits = await page.evaluate(() => {
      const box = (e: Element) => e.getBoundingClientRect()
      const over = (a: DOMRect, b: DOMRect) => a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1
      const tags = [...document.querySelectorAll(".kmap-tag")].map(box).filter((r) => r.width > 2)
      const things = [...document.querySelectorAll(".kmap-leaf, .kmap-river-label")].map(box)
      // The river and the routes, sampled along their length
      const paths = [...document.querySelectorAll<SVGPathElement>(".kmap-river, .kmap-route")].flatMap((p) => {
        const m = p.getScreenCTM()!, n = p.getTotalLength(), pts: DOMRect[] = []
        for (let i = 0; i <= 60; i++) { const q = p.getPointAtLength((n * i) / 60).matrixTransform(m); pts.push(new DOMRect(q.x - 1, q.y - 1, 2, 2)) }
        return pts
      })
      let n = 0
      tags.forEach((t, i) => { n += [...things, ...paths].filter((b) => over(t, b)).length; n += tags.filter((u, j) => j > i && over(t, u)).length })
      return n
    })
    expect(hits, name).toBe(0)
  }
})
